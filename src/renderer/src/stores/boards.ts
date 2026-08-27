import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import * as boardsService from '@/services/boards'
import { supabase } from '@/lib/supabase'

type BoardsState = {
  boards: Board[]
  loading: boolean
  owner: string | undefined

  // Actions
  init: (owner: string) => Promise<void>
  cleanup: () => void

  // Optimistic mutations
  addBoard: (
    draft: Partial<Omit<Board, 'id' | 'created_at' | 'updated_at'>>
  ) => Promise<Board | null>
  updateBoard: (id: number | string, updates: Partial<Board>) => Promise<Board | null>
  removeBoard: (id: number | string) => Promise<boolean>
  reorderBoards: (reordered: Board[]) => Promise<void>
}

let realtimeCleanup: (() => void) | null = null

export const useBoardsStore = create<BoardsState>()(
  subscribeWithSelector((set, get) => ({
    boards: [],
    loading: false,
    owner: undefined,

    init: async (owner: string) => {
      const prev = get().owner
      if (prev === owner) return // already watching this owner

      // Cleanup previous subscription
      get().cleanup()

      set({ owner, loading: true })

      const data = await boardsService.getBoards(owner)
      set({ boards: data, loading: false })

      // Realtime sync — refetch on any server change to stay consistent
      const channel = boardsService.subscribeBoards(() => {
        boardsService.getBoards(owner).then((fresh) => {
          set({ boards: fresh })
        })
      })

      realtimeCleanup = () => {
        supabase.removeChannel(channel)
      }
    },

    cleanup: () => {
      realtimeCleanup?.()
      realtimeCleanup = null
      set({ boards: [], owner: undefined, loading: false })
    },

    // ── Optimistic create ──────────────────────────────────────
    addBoard: async (draft) => {
      const maxOrder = Math.max(0, ...get().boards.map((b) => b.order ?? 0))
      const order = maxOrder + 1

      const tempId = -Date.now() // negative temp id, never collides with DB ids
      const optimistic: Board = {
        id: tempId,
        title: draft.title ?? null,
        description: draft.description ?? null,
        icon: draft.icon ?? '📋',
        pinned: draft.pinned ?? false,
        background: draft.background ?? null,
        owner: draft.owner ?? null,
        order,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Apply optimistically
      set((s) => ({ boards: [optimistic, ...s.boards] }))

      const result = await boardsService.createBoard({ ...draft, order })

      if (!result) {
        // Rollback
        set((s) => ({ boards: s.boards.filter((b) => b.id !== tempId) }))
        return null
      }

      // Replace temp with real
      set((s) => ({
        boards: s.boards.map((b) => (b.id === tempId ? result : b))
      }))
      return result
    },

    // ── Optimistic update ──────────────────────────────────────
    updateBoard: async (id, updates) => {
      const prev = get().boards.find((b) => b.id === id)
      if (!prev) return null

      // Apply optimistically
      set((s) => ({
        boards: s.boards.map((b) =>
          b.id === id ? { ...b, ...updates, updated_at: new Date().toISOString() } : b
        )
      }))

      const result = await boardsService.updateBoard(id, updates)

      if (!result) {
        // Rollback
        set((s) => ({
          boards: s.boards.map((b) => (b.id === id ? prev : b))
        }))
        return null
      }

      // Reconcile with server truth
      set((s) => ({
        boards: s.boards.map((b) => (b.id === id ? result : b))
      }))
      return result
    },

    // ── Optimistic delete ──────────────────────────────────────
    removeBoard: async (id) => {
      const prev = get().boards
      const target = prev.find((b) => b.id === id)
      if (!target) return false

      // Apply optimistically
      set((s) => ({ boards: s.boards.filter((b) => b.id !== id) }))

      const ok = await boardsService.deleteBoard(id)

      if (!ok) {
        // Rollback — restore at original position
        set({ boards: prev })
        return false
      }

      return true
    },

    // ── Optimistic reorder ─────────────────────────────────────
    reorderBoards: async (reordered: Board[]) => {
      const prev = get().boards

      // Build full new list with updated order index
      const withOrder = reordered.map((b, i) => ({ ...b, order: i }))
      const orderMap = new Map(withOrder.map((b) => [b.id, b.order]))

      // Apply locally
      set((s) => ({
        boards: s.boards.map((b) => (orderMap.has(b.id) ? { ...b, order: orderMap.get(b.id) } : b))
      }))

      // Persist all changed orders to DB
      const updates = withOrder
        .filter((b) => b.id !== undefined && b.id > 0)
        .map((b) => boardsService.updateBoard(b.id!, { order: b.order }))

      const results = await Promise.all(updates)
      if (results.some((r) => r === null)) {
        // Partial failure — rollback to previous state
        set({ boards: prev })
      }
    }
  }))
)

// ── Derived selectors (stable references) ──────────────────────
export const selectBoards = (s: BoardsState) => s.boards
export const selectPinnedBoards = (s: BoardsState) =>
  s.boards.filter((b) => Boolean(b.pinned)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
export const selectUnpinnedBoards = (s: BoardsState) =>
  s.boards.filter((b) => !b.pinned).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
export const selectLoading = (s: BoardsState) => s.loading
