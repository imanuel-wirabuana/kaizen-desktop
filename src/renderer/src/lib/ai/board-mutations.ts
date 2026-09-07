import { getLanesByBoardId, updateLane } from '@/services/lanes'
import { createLanesBulk, deleteLanesBulk } from '@/services/bulk-lanes'
import {
  createItemsBulk,
  deleteItemsBulk,
  deleteItemsByLaneIds,
  updateItemsBulk
} from '@/services/bulk-items'
import { useLanesStore } from '@/stores/lanes'
import { useItemsStore } from '@/stores/items'
import { broadcastSyncEvent } from '@/lib/realtime'
import type { BoardMutationAction } from './ai-tools'

export interface MutationExecutionResult {
  success: boolean
  appliedCount: number
  errors: string[]
}

/**
 * Executes board CRUD operations using true database-level multi-row bulk operations.
 * Minimizes HTTP roundtrips from O(N) down to O(1) single-query calls.
 */
export async function executeBoardMutations(
  boardId: number | string,
  actions: BoardMutationAction[]
): Promise<MutationExecutionResult> {
  const targetBoardId = Number(boardId)
  const errors: string[] = []
  let appliedCount = 0

  if (actions.length === 0) {
    return { success: true, appliedCount: 0, errors: [] }
  }

  // Fetch current lanes once to resolve existing titles & orders
  const existingLanes = await getLanesByBoardId(targetBoardId).catch(() => [] as Lane[])

  let maxLaneOrder =
    existingLanes.length > 0 ? Math.max(...existingLanes.map((l) => l.order ?? 0)) + 100 : 100

  // Mapping from lowercase lane title to lane ID
  const laneTitleToId = new Map<string, number>()
  for (const l of existingLanes) {
    if (l.title && l.id !== null) {
      laneTitleToId.set(l.title.toLowerCase().trim(), l.id)
    }
  }

  // -------------------------------------------------------------
  // PHASE 1: Bulk Add New Lanes (Single Request)
  // -------------------------------------------------------------
  const addLaneActions = actions.filter((a) => a.type === 'add_lane')
  if (addLaneActions.length > 0) {
    try {
      const lanePayloads = addLaneActions.map((act, idx) => ({
        board_id: targetBoardId,
        title: act.title,
        order: maxLaneOrder + idx * 100
      }))

      const createdLanes = await createLanesBulk(lanePayloads)

      createdLanes.forEach((cl) => {
        if (cl.title && cl.id !== null && cl.id !== undefined) {
          laneTitleToId.set(cl.title.toLowerCase().trim(), cl.id)
        }
      })

      appliedCount += createdLanes.length
    } catch (err: any) {
      errors.push(`Error bulk creating columns: ${err?.message || 'Unknown error'}`)
    }
  }

  // -------------------------------------------------------------
  // PHASE 2: Concurrent Update Lanes
  // -------------------------------------------------------------
  const updateLaneActions = actions.filter((a) => a.type === 'update_lane')
  if (updateLaneActions.length > 0) {
    const laneUpdatePromises = updateLaneActions.map(async (act) => {
      const res = await updateLane(act.lane_id, { title: act.title })
      if (res) {
        laneTitleToId.set(act.title.toLowerCase().trim(), act.lane_id)
        return true
      }
      return false
    })

    const results = await Promise.allSettled(laneUpdatePromises)
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled' && r.value) {
        appliedCount++
      } else {
        errors.push(`Failed to rename column #${updateLaneActions[idx].lane_id}`)
      }
    })
  }

  // -------------------------------------------------------------
  // PHASE 3: Bulk Add Items (Single Request)
  // -------------------------------------------------------------
  const addItemActions = actions.filter((a) => a.type === 'add_item')
  if (addItemActions.length > 0) {
    try {
      const itemPayloads = addItemActions.map((act, idx) => {
        let resolvedLaneId: number | null = null

        if (act.lane_id !== undefined) {
          resolvedLaneId = act.lane_id
        } else if (act.lane_title) {
          const found = laneTitleToId.get(act.lane_title.toLowerCase().trim())
          if (found !== undefined) {
            resolvedLaneId = found
          }
        }

        return {
          board_id: targetBoardId,
          lane_id: resolvedLaneId,
          title: act.title,
          description: act.description ?? null,
          priority: act.priority ?? 0,
          order: (idx + 1) * 100
        }
      })

      const createdItems = await createItemsBulk(itemPayloads)
      appliedCount += createdItems.length
    } catch (err: any) {
      errors.push(`Error bulk creating tasks: ${err?.message || 'Unknown error'}`)
    }
  }

  // -------------------------------------------------------------
  // PHASE 4: Concurrent Update Items
  // -------------------------------------------------------------
  const updateItemActions = actions.filter((a) => a.type === 'update_item')
  if (updateItemActions.length > 0) {
    const updatesList = updateItemActions.map((act) => {
      const data: Partial<KanbanItem> = {}
      if (act.title !== undefined) data.title = act.title
      if (act.description !== undefined) data.description = act.description
      if (act.priority !== undefined) data.priority = act.priority

      if (act.target_lane_id !== undefined) {
        data.lane_id = act.target_lane_id
      } else if (act.target_lane_title) {
        const found = laneTitleToId.get(act.target_lane_title.toLowerCase().trim())
        if (found !== undefined) {
          data.lane_id = found
        }
      }

      return {
        id: act.item_id,
        data
      }
    })

    const updatedSuccessCount = await updateItemsBulk(updatesList)
    appliedCount += updatedSuccessCount
    if (updatedSuccessCount < updateItemActions.length) {
      errors.push(`Some task updates failed (${updateItemActions.length - updatedSuccessCount})`)
    }
  }

  // -------------------------------------------------------------
  // PHASE 5: Bulk Delete Items (Single Request)
  // -------------------------------------------------------------
  const deleteItemActions = actions.filter((a) => a.type === 'delete_item')
  if (deleteItemActions.length > 0) {
    const itemIds = deleteItemActions.map((a) => a.item_id)
    const ok = await deleteItemsBulk(itemIds)
    if (ok) {
      appliedCount += itemIds.length
    } else {
      errors.push(`Failed to bulk delete tasks`)
    }
  }

  // -------------------------------------------------------------
  // PHASE 6: Bulk Delete Lanes & Cascading Items (Two Requests Total)
  // -------------------------------------------------------------
  const deleteLaneActions = actions.filter((a) => a.type === 'delete_lane')
  if (deleteLaneActions.length > 0) {
    const laneIds = deleteLaneActions.map((a) => a.lane_id)
    // 1. Bulk delete items in those lanes
    await deleteItemsByLaneIds(laneIds).catch(() => {})
    // 2. Bulk delete lanes
    const ok = await deleteLanesBulk(laneIds)
    if (ok) {
      appliedCount += laneIds.length
    } else {
      errors.push(`Failed to bulk delete columns`)
    }
  }

  // -------------------------------------------------------------
  // PHASE 7: Refresh Stores & Broadcast (Once)
  // -------------------------------------------------------------
  const boardIdStr = String(boardId)
  await Promise.all([
    useLanesStore.getState().refreshLanes(boardIdStr),
    useItemsStore.getState().refreshItems(boardIdStr)
  ])
  broadcastSyncEvent('lanes')
  broadcastSyncEvent('items')

  return {
    success: errors.length === 0,
    appliedCount,
    errors
  }
}
