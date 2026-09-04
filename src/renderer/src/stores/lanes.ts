import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import * as lanesService from '@/services/lanes'
import * as boardsService from '@/services/boards'
import { useItemsStore } from '@/stores/items'
import { useBoardsStore } from '@/stores/boards'
import { supabase } from '@/lib/supabase'
import { broadcastSyncEvent, onSyncEvent } from '@/lib/realtime'

export function createVirtualDraftLane(boardId: number | string): Lane {
  return {
    id: null,
    board_id: Number(boardId),
    title: 'Draft',
    description: 'Unassigned & draft items',
    background: null,
    order: -Infinity,
    isVirtual: true,
    created_at: new Date().toISOString()
  }
}

type LanesState = {
  lanes: Lane[]
  loading: boolean
  boardId: number | string | undefined

  // Lifecycle
  init: (boardId: number | string, force?: boolean) => Promise<void>
  refreshLanes: (boardId?: number | string) => Promise<void>
  cleanup: () => void

  // Optimistic mutations
  addLane: (
    draft: Partial<Omit<Lane, 'id' | 'created_at' | 'updated_at'>>
  ) => Promise<Lane | null>
  updateLane: (id: number | string | null, updates: Partial<Lane>) => Promise<Lane | null>
  removeLane: (id: number | string | null) => Promise<boolean>
  moveLane: (id: number | string | null, direction: 'left' | 'right') => Promise<void>
  moveLaneToBoard: (laneId: number | string, targetBoardId: number | string) => Promise<boolean>
  reorderLanes: (reordered: Lane[]) => Promise<void>
  duplicateLane: (laneId: number | string, includeItems?: boolean) => Promise<Lane | null>
}

let realtimeCleanup: (() => void) | null = null
let suppressRealtimeRefetch = false

