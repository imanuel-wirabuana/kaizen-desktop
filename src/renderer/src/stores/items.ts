import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import * as itemsService from '@/services/items'
import { useBoardsStore } from '@/stores/boards'
import { supabase } from '@/lib/supabase'
import { broadcastSyncEvent, onSyncEvent } from '@/lib/realtime'

type ItemsState = {
  items: KanbanItem[]
  loading: boolean
  boardId: number | string | undefined

  // Lifecycle
  init: (boardId: number | string) => Promise<void>
  cleanup: () => void

  // Optimistic mutations
  addItem: (
    draft: Partial<Omit<KanbanItem, 'id' | 'created_at' | 'updated_at'>>
  ) => Promise<KanbanItem | null>
  updateItem: (id: number | string, updates: Partial<KanbanItem>) => Promise<KanbanItem | null>
  removeItem: (id: number | string) => Promise<boolean>
  moveItem: (id: number | string, targetLaneId: number | string | null, newOrder: number) => Promise<void>
  duplicateItem: (id: number | string) => Promise<KanbanItem | null>
}

let realtimeCleanup: (() => void) | null = null
let suppressRealtimeRefetch = false

export const useItemsStore = create<ItemsState>()(
  subscribeWithSelector((set, get) => ({
    items: [],
    loading: true,
    boardId: undefined,

    init: async (boardId: number | string) => {
      const prevBoardId = get().boardId
      if (String(prevBoardId) === String(boardId) && !get().loading) return

      realtimeCleanup?.()
      realtimeCleanup = null

      set({ boardId, loading: true })

      const data = await itemsService.getItemsByBoardId(boardId)
      set({ items: data, loading: false })

      // 1. Postgres changes subscription
      const channel = itemsService.subscribeItems(boardId, () => {
        if (suppressRealtimeRefetch) return
        itemsService.getItemsByBoardId(boardId).then((fresh) => {
          set({ items: fresh })
        })
      })

      // 2. Peer-to-peer broadcast subscription (<50ms delivery)
      const unsubBroadcast = onSyncEvent((event) => {
        if (event === 'items' || event === 'lanes') {
          const currentBoardId = get().boardId
          if (!currentBoardId || suppressRealtimeRefetch) return
          itemsService.getItemsByBoardId(currentBoardId).then((fresh) => {
            set({ items: fresh })
          })
        }
      })

      realtimeCleanup = () => {
        supabase.removeChannel(channel)
        unsubBroadcast()
      }
    },

    cleanup: () => {
      realtimeCleanup?.()
      realtimeCleanup = null
      set({ items: [], boardId: undefined, loading: false })
    },

    // ── Optimistic Create Item ──────────────────────────────
    addItem: async (draft) => {
      const currentBoardId = get().boardId
      if (!currentBoardId) return null

      const laneId = draft.lane_id !== undefined && draft.lane_id !== null ? (typeof draft.lane_id === 'number' || !isNaN(Number(draft.lane_id)) ? Number(draft.lane_id) : draft.lane_id) : null
      const sameLaneItems = get().items.filter(
        (i) => (i.lane_id === null && laneId === null) || (i.lane_id !== null && String(i.lane_id) === String(laneId))
      )

      const maxOrder = sameLaneItems.length > 0 ? Math.max(...sameLaneItems.map((i) => i.order ?? 0)) : 0
      const order = draft.order ?? maxOrder + 100

      const tempId = -Date.now()
      const optimistic: KanbanItem = {
        id: tempId,
        board_id: Number(currentBoardId),
        lane_id: laneId,
        title: draft.title ?? 'New Task',
        icon: draft.icon ?? null,
        description: draft.description ?? null,
        priority: draft.priority ?? 0,
        due_date: draft.due_date ?? null,
        background: draft.background ?? null,
        owner: draft.owner ?? null,
        order,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      set((s) => ({ items: [...s.items, optimistic] }))

      const result = await itemsService.createItem({
        ...draft,
        board_id: Number(currentBoardId),
        lane_id: laneId,
        order
      })

      if (!result) {
        console.error('addItem: database insert failed, reverting optimistic item')
        set((s) => ({ items: s.items.filter((i) => String(i.id) !== String(tempId)) }))
        return null
      }

      set((s) => ({
        items: s.items.map((i) => (String(i.id) === String(tempId) ? result : i))
      }))
      broadcastSyncEvent('items')
      if (result?.board_id) useBoardsStore.getState().touchBoardActivity(result.board_id)
      return result
    },

    // ── Optimistic Update Item ──────────────────────────────
    updateItem: async (id, updates) => {
      const prevItem = get().items.find((i) => String(i.id) === String(id))
      if (!prevItem) return null

      set((s) => ({
        items: s.items.map((i) =>
          String(i.id) === String(id) ? { ...i, ...updates, updated_at: new Date().toISOString() } : i
        )
      }))

      broadcastSyncEvent('items')

      if (typeof id === 'number' && id < 0) return prevItem

      const result = await itemsService.updateItem(id, updates)

      if (!result) {
        console.error(`updateItem: database update failed for item ${id}, reverting`)
        set((s) => ({
          items: s.items.map((i) => (String(i.id) === String(id) ? prevItem : i))
        }))
        broadcastSyncEvent('items')
        return null
      }

      set((s) => ({
        items: s.items.map((i) => (String(i.id) === String(id) ? result : i))
      }))
      if (result?.board_id) useBoardsStore.getState().touchBoardActivity(result.board_id)
      return result
    },

    // ── Optimistic Delete Item ──────────────────────────────
    removeItem: async (id) => {
      const prevItems = get().items
      const target = prevItems.find((i) => String(i.id) === String(id))
      if (!target) return false

      set((s) => ({ items: s.items.filter((i) => String(i.id) !== String(id)) }))
      broadcastSyncEvent('items')

      if (typeof id === 'number' && id < 0) return true

      const ok = await itemsService.deleteItem(id)

      if (!ok) {
        console.error(`removeItem: database delete failed for item ${id}, reverting`)
        set({ items: prevItems })
        broadcastSyncEvent('items')
        return false
      }

      if (target?.board_id) useBoardsStore.getState().touchBoardActivity(target.board_id)
      return true
    },

    // ── Move item between lanes / reorder ───────────────────
    moveItem: async (id, targetLaneId, newOrder) => {
      const prevItems = get().items
      const normalizedTargetLane = targetLaneId !== null && !isNaN(Number(targetLaneId)) ? Number(targetLaneId) : null

      set((s) => ({
        items: s.items.map((i) =>
          String(i.id) === String(id)
            ? { ...i, lane_id: normalizedTargetLane, order: newOrder, updated_at: new Date().toISOString() }
            : i
        )
      }))

      broadcastSyncEvent('items')

      if (typeof id === 'number' && id < 0) return

      // Suppress realtime refetch during DB update to prevent DOM conflicts with dnd-kit
      suppressRealtimeRefetch = true
      try {
        const result = await itemsService.updateItem(id, {
          lane_id: normalizedTargetLane,
          order: newOrder
        })

        if (!result) {
          console.error(`moveItem: database update failed for item ${id}, reverting`)
          set({ items: prevItems })
          broadcastSyncEvent('items')
        }
      } finally {
        suppressRealtimeRefetch = false
      }
    },

    // ── Duplicate Item ──────────────────────────────────────
    duplicateItem: async (id) => {
      const target = get().items.find((i) => String(i.id) === String(id))
      if (!target) return null

      const sameLaneItems = get().items.filter(
        (i) => (target.lane_id === null && i.lane_id === null) || (target.lane_id !== null && String(i.lane_id) === String(target.lane_id))
      )
      const order = sameLaneItems.length + 1
      const copyTitle = target.title ? `${target.title} (Copy)` : 'Untitled Task (Copy)'

      return get().addItem({
        title: copyTitle,
        lane_id: target.lane_id,
        icon: target.icon,
        description: target.description,
        priority: target.priority,
        due_date: target.due_date,
        background: target.background,
        owner: target.owner,
        order
      })
    }
  }))
)

// Selectors
export const selectItems = (s: ItemsState) => s.items
export const selectItemsLoading = (s: ItemsState) => s.loading
