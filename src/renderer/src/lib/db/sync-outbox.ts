import { db, OutboxMutation, OutboxEntityType, OutboxActionType } from './index'
import * as itemsService from '@/services/items'
import * as bulkItemsService from '@/services/bulk-items'
import * as lanesService from '@/services/lanes'
import * as bulkLanesService from '@/services/bulk-lanes'
import * as boardsService from '@/services/boards'
import { broadcastSyncEvent } from '@/lib/realtime'

export type SyncState = 'synced' | 'syncing' | 'offline' | 'pending' | 'error'

type SyncListener = (state: {
  status: SyncState
  pendingCount: number
  lastSyncedAt: Date | null
  lastError: string | null
}) => void

let isFlushing = false
let flushTimeout: any = null
let lastSyncedAt: Date | null = null
let lastError: string | null = null
let currentStatus: SyncState = typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced'
const syncListeners = new Set<SyncListener>()

export function getSyncState() {
  return {
    status: currentStatus,
    pendingCount: 0,
    lastSyncedAt,
    lastError
  }
}

function notifySyncListeners(pendingCount = 0) {
  const state = {
    status: currentStatus,
    pendingCount,
    lastSyncedAt,
    lastError
  }
  syncListeners.forEach((cb) => {
    try {
      cb(state)
    } catch (err) {
      console.error('[SyncOutbox] Listener error:', err)
    }
  })
}

export function subscribeSyncState(listener: SyncListener): () => void {
  syncListeners.add(listener)
  db.outbox
    .where('status')
    .equals('pending')
    .count()
    .then((count) => listener({ status: currentStatus, pendingCount: count, lastSyncedAt, lastError }))
    .catch(() => {})

  return () => {
    syncListeners.delete(listener)
  }
}

/**
 * Enqueues an operation to the local IndexedDB outbox and schedules a debounced flush.
 */
export async function enqueueMutation(params: {
  entityType: OutboxEntityType
  action: OutboxActionType
  boardId: number | string
  entityId?: number | string
  payload?: any
}): Promise<number> {
  const mutation: OutboxMutation = {
    entityType: params.entityType,
    action: params.action,
    boardId: params.boardId,
    entityId: params.entityId,
    payload: params.payload,
    timestamp: Date.now(),
    attempts: 0,
    status: 'pending'
  }

  const id = await db.outbox.add(mutation)
  currentStatus = 'pending'
  const count = await db.outbox.where('status').equals('pending').count()
  notifySyncListeners(count)

  scheduleFlush(500)
  return id
}

/**
 * Schedules a debounced flush of pending outbox mutations.
 */
export function scheduleFlush(delayMs = 500) {
  if (flushTimeout) {
    clearTimeout(flushTimeout)
  }
  flushTimeout = setTimeout(() => {
    flushOutbox().catch((err) => console.error('[SyncOutbox] Flush error:', err))
  }, delayMs)
}

/**
 * Flushes all pending mutations from IndexedDB outbox to Supabase using bulk operations.
 */
