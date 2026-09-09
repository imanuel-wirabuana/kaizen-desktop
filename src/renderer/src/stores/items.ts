import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import * as itemsService from '@/services/items'
import {
  createItemsBulk,
  deleteItemsBulk,
  updateItemsCommonFields,
  updateItemsBulk
} from '@/services/bulk-items'
import { useBoardsStore } from '@/stores/boards'
import { supabase } from '@/lib/supabase'
import { broadcastSyncEvent, onSyncEvent } from '@/lib/realtime'

type ItemsState = {
  items: KanbanItem[]
  loading: boolean
  boardId: number | string | undefined

  // Lifecycle
  init: (boardId: number | string, force?: boolean) => Promise<void>
  refreshItems: (boardId?: number | string) => Promise<void>
  cleanup: () => void

  // Optimistic mutations
  addItem: (
    draft: Partial<Omit<KanbanItem, 'id' | 'created_at' | 'updated_at'>>
  ) => Promise<KanbanItem | null>
  updateItem: (id: number | string, updates: Partial<KanbanItem>) => Promise<KanbanItem | null>
  removeItem: (id: number | string) => Promise<boolean>
  moveItem: (id: number | string, targetLaneId: number | string | null, newOrder: number) => Promise<void>
  duplicateItem: (id: number | string) => Promise<KanbanItem | null>

  // Bulk operations
  bulkDuplicateItems: (itemIds: (number | string)[]) => Promise<KanbanItem[]>
  bulkMoveItems: (
    itemIds: (number | string)[],
    targetLaneId: number | string | null,
    targetBoardId?: number | string
  ) => Promise<void>
  bulkMoveItemsWithOrder: (
    itemsWithOrders: { id: number | string; lane_id: number | null; order: number }[]
  ) => Promise<void>
  bulkSetPriority: (itemIds: (number | string)[], priority: number) => Promise<void>
  bulkSetStatus: (itemIds: (number | string)[], status: boolean) => Promise<void>
  bulkSetAssignee: (itemIds: (number | string)[], assignee: string | null) => Promise<void>
  bulkSetBackground: (itemIds: (number | string)[], background: string | null) => Promise<void>
  bulkRemoveItems: (itemIds: (number | string)[]) => Promise<boolean>
}

let realtimeCleanup: (() => void) | null = null
let suppressRealtimeRefetch = false

