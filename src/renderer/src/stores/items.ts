import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import * as itemsService from '@/services/items'
import * as repo from '@/lib/db/repo'
import { enqueueMutation } from '@/lib/db/sync-outbox'
import { useBoardsStore } from '@/stores/boards'
import { supabase } from '@/lib/supabase'
import { broadcastSyncEvent, onSyncEvent } from '@/lib/realtime'
import { sendTicketAssignmentEmail } from '@/services/email'

type ItemsState = {
  items: KanbanItem[]
  loading: boolean
  boardId: number | string | undefined

  // Lifecycle
  init: (boardId: number | string, force?: boolean) => Promise<void>
  refreshItems: (boardId?: number | string) => Promise<void>
  cleanup: () => void

  // Local-first mutations (Instant UI + IndexedDB + Outbox Sync)
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
        // 1. Read local Dexie first
        const local = await repo.getLocalItems(targetId)
        if (local.length > 0) {
          set({ boardId: targetId, items: local, loading: false })
        }

        // 2. Fetch remote if online
        if (typeof navigator === 'undefined' || navigator.onLine) {
          const remote = await itemsService.getItemsByBoardId(targetId)
          const reconciled = await repo.reconcileRemoteItems(targetId, remote)
          set({ boardId: targetId, items: reconciled, loading: false })
        }
      } catch (err) {
        console.error('Error in refreshItems:', err)
      }
    },

    init: async (boardId: number | string, force: boolean = false) => {
      const prevBoardId = get().boardId
      if (!force && String(prevBoardId) === String(boardId) && !get().loading) return

      realtimeCleanup?.()
      realtimeCleanup = null

      // Immediate 0ms local read from IndexedDB
      const local = await repo.getLocalItems(boardId)
      if (local.length > 0) {
        set({ boardId, items: local, loading: false })
      } else {
        set({ boardId, items: [], loading: true })
      }

      // Revalidate from Supabase in background
      if (typeof navigator === 'undefined' || navigator.onLine) {
        itemsService
          .getItemsByBoardId(boardId)
          .then(async (remote) => {
            const reconciled = await repo.reconcileRemoteItems(boardId, remote)
            set({ items: reconciled, loading: false })
          })
          .catch((err) => {
            console.warn('[useItemsStore] Remote fetch failed, using local DB:', err)
            set({ loading: false })
          })
      }

      // 1. Postgres changes subscription
      const channel = itemsService.subscribeItems(boardId, () => {
        if (suppressRealtimeRefetch) return
        itemsService.getItemsByBoardId(boardId).then(async (fresh) => {
          const reconciled = await repo.reconcileRemoteItems(boardId, fresh)
          set({ items: reconciled })
        })
      })

      // 2. Peer-to-peer broadcast subscription (<50ms delivery)
      const unsubBroadcast = onSyncEvent((event) => {
        if (event === 'items' || event === 'lanes') {
          const currentBoardId = get().boardId
          if (!currentBoardId || suppressRealtimeRefetch) return
          itemsService.getItemsByBoardId(currentBoardId).then(async (fresh) => {
            const reconciled = await repo.reconcileRemoteItems(currentBoardId, fresh)
            set({ items: reconciled })
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

    // ── Local-First Create Item ──────────────────────────────
    addItem: async (draft) => {
      const currentBoardId = draft.board_id ?? get().boardId
      if (!currentBoardId || isNaN(Number(currentBoardId))) {
        console.error('addItem: cannot add item without a valid boardId', { draft, currentBoardId: get().boardId })
        return null
      }

      const laneId =
        draft.lane_id !== undefined && draft.lane_id !== null
          ? typeof draft.lane_id === 'number' || !isNaN(Number(draft.lane_id))
            ? Number(draft.lane_id)
            : draft.lane_id
          : null

      const sameLaneItems = get().items.filter(
        (i) => (i.lane_id === null && laneId === null) || (i.lane_id !== null && String(i.lane_id) === String(laneId))
      )

      const maxOrder = sameLaneItems.length > 0 ? Math.max(...sameLaneItems.map((i) => i.order ?? 0)) : 0
      const order = draft.order ?? maxOrder + 100

      // Temporary local negative ID (<0)
      const tempId = -Date.now() - Math.floor(Math.random() * 1000)
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

      // 1. Instant local persistence in IndexedDB
      await repo.putLocalItem(optimistic)

      // 2. Instant UI update
      set((s) => ({ items: [...s.items, optimistic] }))
      broadcastSyncEvent('items')

      // 3. Enqueue to Outbox for debounced bulk sync
      await enqueueMutation({
        entityType: 'items',
        action: 'create',
        boardId: currentBoardId,
        entityId: tempId,
        payload: optimistic
      })

      if (optimistic.board_id) useBoardsStore.getState().touchBoardActivity(optimistic.board_id)

      // Auto email notification if an assignee is set
      if (optimistic.assignee?.trim()) {
        sendTicketAssignmentEmail({
          item: optimistic,
          boardId: currentBoardId
        }).catch((err) => console.error('[useItemsStore] Failed to send assignment email:', err))
      }

      return optimistic
    },

    // ── Local-First Update Item ──────────────────────────────
    updateItem: async (id, updates) => {
      const prevItem = get().items.find((i) => String(i.id) === String(id))
      if (!prevItem) return null

      const updated: KanbanItem = {
        ...prevItem,
        ...updates,
        updated_at: new Date().toISOString()
      }

      // 1. Instant local persistence
      await repo.putLocalItem(updated)

      // 2. Instant UI update
      set((s) => ({
        items: s.items.map((i) => (String(i.id) === String(id) ? updated : i))
      }))
      broadcastSyncEvent('items')

      // 3. Enqueue to Outbox
      const currentBoardId = prevItem.board_id ?? get().boardId
      if (currentBoardId) {
        await enqueueMutation({
          entityType: 'items',
          action: 'update',
          boardId: currentBoardId,
          entityId: id,
          payload: updates
        })
        useBoardsStore.getState().touchBoardActivity(currentBoardId)
      }

      // Auto email notification if assignee changed or was newly assigned
      if (
        updates.assignee !== undefined &&
        updates.assignee !== null &&
        updates.assignee.trim() &&
        updates.assignee.trim() !== (prevItem.assignee?.trim() || '')
      ) {
        sendTicketAssignmentEmail({
          item: updated,
          boardId: currentBoardId
        }).catch((err) => console.error('[useItemsStore] Failed to send assignment email:', err))
      }

      return updated
    },

    // ── Local-First Remove Item ──────────────────────────────
    removeItem: async (id) => {
      const prevItems = get().items
      const target = prevItems.find((i) => String(i.id) === String(id))
      if (!target) return false

      // 1. Instant local delete
      await repo.deleteLocalItem(id)

      // 2. Instant UI update
      set((s) => ({ items: s.items.filter((i) => String(i.id) !== String(id)) }))
      broadcastSyncEvent('items')

      // 3. Enqueue to Outbox
      const currentBoardId = target.board_id ?? get().boardId
      if (currentBoardId) {
        await enqueueMutation({
          entityType: 'items',
          action: 'delete',
          boardId: currentBoardId,
          entityId: id
        })
        useBoardsStore.getState().touchBoardActivity(currentBoardId)
      }

      return true
    },

    // ── Local-First Move Item ────────────────────────────────
    moveItem: async (id, targetLaneId, newOrder) => {
      const prevItem = get().items.find((i) => String(i.id) === String(id))
      if (!prevItem) return

      const normalizedTargetLane =
        targetLaneId !== null && !isNaN(Number(targetLaneId)) ? Number(targetLaneId) : null

      const updated: KanbanItem = {
        ...prevItem,
        lane_id: normalizedTargetLane,
        order: newOrder,
        updated_at: new Date().toISOString()
      }

      // 1. Instant local persistence
      await repo.putLocalItem(updated)

      // 2. Instant UI update
      set((s) => ({
        items: s.items.map((i) => (String(i.id) === String(id) ? updated : i))
      }))
      broadcastSyncEvent('items')

      // 3. Enqueue to Outbox
      const currentBoardId = prevItem.board_id ?? get().boardId
      if (currentBoardId) {
        await enqueueMutation({
          entityType: 'items',
          action: 'update',
          boardId: currentBoardId,
          entityId: id,
          payload: { lane_id: normalizedTargetLane, order: newOrder }
        })
      }
    },

    // ── Duplicate Item ──────────────────────────────────────
    duplicateItem: async (id) => {
      const target = get().items.find((i) => String(i.id) === String(id))
      if (!target) return null

      const sameLaneItems = get().items.filter(
        (i) =>
          (target.lane_id === null && i.lane_id === null) ||
          (target.lane_id !== null && String(i.lane_id) === String(target.lane_id))
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

    // ── Bulk Duplicate Items ────────────────────────────────
    bulkDuplicateItems: async (itemIds) => {
      const currentBoardId = get().boardId
      if (!currentBoardId) return []

      const idSet = new Set(itemIds.map(String))
      const targets = get().items.filter((i) => idSet.has(String(i.id)))
      if (targets.length === 0) return []

      const draftItems = get().items.filter((i) => i.lane_id === null)
      let maxOrder = draftItems.length > 0 ? Math.max(...draftItems.map((i) => i.order ?? 0)) : 0

      const createdList: KanbanItem[] = []

      for (const target of targets) {
        maxOrder += 100
        const tempId = -Date.now() - Math.floor(Math.random() * 1000)
        const optimistic: KanbanItem = {
          id: tempId,
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
          order: maxOrder,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        createdList.push(optimistic)
        await repo.putLocalItem(optimistic)
        await enqueueMutation({
          entityType: 'items',
          action: 'create',
          boardId: currentBoardId,
          entityId: tempId,
          payload: optimistic
        })
      }

      set((s) => ({ items: [...s.items, ...createdList] }))
      broadcastSyncEvent('items')
      useBoardsStore.getState().touchBoardActivity(currentBoardId)
      return createdList
    },

    // ── Bulk Move Items ─────────────────────────────────────
    bulkMoveItems: async (itemIds, targetLaneId, targetBoardId) => {
      const currentBoardId = get().boardId
      const idSet = new Set(itemIds.map(String))
      const normalizedTargetLane =
        targetLaneId !== null && !isNaN(Number(targetLaneId)) ? Number(targetLaneId) : null
      const isDifferentBoard =
        targetBoardId !== undefined && String(targetBoardId) !== String(currentBoardId)

      if (isDifferentBoard) {
        // Move to a different board
        set((s) => ({ items: s.items.filter((i) => !idSet.has(String(i.id))) }))
        broadcastSyncEvent('items')

        for (const id of itemIds) {
          await repo.deleteLocalItem(id)
          await enqueueMutation({
            entityType: 'items',
            action: 'update',
            boardId: currentBoardId!,
            entityId: id,
            payload: {
              board_id: Number(targetBoardId),
              lane_id: normalizedTargetLane,
              order: 100
            }
          })
        }
        if (currentBoardId) useBoardsStore.getState().touchBoardActivity(currentBoardId)
        useBoardsStore.getState().touchBoardActivity(targetBoardId)
      } else {
        // Move within current board
        const updatedItems = get().items.map((i) =>
          idSet.has(String(i.id))
            ? { ...i, lane_id: normalizedTargetLane, updated_at: new Date().toISOString() }
            : i
        )

        await repo.putLocalItems(updatedItems.filter((i) => idSet.has(String(i.id))))
        set({ items: updatedItems })
        broadcastSyncEvent('items')

        for (const id of itemIds) {
          await enqueueMutation({
            entityType: 'items',
            action: 'update',
            boardId: currentBoardId!,
            entityId: id,
            payload: { lane_id: normalizedTargetLane }
          })
        }
        if (currentBoardId) useBoardsStore.getState().touchBoardActivity(currentBoardId)
      }
    },

    // ── Bulk Move Items with Calculated Orders ───────────────
    bulkMoveItemsWithOrder: async (itemsWithOrders) => {
      const currentBoardId = get().boardId
      if (itemsWithOrders.length === 0 || !currentBoardId) return

      const orderMap = new Map(itemsWithOrders.map((i) => [String(i.id), i]))

      const updatedItems = get().items.map((i) => {
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

      // 1. Instant local persistence in Dexie
      const touched = updatedItems.filter((i) => orderMap.has(String(i.id)))
      await repo.putLocalItems(touched)

      // 2. Instant UI update
      set({ items: updatedItems })
      broadcastSyncEvent('items')

      // 3. Enqueue to Outbox (compactor will coalesce)
      for (const item of itemsWithOrders) {
        await enqueueMutation({
          entityType: 'items',
          action: 'update',
          boardId: currentBoardId,
          entityId: item.id,
          payload: { lane_id: item.lane_id, order: item.order }
        })
      }

      useBoardsStore.getState().touchBoardActivity(currentBoardId)
    },

    // ── Bulk Set Priority ───────────────────────────────────
    bulkSetPriority: async (itemIds, priority) => {
      const currentBoardId = get().boardId
      if (!currentBoardId) return
      const idSet = new Set(itemIds.map(String))

      const updatedItems = get().items.map((i) =>
        idSet.has(String(i.id)) ? { ...i, priority, updated_at: new Date().toISOString() } : i
      )

      await repo.putLocalItems(updatedItems.filter((i) => idSet.has(String(i.id))))
      set({ items: updatedItems })
      broadcastSyncEvent('items')

      for (const id of itemIds) {
        await enqueueMutation({
          entityType: 'items',
          action: 'update',
          boardId: currentBoardId,
          entityId: id,
          payload: { priority }
        })
      }

      useBoardsStore.getState().touchBoardActivity(currentBoardId)
    },

    // ── Bulk Set Status ─────────────────────────────────────
    bulkSetStatus: async (itemIds, status) => {
      const currentBoardId = get().boardId
      if (!currentBoardId) return
      const idSet = new Set(itemIds.map(String))

      const updatedItems = get().items.map((i) =>
        idSet.has(String(i.id)) ? { ...i, status, updated_at: new Date().toISOString() } : i
      )

      await repo.putLocalItems(updatedItems.filter((i) => idSet.has(String(i.id))))
      set({ items: updatedItems })
      broadcastSyncEvent('items')

      for (const id of itemIds) {
        await enqueueMutation({
          entityType: 'items',
          action: 'update',
          boardId: currentBoardId,
          entityId: id,
          payload: { status }
        })
      }

      useBoardsStore.getState().touchBoardActivity(currentBoardId)
    },

    // ── Bulk Set Assignee ───────────────────────────────────
    bulkSetAssignee: async (itemIds, assignee) => {
      const currentBoardId = get().boardId
      if (!currentBoardId) return
      const idSet = new Set(itemIds.map(String))

      const updatedItems = get().items.map((i) =>
        idSet.has(String(i.id)) ? { ...i, assignee, updated_at: new Date().toISOString() } : i
      )

      await repo.putLocalItems(updatedItems.filter((i) => idSet.has(String(i.id))))
      set({ items: updatedItems })
      broadcastSyncEvent('items')

      for (const id of itemIds) {
        await enqueueMutation({
          entityType: 'items',
          action: 'update',
          boardId: currentBoardId,
          entityId: id,
          payload: { assignee }
        })
      }

      useBoardsStore.getState().touchBoardActivity(currentBoardId)

      // Auto email notification for bulk assigned items
      if (assignee && assignee.trim()) {
        const newlyAssigned = updatedItems.filter((i) => idSet.has(String(i.id)))
        for (const itm of newlyAssigned) {
          sendTicketAssignmentEmail({
            item: itm,
            boardId: currentBoardId,
            assigneeName: assignee.trim()
          }).catch((err) => console.error('[useItemsStore] Failed to send bulk assignment email:', err))
        }
      }
    },

    // ── Bulk Set Background Accent ─────────────────────────
    bulkSetBackground: async (itemIds, background) => {
      const currentBoardId = get().boardId
      if (!currentBoardId) return
      const idSet = new Set(itemIds.map(String))

      const updatedItems = get().items.map((i) =>
        idSet.has(String(i.id))
          ? { ...i, background: background || null, updated_at: new Date().toISOString() }
          : i
      )

      await repo.putLocalItems(updatedItems.filter((i) => idSet.has(String(i.id))))
      set({ items: updatedItems })
      broadcastSyncEvent('items')

      for (const id of itemIds) {
        await enqueueMutation({
          entityType: 'items',
          action: 'update',
          boardId: currentBoardId,
          entityId: id,
          payload: { background: background || null }
        })
      }

      useBoardsStore.getState().touchBoardActivity(currentBoardId)
    },

    // ── Bulk Remove Items ───────────────────────────────────
    bulkRemoveItems: async (itemIds) => {
      const currentBoardId = get().boardId
      if (!currentBoardId) return false
      const idSet = new Set(itemIds.map(String))

      await repo.deleteLocalItems(itemIds)

      set((s) => ({
        items: s.items.filter((i) => !idSet.has(String(i.id)))
      }))
      broadcastSyncEvent('items')

      await enqueueMutation({
        entityType: 'items',
        action: 'bulk_delete',
        boardId: currentBoardId,
        payload: { ids: itemIds }
      })

      useBoardsStore.getState().touchBoardActivity(currentBoardId)
      return true
    }
  }))
)

// Selectors
export const selectItems = (s: ItemsState) => s.items
export const selectItemsLoading = (s: ItemsState) => s.loading