export const useLanesStore = create<LanesState>()(
  subscribeWithSelector((set, get) => ({
    lanes: [],
    loading: true,
    boardId: undefined,

    refreshLanes: async (boardId?: number | string) => {
      const targetId = boardId ?? get().boardId
      if (!targetId) return
      try {
        const userLanes = await lanesService.getLanesByBoardId(targetId)
        const virtualDraft = createVirtualDraftLane(targetId)
        set({ boardId: targetId, lanes: [virtualDraft, ...userLanes], loading: false })
      } catch (err) {
        console.error('Error in refreshLanes:', err)
      }
    },

    init: async (boardId: number | string, force: boolean = false) => {
      const prevBoardId = get().boardId
      if (!force && String(prevBoardId) === String(boardId) && !get().loading) return

      realtimeCleanup?.()
      realtimeCleanup = null

      set({ boardId, lanes: [createVirtualDraftLane(boardId)], loading: true })

      const userLanes = await lanesService.getLanesByBoardId(boardId)
      const virtualDraft = createVirtualDraftLane(boardId)
      set({ lanes: [virtualDraft, ...userLanes], loading: false })

      // 1. Postgres changes subscription
      const channel = lanesService.subscribeLanes(boardId, () => {
        if (suppressRealtimeRefetch) return
        lanesService.getLanesByBoardId(boardId).then((fresh) => {
          set({ lanes: [createVirtualDraftLane(boardId), ...fresh] })
        })
      })

      // 2. Peer-to-peer broadcast subscription (<50ms delivery)
      const unsubBroadcast = onSyncEvent((event) => {
        if (event === 'lanes') {
          const currentBoardId = get().boardId
          if (!currentBoardId || suppressRealtimeRefetch) return
          lanesService.getLanesByBoardId(currentBoardId).then((fresh) => {
            set({ lanes: [createVirtualDraftLane(currentBoardId), ...fresh] })
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
      set({ lanes: [], boardId: undefined, loading: false })
    },

    // ── Optimistic create ──────────────────────────────────────
    addLane: async (draft) => {
      const realLanes = get().lanes.filter((l) => l.id !== null)
      const maxOrder = realLanes.length > 0 ? Math.max(...realLanes.map((l) => l.order ?? 0)) : 0
      const order = maxOrder + 1

      const tempId = -Date.now()
      const optimistic: Lane = {
        id: tempId,
        board_id: draft.board_id ?? (get().boardId ? Number(get().boardId) : null),
        title: draft.title ?? 'New Lane',
        icon: draft.icon ?? null,
        description: draft.description ?? null,
        background: draft.background ?? null,
        owner: draft.owner ?? null,
        order,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      set((s) => ({ lanes: [...s.lanes, optimistic] }))

      suppressRealtimeRefetch = true
      try {
        const result = await lanesService.createLane({
          ...draft,
          board_id: optimistic.board_id,
          order
        })

        if (!result) {
          set((s) => ({ lanes: s.lanes.filter((l) => l.id !== tempId) }))
          return null
        }

        set((s) => ({
          lanes: s.lanes.map((l) => (l.id === tempId ? result : l))
        }))
        broadcastSyncEvent('lanes')
        if (result?.board_id) useBoardsStore.getState().touchBoardActivity(result.board_id)
        return result
      } finally {
        setTimeout(() => {
          suppressRealtimeRefetch = false
        }, 500)
      }
    },

    // ── Optimistic update ──────────────────────────────────────
    updateLane: async (id, updates) => {
      if (id === null || String(id) === 'null') return null

      const prevLane = get().lanes.find((l) => String(l.id) === String(id))
      if (!prevLane) return null

      set((s) => ({
        lanes: s.lanes.map((l) =>
          String(l.id) === String(id)
            ? { ...l, ...updates, updated_at: new Date().toISOString() }
            : l
        )
      }))

      broadcastSyncEvent('lanes')

      suppressRealtimeRefetch = true
      try {
        const result = await lanesService.updateLane(id, updates)

        if (!result) {
          set((s) => ({
            lanes: s.lanes.map((l) => (String(l.id) === String(id) ? prevLane : l))
          }))
          broadcastSyncEvent('lanes')
          return null
        }

        set((s) => ({
          lanes: s.lanes.map((l) => (String(l.id) === String(id) ? result : l))
        }))
        if (result?.board_id) useBoardsStore.getState().touchBoardActivity(result.board_id)
        return result
      } finally {
        setTimeout(() => {
          suppressRealtimeRefetch = false
        }, 500)
      }
    },

    // ── Optimistic delete ──────────────────────────────────────
    removeLane: async (id) => {
      if (id === null || String(id) === 'null') return false

      const prevLanes = get().lanes
      const target = prevLanes.find((l) => String(l.id) === String(id))
      if (!target) return false

      set((s) => ({ lanes: s.lanes.filter((l) => String(l.id) !== String(id)) }))
      broadcastSyncEvent('lanes')

      suppressRealtimeRefetch = true
      try {
        const ok = await lanesService.deleteLane(id)

        if (!ok) {
          set({ lanes: prevLanes })
          broadcastSyncEvent('lanes')
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

    // ── Move lane left/right ───────────────────────────────────
    moveLane: async (id, direction) => {
      if (id === null || String(id) === 'null') return

      const realLanes = get().lanes.filter((l) => l.id !== null).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      const index = realLanes.findIndex((l) => String(l.id) === String(id))

      if (index === -1) return
      if (direction === 'left' && index === 0) return
      if (direction === 'right' && index === realLanes.length - 1) return

      const targetIndex = direction === 'left' ? index - 1 : index + 1
      const reordered = [...realLanes]
      const [moved] = reordered.splice(index, 1)
      reordered.splice(targetIndex, 0, moved)

      await get().reorderLanes(reordered)
    },

    // ── Move lane to another board ──────────────────────────────
    moveLaneToBoard: async (laneId: number | string, targetBoardId: number | string) => {
      if (laneId === null || String(laneId) === 'null') return false

      suppressRealtimeRefetch = true

      const prevLanes = get().lanes
      const prevItems = useItemsStore.getState().items

      // Optimistically remove lane from current board view
      set((s) => ({
        lanes: s.lanes.filter((l) => String(l.id) !== String(laneId))
      }))

      // Optimistically remove lane's items from current board items state
      useItemsStore.setState({
        items: prevItems.filter((i) => String(i.lane_id) !== String(laneId))
      })

      broadcastSyncEvent('lanes')
      broadcastSyncEvent('boards')
      broadcastSyncEvent('items')

      const success = await lanesService.moveLaneToBoard(laneId, targetBoardId)

      setTimeout(() => {
        suppressRealtimeRefetch = false
      }, 500)

      if (!success) {
        // Rollback
        set({ lanes: prevLanes })
        useItemsStore.setState({ items: prevItems })
        broadcastSyncEvent('lanes')
        broadcastSyncEvent('boards')
        broadcastSyncEvent('items')
        return false
      }

      useBoardsStore.getState().refresh()
      return true
    },

    // ── Optimistic reorder ─────────────────────────────────────
    reorderLanes: async (reordered: Lane[]) => {
      const currentBoardId = get().boardId
      const realReordered = reordered.filter((l) => l.id !== null)
      const prevLanes = get().lanes

      const withOrder = realReordered.map((l, i) => ({ ...l, order: i + 1 }))
      const orderMap = new Map(withOrder.map((l) => [String(l.id), l.order]))

      const draftLane = currentBoardId ? createVirtualDraftLane(currentBoardId) : null
      const updatedRealLanes = prevLanes
        .filter((l) => l.id !== null)
        .map((l) => {
          const key = String(l.id)
          return orderMap.has(key) ? { ...l, order: orderMap.get(key)! } : l
        })
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

      set({ lanes: draftLane ? [draftLane, ...updatedRealLanes] : updatedRealLanes })
      broadcastSyncEvent('lanes')

      // Suppress realtime refetch during batch update to prevent race conditions
      suppressRealtimeRefetch = true
      try {
        const updates = withOrder.map((l) => lanesService.updateLane(Number(l.id), { order: l.order }))
        const results = await Promise.all(updates)

        if (results.some((r) => r === null)) {
          console.error('reorderLanes: one or more lane database updates failed, reverting')
          set({ lanes: prevLanes })
          broadcastSyncEvent('lanes')
        }
      } catch (err) {
        console.error('reorderLanes error:', err)
        set({ lanes: prevLanes })
        broadcastSyncEvent('lanes')
      } finally {
        suppressRealtimeRefetch = false
      }
    },

    // ── Duplicate Lane ──────────────────────────────────────
    duplicateLane: async (laneId, includeItems = false) => {
      if (laneId === null || String(laneId) === 'null') return null

      const target = get().lanes.find((l) => String(l.id) === String(laneId))
      if (!target || target.id === null) return null

      const realLanes = get().lanes.filter((l) => l.id !== null)
      const order = realLanes.length + 1
      const copyTitle = target.title ? `${target.title} (Copy)` : 'Untitled Lane (Copy)'

      const newLane = await get().addLane({
        board_id: target.board_id,
        title: copyTitle,
        icon: target.icon,
        description: target.description,
        background: target.background,
        owner: target.owner,
        order
      })

      if (newLane && newLane.id && includeItems) {
        const itemsToCopy = useItemsStore.getState().items.filter(
          (i) => String(i.lane_id) === String(target.id)
        )

        for (let idx = 0; idx < itemsToCopy.length; idx++) {
          const item = itemsToCopy[idx]
          await useItemsStore.getState().addItem({
            board_id: newLane.board_id ? Number(newLane.board_id) : undefined,
            lane_id: Number(newLane.id),
            title: item.title,
            icon: item.icon,
            description: item.description,
            priority: item.priority,
            due_date: item.due_date,
            background: item.background,
            owner: item.owner,
            order: idx + 1
          })
        }
      }

      broadcastSyncEvent('lanes')
      return newLane
    }
  }))
)

// Selectors
export const selectLanes = (s: LanesState) => s.lanes
export const selectLanesLoading = (s: LanesState) => s.loading
