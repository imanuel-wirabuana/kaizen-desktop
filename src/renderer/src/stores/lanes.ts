import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import * as lanesService from '@/services/lanes'
import { useItemsStore } from '@/stores/items'
import { useBoardsStore } from '@/stores/boards'
import { supabase } from '@/lib/supabase'

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
  init: (boardId: number | string) => Promise<void>
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
}

let realtimeCleanup: (() => void) | null = null
let suppressRealtimeRefetch = false

export const useLanesStore = create<LanesState>()(
  subscribeWithSelector((set, get) => ({
    lanes: [],
    loading: true,
    boardId: undefined,

    init: async (boardId: number | string) => {
      const prevBoardId = get().boardId
      if (String(prevBoardId) === String(boardId) && !get().loading) return

      realtimeCleanup?.()
      realtimeCleanup = null

      set({ boardId, loading: true })

      const userLanes = await lanesService.getLanesByBoardId(boardId)
      const virtualDraft = createVirtualDraftLane(boardId)
      set({ lanes: [virtualDraft, ...userLanes], loading: false })

      // Realtime subscription — refetch on changes (unless suppressed during batch reorder)
      const channel = lanesService.subscribeLanes(boardId, () => {
        if (suppressRealtimeRefetch) return
        lanesService.getLanesByBoardId(boardId).then((fresh) => {
          set({ lanes: [createVirtualDraftLane(boardId), ...fresh] })
        })
      })

      realtimeCleanup = () => {
        supabase.removeChannel(channel)
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
      return result
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

      const result = await lanesService.updateLane(id, updates)

      if (!result) {
        set((s) => ({
          lanes: s.lanes.map((l) => (String(l.id) === String(id) ? prevLane : l))
        }))
        return null
      }

      set((s) => ({
        lanes: s.lanes.map((l) => (String(l.id) === String(id) ? result : l))
      }))
      return result
    },

    // ── Optimistic delete ──────────────────────────────────────
    removeLane: async (id) => {
      if (id === null || String(id) === 'null') return false

      const prevLanes = get().lanes
      const target = prevLanes.find((l) => String(l.id) === String(id))
      if (!target) return false

      set((s) => ({ lanes: s.lanes.filter((l) => String(l.id) !== String(id)) }))

      const ok = await lanesService.deleteLane(id)

      if (!ok) {
        set({ lanes: prevLanes })
        return false
      }

      return true
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

      const success = await lanesService.moveLaneToBoard(laneId, targetBoardId)

      setTimeout(() => {
        suppressRealtimeRefetch = false
      }, 500)

      if (!success) {
        // Rollback
        set({ lanes: prevLanes })
        useItemsStore.setState({ items: prevItems })
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

      // Suppress realtime refetch during batch update to prevent race conditions
      suppressRealtimeRefetch = true
      try {
        const updates = withOrder.map((l) => lanesService.updateLane(Number(l.id), { order: l.order }))
        const results = await Promise.all(updates)

        if (results.some((r) => r === null)) {
          console.error('reorderLanes: one or more lane database updates failed, reverting')
          set({ lanes: prevLanes })
        }
      } catch (err) {
        console.error('reorderLanes error:', err)
        set({ lanes: prevLanes })
      } finally {
        suppressRealtimeRefetch = false
      }
    }
  }))
)

// Selectors
export const selectLanes = (s: LanesState) => s.lanes
export const selectLanesLoading = (s: LanesState) => s.loading
