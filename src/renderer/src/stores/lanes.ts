import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import * as lanesService from '@/services/lanes'
import * as repo from '@/lib/db/repo'
import { enqueueMutation } from '@/lib/db/sync-outbox'
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

  // Local-First mutations (Instant UI + IndexedDB + Outbox Sync)
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
        const virtualDraft = createVirtualDraftLane(targetId)

        // 1. Read local Dexie first
        const local = await repo.getLocalLanes(targetId)
        if (local.length > 0) {
          set({ boardId: targetId, lanes: [virtualDraft, ...local], loading: false })
        }

        // 2. Fetch remote if online
        if (typeof navigator === 'undefined' || navigator.onLine) {
          const remote = await lanesService.getLanesByBoardId(targetId)
          const reconciled = await repo.reconcileRemoteLanes(targetId, remote)
          set({ boardId: targetId, lanes: [virtualDraft, ...reconciled], loading: false })
        }
      } catch (err) {
        console.error('Error in refreshLanes:', err)
      }
    },

    init: async (boardId: number | string, force: boolean = false) => {
      const prevBoardId = get().boardId
      if (!force && String(prevBoardId) === String(boardId) && !get().loading) return

      realtimeCleanup?.()
      realtimeCleanup = null

      const virtualDraft = createVirtualDraftLane(boardId)

      // Immediate 0ms local read from IndexedDB
      const local = await repo.getLocalLanes(boardId)
      if (local.length > 0) {
        set({ boardId, lanes: [virtualDraft, ...local], loading: false })
      } else {
        set({ boardId, lanes: [virtualDraft], loading: true })
      }

      // Revalidate from Supabase in background
      if (typeof navigator === 'undefined' || navigator.onLine) {
        lanesService
          .getLanesByBoardId(boardId)
          .then(async (remote) => {
            const reconciled = await repo.reconcileRemoteLanes(boardId, remote)
            set({ lanes: [virtualDraft, ...reconciled], loading: false })
          })
          .catch((err) => {
            console.warn('[useLanesStore] Remote fetch failed, using local DB:', err)
            set({ loading: false })
          })
      }

      // 1. Postgres changes subscription
      const channel = lanesService.subscribeLanes(boardId, () => {
        if (suppressRealtimeRefetch) return
        lanesService.getLanesByBoardId(boardId).then(async (fresh) => {
          const reconciled = await repo.reconcileRemoteLanes(boardId, fresh)
          set({ lanes: [createVirtualDraftLane(boardId), ...reconciled] })
        })
      })

      // 2. Peer-to-peer broadcast subscription (<50ms delivery)
      const unsubBroadcast = onSyncEvent((event) => {
        if (event === 'lanes') {
          const currentBoardId = get().boardId
          if (!currentBoardId || suppressRealtimeRefetch) return
          lanesService.getLanesByBoardId(currentBoardId).then(async (fresh) => {
            const reconciled = await repo.reconcileRemoteLanes(currentBoardId, fresh)
            set({ lanes: [createVirtualDraftLane(currentBoardId), ...reconciled] })
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

    // ── Local-First Create Lane ──────────────────────────────
    addLane: async (draft) => {
      const currentBoardId = draft.board_id ?? (get().boardId ? Number(get().boardId) : null)
      const realLanes = get().lanes.filter((l) => l.id !== null)
      const maxOrder = realLanes.length > 0 ? Math.max(...realLanes.map((l) => l.order ?? 0)) : 0
      const order = draft.order ?? maxOrder + 1

      const tempId = -Date.now()
      const optimistic: Lane = {
        id: tempId,
        board_id: currentBoardId,
        title: draft.title ?? 'New Column',
        icon: draft.icon ?? null,
        description: draft.description ?? null,
        background: draft.background ?? null,
        owner: draft.owner ?? null,
        owner_info: draft.owner_info ?? null,
        order,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // 1. Instant local persistence in IndexedDB
      await repo.putLocalLane(optimistic)

      // 2. Instant UI update
      set((s) => ({ lanes: [...s.lanes, optimistic] }))
      broadcastSyncEvent('lanes')

      // 3. Enqueue to Outbox
      if (currentBoardId) {
        await enqueueMutation({
          entityType: 'lanes',
          action: 'create',
          boardId: currentBoardId,
          entityId: tempId,
          payload: optimistic
        })
        useBoardsStore.getState().touchBoardActivity(currentBoardId)
      }

      return optimistic
    },

    // ── Local-First Update Lane ──────────────────────────────
    updateLane: async (id, updates) => {
      if (id === null || String(id) === 'null') return null

      const prevLane = get().lanes.find((l) => String(l.id) === String(id))
      if (!prevLane) return null

      const updated: Lane = {
        ...prevLane,
        ...updates,
        updated_at: new Date().toISOString()
      }

      // 1. Instant local persistence
      await repo.putLocalLane(updated)

      // 2. Instant UI update
      set((s) => ({
        lanes: s.lanes.map((l) => (String(l.id) === String(id) ? updated : l))
      }))
      broadcastSyncEvent('lanes')

      // 3. Enqueue to Outbox
      const currentBoardId = prevLane.board_id ?? get().boardId
      if (currentBoardId) {
        await enqueueMutation({
          entityType: 'lanes',
          action: 'update',
          boardId: currentBoardId,
          entityId: id,
          payload: updates
        })
        useBoardsStore.getState().touchBoardActivity(currentBoardId)
      }

      return updated
    },

    // ── Local-First Remove Lane ──────────────────────────────
    removeLane: async (id) => {
      if (id === null || String(id) === 'null') return false

      const prevLanes = get().lanes
      const target = prevLanes.find((l) => String(l.id) === String(id))
      if (!target) return false

      // 1. Instant local delete (cascades items locally too)
      await repo.deleteLocalLane(id)

      // 2. Instant UI update
      set((s) => ({ lanes: s.lanes.filter((l) => String(l.id) !== String(id)) }))
      broadcastSyncEvent('lanes')

      // 3. Enqueue to Outbox
      const currentBoardId = target.board_id ?? get().boardId
      if (currentBoardId) {
        await enqueueMutation({
          entityType: 'lanes',
          action: 'delete',
          boardId: currentBoardId,
          entityId: id
        })
        useBoardsStore.getState().touchBoardActivity(currentBoardId)
      }

      return true
    },

    // ── Move Lane Left/Right ─────────────────────────────────
    moveLane: async (id, direction) => {
      if (id === null || String(id) === 'null') return

      const realLanes = get()
        .lanes.filter((l) => l.id !== null)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
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

    // ── Move Lane to Another Board ───────────────────────────
    moveLaneToBoard: async (laneId: number | string, targetBoardId: number | string) => {
      if (laneId === null || String(laneId) === 'null') return false

      const currentBoardId = get().boardId
      const prevItems = useItemsStore.getState().items

      // 1. Local update
      await repo.deleteLocalLane(laneId)
      set((s) => ({
        lanes: s.lanes.filter((l) => String(l.id) !== String(laneId))
      }))
      useItemsStore.setState({
        items: prevItems.filter((i) => String(i.lane_id) !== String(laneId))
      })

      broadcastSyncEvent('lanes')
      broadcastSyncEvent('boards')
      broadcastSyncEvent('items')

      // 2. Direct server call for cross-board move
      const success = await lanesService.moveLaneToBoard(laneId, targetBoardId)
      if (currentBoardId) useBoardsStore.getState().touchBoardActivity(currentBoardId)
      useBoardsStore.getState().touchBoardActivity(targetBoardId)
      useBoardsStore.getState().refresh()

      return success
    },

    // ── Local-First Reorder Lanes ────────────────────────────
    reorderLanes: async (reordered: Lane[]) => {
      const currentBoardId = get().boardId
      if (!currentBoardId) return
      const realReordered = reordered.filter((l) => l.id !== null)
      const prevLanes = get().lanes

      const withOrder = realReordered.map((l, i) => ({ ...l, order: i + 1 }))
      const orderMap = new Map(withOrder.map((l) => [String(l.id), l.order]))

      const draftLane = createVirtualDraftLane(currentBoardId)
      const updatedRealLanes = prevLanes
        .filter((l) => l.id !== null)
        .map((l) => {
          const key = String(l.id)
          return orderMap.has(key) ? { ...l, order: orderMap.get(key)! } : l
        })
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

      // 1. Instant local persistence
      await repo.putLocalLanes(withOrder)

      // 2. Instant UI update
      set({ lanes: [draftLane, ...updatedRealLanes] })
      broadcastSyncEvent('lanes')

      // 3. Enqueue to Outbox
      for (const lane of withOrder) {
        if (lane.id !== null) {
          await enqueueMutation({
            entityType: 'lanes',
            action: 'update',
            boardId: currentBoardId,
            entityId: lane.id,
            payload: { order: lane.order }
          })
        }
      }

      useBoardsStore.getState().touchBoardActivity(currentBoardId)
    },

    // ── Duplicate Lane ──────────────────────────────────────
    duplicateLane: async (laneId, includeItems = false) => {
      if (laneId === null || String(laneId) === 'null') return null

      const target = get().lanes.find((l) => String(l.id) === String(laneId))
      if (!target || target.id === null) return null

      const realLanes = get().lanes.filter((l) => l.id !== null)
      const order = realLanes.length + 1
      const copyTitle = target.title ? `${target.title} (Copy)` : 'Untitled Column (Copy)'

      const newLane = await get().addLane({
        board_id: target.board_id,
        title: copyTitle,
        icon: target.icon,
        description: target.description,
        background: target.background,
        owner: target.owner,
        owner_info: target.owner_info ?? null,
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
            start_date: item.start_date,
            due_date: item.due_date,
            status: item.status,
            assignee: item.assignee,
            background: item.background,
            owner: item.owner,
            owner_info: item.owner_info ?? null,
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
