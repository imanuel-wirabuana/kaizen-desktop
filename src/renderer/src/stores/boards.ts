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
  refresh: () => Promise<void>
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
    loading: true,
    owner: undefined,

    init: async (owner: string) => {
      const prev = get().owner
      if (prev === owner && !get().loading) return // already watching this owner and loaded

      // Cleanup previous subscription
      realtimeCleanup?.()
      realtimeCleanup = null

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

    refresh: async () => {
      const currentOwner = get().owner
      if (!currentOwner) return
      const data = await boardsService.getBoards(currentOwner)
      set({ boards: data })
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
        role: 'owner',
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

      const withRole = { ...result, role: 'owner' as const }
      // Replace temp with real
      set((s) => ({
        boards: s.boards.map((b) => (b.id === tempId ? withRole : b))
      }))
      return withRole
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

      const withRole = { ...result, role: prev.role }
      // Reconcile with server truth
      set((s) => ({
        boards: s.boards.map((b) => (b.id === id ? withRole : b))
      }))
      return withRole
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

      // Build full new list with updated order index and pinned status
      const withOrder = reordered.map((b, i) => ({ ...b, order: i, pinned: Boolean(b.pinned) }))
      const updatesMap = new Map(withOrder.map((b) => [b.id, { order: b.order, pinned: b.pinned }]))

      // Apply locally
      set((s) => ({
        boards: s.boards.map((b) => (updatesMap.has(b.id) ? { ...b, ...updatesMap.get(b.id) } : b))
      }))

      // Persist all changed orders and pinned state to DB
      const updates = withOrder
        .filter((b) => b.id !== undefined && (typeof b.id === 'string' || b.id > 0))
        .map((b) => boardsService.updateBoard(b.id!, { order: b.order, pinned: b.pinned }))

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
export const selectOwnedBoards = (s: BoardsState) =>
  s.boards.filter((b) => !b.role || b.role === 'owner' || b.owner === s.owner)
export const selectSharedBoards = (s: BoardsState) =>
  s.boards.filter((b) => b.role === 'edit' || b.role === 'view')
export const selectPinnedBoards = (s: BoardsState) =>
  s.boards.filter((b) => Boolean(b.pinned)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
export const selectUnpinnedBoards = (s: BoardsState) =>
  s.boards.filter((b) => !b.pinned).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
export const selectLoading = (s: BoardsState) => s.loading