export async function flushOutbox(): Promise<void> {
  if (isFlushing) return
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    currentStatus = 'offline'
    const count = await db.outbox.where('status').equals('pending').count()
    notifySyncListeners(count)
    return
  }

  isFlushing = true
  currentStatus = 'syncing'
  notifySyncListeners()

  try {
    const pendingMutations = await db.outbox
      .where('status')
      .anyOf('pending', 'failed')
      .sortBy('id')

    if (pendingMutations.length === 0) {
      currentStatus = 'synced'
      lastError = null
      notifySyncListeners(0)
      isFlushing = false
      return
    }

    // Mark as in-flight
    const mutationIds = pendingMutations.map((m) => m.id!).filter(Boolean)
    await db.outbox.where('id').anyOf(mutationIds).modify({ status: 'in-flight' })

    // Group mutations by entity
    const laneCreates: OutboxMutation[] = []
    const laneUpdates: OutboxMutation[] = []
    const laneDeletes: OutboxMutation[] = []

    const itemCreates: OutboxMutation[] = []
    const itemUpdates: OutboxMutation[] = []
    const itemDeletes: OutboxMutation[] = []

    const boardUpdates: OutboxMutation[] = []

    for (const m of pendingMutations) {
      if (m.entityType === 'boards') {
        boardUpdates.push(m)
      } else if (m.entityType === 'lanes') {
        if (m.action === 'create') laneCreates.push(m)
        else if (m.action === 'delete') laneDeletes.push(m)
        else laneUpdates.push(m)
      } else if (m.entityType === 'items') {
        if (m.action === 'create') itemCreates.push(m)
        else if (m.action === 'delete' || m.action === 'bulk_delete') itemDeletes.push(m)
        else itemUpdates.push(m)
      }
    }

    const completedMutationIds: number[] = []

    // 1. Process Board Updates
    for (const bm of boardUpdates) {
      if (bm.entityId && bm.payload) {
        await boardsService.updateBoard(bm.entityId, bm.payload)
      }
      if (bm.id) completedMutationIds.push(bm.id)
    }

    // 2. Process Lane Creates (Must be done before items to remap temp lane IDs)
    const laneIdMap = new Map<number | string, number>()
    for (const lm of laneCreates) {
      const tempLaneId = lm.entityId
      const payload = lm.payload
      if (payload) {
        const { id: _ignore, ...cleanLane } = payload
        const createdLane = await lanesService.createLane(cleanLane)
        if (createdLane && createdLane.id) {
          const realLaneId = createdLane.id
          if (tempLaneId && String(tempLaneId) !== String(realLaneId)) {
            laneIdMap.set(tempLaneId, realLaneId)
            // Update local Dexie lane record
            if (typeof tempLaneId === 'number') {
              await db.lanes.delete(tempLaneId)
            }
            await db.lanes.put(createdLane)

            // Update items referencing this temp lane ID in Dexie
            await db.items
              .where('lane_id')
              .equals(Number(tempLaneId))
              .modify({ lane_id: realLaneId })

            // Remap pending in-memory item creates
            itemCreates.forEach((im) => {
              if (im.payload && String(im.payload.lane_id) === String(tempLaneId)) {
                im.payload.lane_id = realLaneId
              }
            })
          }
        }
      }
      if (lm.id) completedMutationIds.push(lm.id)
    }

    // 3. Process Lane Updates
    for (const lm of laneUpdates) {
      if (lm.entityId && lm.payload) {
        const targetId = laneIdMap.get(lm.entityId) || lm.entityId
        await lanesService.updateLane(targetId, lm.payload)
      }
      if (lm.id) completedMutationIds.push(lm.id)
    }

    // 4. Process Lane Deletes
    if (laneDeletes.length > 0) {
      const laneIdsToDelete = laneDeletes
        .map((lm) => lm.entityId)
        .filter((id): id is number => typeof id === 'number' && id > 0)
      if (laneIdsToDelete.length > 0) {
        await bulkLanesService.deleteLanesBulk(laneIdsToDelete)
      }
      laneDeletes.forEach((lm) => lm.id && completedMutationIds.push(lm.id))
    }

    // 5. Process Item Creates
    if (itemCreates.length > 0) {
      const itemsToCreate = itemCreates.map((im) => im.payload).filter(Boolean)
      try {
        const createdItems = await bulkItemsService.createItemsBulk(itemsToCreate)
        // Map temp IDs to real IDs
        itemCreates.forEach((im, idx) => {
          const tempId = im.entityId
          const realItem = createdItems[idx]
          if (realItem && tempId) {
            if (typeof tempId === 'number' && tempId < 0) {
              db.items.delete(tempId).catch(() => {})
            }
            db.items.put(realItem).catch(() => {})
          }
          if (im.id) completedMutationIds.push(im.id)
        })
      } catch (err) {
        console.error('[SyncOutbox] Error bulk creating items:', err)
        // Fallback: create individually
        for (const im of itemCreates) {
          try {
            if (im.payload) {
              const res = await itemsService.createItem(im.payload)
              if (res && im.entityId && typeof im.entityId === 'number' && im.entityId < 0) {
                await db.items.delete(im.entityId)
                await db.items.put(res)
              }
            }
            if (im.id) completedMutationIds.push(im.id)
          } catch (e) {
            console.error('[SyncOutbox] Fallback create item error:', e)
          }
        }
      }
    }

    // 6. Process Item Updates (Coalesce & Batch)
    if (itemUpdates.length > 0) {
      // Coalesce updates by entityId
      const coalesced = new Map<number, Partial<KanbanItem>>()
      for (const im of itemUpdates) {
        const numId = Number(im.entityId)
        if (!isNaN(numId) && numId > 0 && im.payload) {
          const prev = coalesced.get(numId) || {}
          coalesced.set(numId, { ...prev, ...im.payload })
        }
        if (im.id) completedMutationIds.push(im.id)
      }

      if (coalesced.size > 0) {
        const updatesList = Array.from(coalesced.entries()).map(([id, data]) => ({
          id,
          data
        }))
        await bulkItemsService.updateItemsBulk(updatesList)
      }
    }

    // 7. Process Item Deletes (Batch in single query)
    if (itemDeletes.length > 0) {
      const allItemIdsToDelete: (number | string)[] = []
      for (const dm of itemDeletes) {
        if (Array.isArray(dm.payload?.ids)) {
          allItemIdsToDelete.push(...dm.payload.ids)
        } else if (dm.entityId) {
          allItemIdsToDelete.push(dm.entityId)
        }
        if (dm.id) completedMutationIds.push(dm.id)
      }

      const validIds = allItemIdsToDelete
        .map(Number)
        .filter((id) => !isNaN(id) && id > 0)
      if (validIds.length > 0) {
        await bulkItemsService.deleteItemsBulk(validIds)
      }
    }

    // 8. Clean up successfully processed mutations from Outbox
    if (completedMutationIds.length > 0) {
      await db.outbox.bulkDelete(completedMutationIds)
    }

    const remainingCount = await db.outbox.where('status').equals('pending').count()
    lastSyncedAt = new Date()
    currentStatus = remainingCount > 0 ? 'pending' : 'synced'
    lastError = null
    notifySyncListeners(remainingCount)

    // Peer broadcast sync
    broadcastSyncEvent('items')
    broadcastSyncEvent('lanes')
  } catch (err: any) {
    console.error('[SyncOutbox] Exception during flush:', err)
    lastError = err?.message || 'Sync failed'
    currentStatus = 'error'

    // Reset in-flight mutations back to pending so they can retry
    await db.outbox
      .where('status')
      .equals('in-flight')
      .modify((m) => {
        m.status = 'pending'
        m.attempts = (m.attempts || 0) + 1
      })

    const count = await db.outbox.where('status').equals('pending').count()
    notifySyncListeners(count)

    // Schedule retry with backoff
    scheduleFlush(5000)
  } finally {
    isFlushing = false
  }
}

// Global listeners for network recovery and page transitions
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[SyncOutbox] Online detected, flushing pending mutations...')
    currentStatus = 'pending'
    flushOutbox().catch(() => {})
  })

  window.addEventListener('offline', () => {
    console.log('[SyncOutbox] Offline detected.')
    currentStatus = 'offline'
    notifySyncListeners()
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      flushOutbox().catch(() => {})
    }
  })
}