export const useItemsStore = create<ItemsState>()(
  subscribeWithSelector((set, get) => ({
    items: [],
    loading: true,
    boardId: undefined,

    refreshItems: async (boardId?: number | string) => {
      const targetId = boardId ?? get().boardId
      if (!targetId) return
      try {
        const data = await itemsService.getItemsByBoardId(targetId)
        set({ boardId: targetId, items: data, loading: false })
      } catch (err) {
        console.error('Error in refreshItems:', err)
      }
    },

    init: async (boardId: number | string, force: boolean = false) => {
      const prevBoardId = get().boardId
      if (!force && String(prevBoardId) === String(boardId) && !get().loading) return

      realtimeCleanup?.()
      realtimeCleanup = null

      set({ boardId, items: [], loading: true })

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
      const currentBoardId = draft.board_id ?? get().boardId
      if (!currentBoardId || isNaN(Number(currentBoardId))) {
        console.error('addItem: cannot add item without a valid boardId', { draft, currentBoardId: get().boardId })
        return null
      }

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
        start_date: draft.start_date ?? null,
        due_date: draft.due_date ?? null,
        status: draft.status ?? false,
        assignee: draft.assignee ?? null,
        background: draft.background ?? null,
        owner: draft.owner ?? null,
        owner_info: draft.owner_info ?? null,
        order,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      set((s) => ({ items: [...s.items, optimistic] }))

      suppressRealtimeRefetch = true
      try {
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
      } finally {
        setTimeout(() => {
          suppressRealtimeRefetch = false
        }, 500)
      }
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

      suppressRealtimeRefetch = true
      try {
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
      } finally {
        setTimeout(() => {
          suppressRealtimeRefetch = false
        }, 500)
      }
    },

    // ── Optimistic Delete Item ──────────────────────────────
    removeItem: async (id) => {
      const prevItems = get().items
      const target = prevItems.find((i) => String(i.id) === String(id))
      if (!target) return false

      set((s) => ({ items: s.items.filter((i) => String(i.id) !== String(id)) }))
      broadcastSyncEvent('items')

      if (typeof id === 'number' && id < 0) return true

      suppressRealtimeRefetch = true
      try {
        const ok = await itemsService.deleteItem(id)

        if (!ok) {
          console.error(`removeItem: database delete failed for item ${id}, reverting`)
          set({ items: prevItems })
          broadcastSyncEvent('items')
          return false
        }

        if (target?.board_id) useBoardsStore.getState().touchBoardActivity(target.board_id)
        return true
      } finally {
        setTimeout(() => {
          suppressRealtimeRefetch = false
        }, 500)
      }
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
        start_date: target.start_date,
        due_date: target.due_date,
        status: target.status,
        assignee: target.assignee,
        background: target.background,
        owner: target.owner,
        owner_info: target.owner_info ?? null,
        order
      })
    },

    // ── Bulk Duplicate Items (Duplicated items go to draft lane) ───────
    bulkDuplicateItems: async (itemIds) => {
      const currentBoardId = get().boardId
      if (!currentBoardId) return []

      const idSet = new Set(itemIds.map(String))
      const targets = get().items.filter((i) => idSet.has(String(i.id)))
      if (targets.length === 0) return []

      const draftItems = get().items.filter((i) => i.lane_id === null)
      let maxOrder = draftItems.length > 0 ? Math.max(...draftItems.map((i) => i.order ?? 0)) : 0

      const draftsToCreate = targets.map((target) => {
        maxOrder += 100
        return {
          board_id: Number(currentBoardId),
          lane_id: null,
          title: target.title ? `${target.title} (Copy)` : 'Untitled Task (Copy)',
          icon: target.icon,
          description: target.description,
          priority: target.priority,
          start_date: target.start_date,
          due_date: target.due_date,
          status: target.status,
          assignee: target.assignee,
          background: target.background,
          owner: target.owner,
          owner_info: target.owner_info ?? null,
          order: maxOrder
        }
      })

      suppressRealtimeRefetch = true
      try {
        const created = await createItemsBulk(draftsToCreate)
        if (created.length > 0) {
          set((s) => ({ items: [...s.items, ...created] }))
          broadcastSyncEvent('items')
          useBoardsStore.getState().touchBoardActivity(currentBoardId)
        }
        return created
      } catch (err) {
        console.error('bulkDuplicateItems failed:', err)
        return []
      } finally {
        setTimeout(() => {
          suppressRealtimeRefetch = false
        }, 500)
      }
    },

    // ── Bulk Move Items ──────────────────────────────────────────────
    bulkMoveItems: async (itemIds, targetLaneId, targetBoardId) => {
      const currentBoardId = get().boardId
      const idSet = new Set(itemIds.map(String))
      const normalizedTargetLane =
        targetLaneId !== null && !isNaN(Number(targetLaneId)) ? Number(targetLaneId) : null
      const isDifferentBoard =
        targetBoardId !== undefined && String(targetBoardId) !== String(currentBoardId)

      if (isDifferentBoard) {
        // Move to a different board: remove from current board view and update DB
        set((s) => ({ items: s.items.filter((i) => !idSet.has(String(i.id))) }))
        broadcastSyncEvent('items')

        const updates = itemIds.map((id) => ({
          id: Number(id),
          data: {
            board_id: Number(targetBoardId),
            lane_id: normalizedTargetLane,
            order: 100
          }
        }))
        await updateItemsBulk(updates)
        if (currentBoardId) useBoardsStore.getState().touchBoardActivity(currentBoardId)
        useBoardsStore.getState().touchBoardActivity(targetBoardId)
      } else {
        // Move within current board
        set((s) => ({
          items: s.items.map((i) =>
            idSet.has(String(i.id))
              ? { ...i, lane_id: normalizedTargetLane, updated_at: new Date().toISOString() }
              : i
          )
        }))
        broadcastSyncEvent('items')

        await updateItemsCommonFields(itemIds, { lane_id: normalizedTargetLane })
        if (currentBoardId) useBoardsStore.getState().touchBoardActivity(currentBoardId)
      }
    },

    // ── Bulk Move Items with Calculated Orders ────────────────────────
    bulkMoveItemsWithOrder: async (itemsWithOrders) => {
      const currentBoardId = get().boardId
      if (itemsWithOrders.length === 0) return

      const orderMap = new Map(itemsWithOrders.map((i) => [String(i.id), i]))

      set((s) => ({
        items: s.items.map((i) => {
          const update = orderMap.get(String(i.id))
          if (update) {
            return {
              ...i,
              lane_id: update.lane_id,
              order: update.order,
              updated_at: new Date().toISOString()
            }
          }
          return i
        })
      }))

      broadcastSyncEvent('items')

      suppressRealtimeRefetch = true
      try {
        const dbUpdates = itemsWithOrders.map((item) => ({
          id: Number(item.id),
          data: {
            lane_id: item.lane_id,
            order: item.order
          }
        }))
        await updateItemsBulk(dbUpdates)
        if (currentBoardId) useBoardsStore.getState().touchBoardActivity(currentBoardId)
      } catch (err) {
        console.error('bulkMoveItemsWithOrder failed:', err)
      } finally {
        setTimeout(() => {
          suppressRealtimeRefetch = false
        }, 500)
      }
    },

    // ── Bulk Set Priority ─────────────────────────────────────────────
    bulkSetPriority: async (itemIds, priority) => {
      const currentBoardId = get().boardId
      const idSet = new Set(itemIds.map(String))

      set((s) => ({
        items: s.items.map((i) =>
          idSet.has(String(i.id))
            ? { ...i, priority, updated_at: new Date().toISOString() }
            : i
        )
      }))
      broadcastSyncEvent('items')

      await updateItemsCommonFields(itemIds, { priority })
      if (currentBoardId) useBoardsStore.getState().touchBoardActivity(currentBoardId)
    },

    // ── Bulk Set Status ───────────────────────────────────────────────
    bulkSetStatus: async (itemIds, status) => {
      const currentBoardId = get().boardId
      const idSet = new Set(itemIds.map(String))

      set((s) => ({
        items: s.items.map((i) =>
          idSet.has(String(i.id))
            ? { ...i, status, updated_at: new Date().toISOString() }
            : i
        )
      }))
      broadcastSyncEvent('items')

      await updateItemsCommonFields(itemIds, { status })
      if (currentBoardId) useBoardsStore.getState().touchBoardActivity(currentBoardId)
    },

    // ── Bulk Set Assignee ─────────────────────────────────────────────
    bulkSetAssignee: async (itemIds, assignee) => {
      const currentBoardId = get().boardId
      const idSet = new Set(itemIds.map(String))

      set((s) => ({
        items: s.items.map((i) =>
          idSet.has(String(i.id))
            ? { ...i, assignee, updated_at: new Date().toISOString() }
            : i
        )
      }))
      broadcastSyncEvent('items')

      await updateItemsCommonFields(itemIds, { assignee })
      if (currentBoardId) useBoardsStore.getState().touchBoardActivity(currentBoardId)
    },

    // ── Bulk Set Background Accent ───────────────────────────────────
    bulkSetBackground: async (itemIds, background) => {
      const currentBoardId = get().boardId
      const idSet = new Set(itemIds.map(String))

      set((s) => ({
        items: s.items.map((i) =>
          idSet.has(String(i.id))
            ? { ...i, background: background || null, updated_at: new Date().toISOString() }
            : i
        )
      }))
      broadcastSyncEvent('items')

      await updateItemsCommonFields(itemIds, { background: background || null })
      if (currentBoardId) useBoardsStore.getState().touchBoardActivity(currentBoardId)
    },

    // ── Bulk Remove Items ────────────────────────────────────────────
    bulkRemoveItems: async (itemIds) => {
      const currentBoardId = get().boardId
      const idSet = new Set(itemIds.map(String))

      set((s) => ({
        items: s.items.filter((i) => !idSet.has(String(i.id)))
      }))
      broadcastSyncEvent('items')

      const ok = await deleteItemsBulk(itemIds)
      if (currentBoardId) useBoardsStore.getState().touchBoardActivity(currentBoardId)
      return ok
    }
  }))
)

// Selectors
export const selectItems = (s: ItemsState) => s.items
export const selectItemsLoading = (s: ItemsState) => s.loading
