import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import * as boardsService from '@/services/boards'
import * as lanesService from '@/services/lanes'
import * as itemsService from '@/services/items'
import { supabase } from '@/lib/supabase'
import { broadcastSyncEvent, onSyncEvent } from '@/lib/realtime'

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
  duplicateBoard: (
    boardId: number | string,
    options?: { includeLanes?: boolean; includeItems?: boolean }
  ) => Promise<Board | null>
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

      // 1. Realtime postgres changes channel listener
      const channel = boardsService.subscribeBoards(() => {
        boardsService.getBoards(owner).then((fresh) => {
          set({ boards: fresh })
        })
      })

      // 2. Peer-to-peer real-time broadcast event listener (<50ms delivery)
      const unsubBroadcast = onSyncEvent((event) => {
        if (event === 'boards') {
          boardsService.getBoards(owner).then((fresh) => {
            set({ boards: fresh })
          })
        }
      })

      realtimeCleanup = () => {
        supabase.removeChannel(channel)
        unsubBroadcast()
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

      const tempId = -Date.now()
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

      set((s) => ({ boards: [optimistic, ...s.boards] }))

      const result = await boardsService.createBoard({ ...draft, order })

      if (!result) {
        set((s) => ({ boards: s.boards.filter((b) => b.id !== tempId) }))
        return null
      }

      const withRole = { ...result, role: 'owner' as const }
      set((s) => ({
        boards: s.boards.map((b) => (b.id === tempId ? withRole : b))
      }))
      broadcastSyncEvent('boards')
      return withRole
    },

    // ── Optimistic update ──────────────────────────────────────
    updateBoard: async (id, updates) => {
      const prev = get().boards.find((b) => String(b.id) === String(id))
      if (!prev) return null

      set((s) => ({
        boards: s.boards.map((b) =>
          String(b.id) === String(id) ? { ...b, ...updates, updated_at: new Date().toISOString() } : b
        )
      }))

      broadcastSyncEvent('boards')

      const result = await boardsService.updateBoard(id, updates)

      if (!result) {
        set((s) => ({
          boards: s.boards.map((b) => (String(b.id) === String(id) ? prev : b))
        }))
        broadcastSyncEvent('boards')
        return null
      }

      const withRole = { ...result, role: prev.role }
      set((s) => ({
        boards: s.boards.map((b) => (String(b.id) === String(id) ? withRole : b))
      }))
      return withRole
    },

    // ── Optimistic delete ──────────────────────────────────────
    removeBoard: async (id) => {
      const prev = get().boards
      const target = prev.find((b) => String(b.id) === String(id))
      if (!target) return false

      set((s) => ({ boards: s.boards.filter((b) => String(b.id) !== String(id)) }))
      broadcastSyncEvent('boards')

      const ok = await boardsService.deleteBoard(id)

      if (!ok) {
        set({ boards: prev })
        broadcastSyncEvent('boards')
        return false
      }

      return true
    },

    // ── Optimistic reorder ─────────────────────────────────────
    reorderBoards: async (reordered: Board[]) => {
      const prev = get().boards

      const withOrder = reordered.map((b, i) => ({ ...b, order: i, pinned: Boolean(b.pinned) }))
      const updatesMap = new Map(withOrder.map((b) => [String(b.id), { order: b.order, pinned: b.pinned }]))

      set((s) => ({
        boards: s.boards.map((b) => (updatesMap.has(String(b.id)) ? { ...b, ...updatesMap.get(String(b.id)) } : b))
      }))

      broadcastSyncEvent('boards')

      const updates = withOrder
        .filter((b) => b.id !== undefined && (typeof b.id === 'string' || b.id > 0))
        .map((b) => boardsService.updateBoard(b.id!, { order: b.order, pinned: b.pinned }))

      const results = await Promise.all(updates)
      if (results.some((r) => r === null)) {
        set({ boards: prev })
        broadcastSyncEvent('boards')
      }
    },

    // ── Duplicate Board ──────────────────────────────────────
    duplicateBoard: async (boardId, options = {}) => {
      const target = get().boards.find((b) => String(b.id) === String(boardId))
      if (!target || !target.id) return null

      const { includeLanes = false, includeItems = false } = options
      const copyTitle = target.title ? `${target.title} (Copy)` : 'Untitled Board (Copy)'

      const newBoard = await get().addBoard({
        title: copyTitle,
        description: target.description,
        icon: target.icon,
        pinned: target.pinned,
        background: target.background,
        owner: target.owner
      })

      if (!newBoard || !newBoard.id) return null

      if (includeLanes) {
        const sourceLanes = await lanesService.getLanesByBoardId(boardId)
        const realLanes = sourceLanes.filter((l) => l.id !== null)

        for (let idx = 0; idx < realLanes.length; idx++) {
          const lane = realLanes[idx]
          const newLane = await lanesService.createLane({
            board_id: Number(newBoard.id),
            title: lane.title,
            icon: lane.icon,
            description: lane.description,
            background: lane.background,
            owner: lane.owner,
            order: idx + 1
          })

          if (newLane && newLane.id && includeItems) {
            const sourceItems = await itemsService.getItemsByBoardId(boardId)
            const laneItems = sourceItems.filter((i) => String(i.lane_id) === String(lane.id))

            for (let itemIdx = 0; itemIdx < laneItems.length; itemIdx++) {
              const item = laneItems[itemIdx]
              await itemsService.createItem({
                board_id: Number(newBoard.id),
                lane_id: Number(newLane.id),
                title: item.title,
                icon: item.icon,
                description: item.description,
                priority: item.priority,
                due_date: item.due_date,
                background: item.background,
                owner: item.owner,
                order: itemIdx + 1
              })
            }
          }
        }
      }

      if (includeItems) {
        const sourceItems = await itemsService.getItemsByBoardId(boardId)
        const draftItems = sourceItems.filter((i) => i.lane_id === null)

        for (let draftIdx = 0; draftIdx < draftItems.length; draftIdx++) {
          const item = draftItems[draftIdx]
          await itemsService.createItem({
            board_id: Number(newBoard.id),
            lane_id: null,
            title: item.title,
            icon: item.icon,
            description: item.description,
            priority: item.priority,
            due_date: item.due_date,
            background: item.background,
            owner: item.owner,
            order: draftIdx + 1
          })
        }
      }

      broadcastSyncEvent('boards')
      broadcastSyncEvent('lanes')
      broadcastSyncEvent('items')
      return newBoard
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
