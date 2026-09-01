import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import * as lanesService from '@/services/lanes'
import { supabase } from '@/lib/supabase'

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
  updateLane: (id: number | string, updates: Partial<Lane>) => Promise<Lane | null>
  removeLane: (id: number | string) => Promise<boolean>
  moveLane: (id: number | string, direction: 'left' | 'right') => Promise<void>
  reorderLanes: (reordered: Lane[]) => Promise<void>
}

let realtimeCleanup: (() => void) | null = null

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

      const data = await lanesService.getLanesByBoardId(boardId)
      set({ lanes: data, loading: false })

      // Realtime subscription — refetch on changes
      const channel = lanesService.subscribeLanes(boardId, () => {
        lanesService.getLanesByBoardId(boardId).then((fresh) => {
          set({ lanes: fresh })
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
      const currentLanes = get().lanes
      const maxOrder = currentLanes.length > 0 ? Math.max(...currentLanes.map((l) => l.order ?? 0)) : 0
      const order = maxOrder + 1

      const tempId = -Date.now()
      const optimistic: Lane = {
        id: tempId,
        board_id: draft.board_id ?? (get().boardId ? Number(get().boardId) : null),
        title: draft.title ?? 'New Lane',
        description: draft.description ?? null,
        background: draft.background ?? null,
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
      const current = [...get().lanes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      const index = current.findIndex((l) => String(l.id) === String(id))

      if (index === -1) return
      if (direction === 'left' && index === 0) return
      if (direction === 'right' && index === current.length - 1) return

      const targetIndex = direction === 'left' ? index - 1 : index + 1
      const temp = current[index]
      current[index] = current[targetIndex]
      current[targetIndex] = temp

      // Update orders
      const reordered = current.map((l, i) => ({ ...l, order: i + 1 }))
      await get().reorderLanes(reordered)
    },

    // ── Optimistic reorder ─────────────────────────────────────
    reorderLanes: async (reordered: Lane[]) => {
      const prevLanes = get().lanes
      const withOrder = reordered.map((l, i) => ({ ...l, order: i + 1 }))
      const orderMap = new Map(withOrder.map((l) => [l.id, l.order]))

      set((s) => ({
        lanes: s.lanes
          .map((l) => (orderMap.has(l.id) ? { ...l, order: orderMap.get(l.id) } : l))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      }))

      const updates = withOrder.map((l) => lanesService.updateLane(l.id, { order: l.order }))
      const results = await Promise.all(updates)

      if (results.some((r) => r === null)) {
        set({ lanes: prevLanes })
      }
    }
  }))
)

// Selectors
export const selectLanes = (s: LanesState) => s.lanes
export const selectLanesLoading = (s: LanesState) => s.loading
