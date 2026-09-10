import { getLanesByBoardId, updateLane } from '@/services/lanes'
import { createLanesBulk, deleteLanesBulk } from '@/services/bulk-lanes'
import {
  createItemsBulk,
  deleteItemsBulk,
  deleteItemsByLaneIds,
  updateItemsBulk
} from '@/services/bulk-items'
import { useBoardsStore } from '@/stores/boards'
import { useLanesStore } from '@/stores/lanes'
import { useItemsStore } from '@/stores/items'
import { broadcastSyncEvent } from '@/lib/realtime'
import { sendTicketAssignmentEmail } from '@/services/email'
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

  // -------------------------------------------------------------
  // PHASE 0: Update Board Properties
  // -------------------------------------------------------------
  const updateBoardActions = actions.filter((a) => a.type === 'update_board')
  if (updateBoardActions.length > 0) {
    const boardUpdates: Partial<Board> = {}
    for (const act of updateBoardActions) {
      if (act.title !== undefined) boardUpdates.title = act.title
      if (act.icon !== undefined) boardUpdates.icon = act.icon
      if (act.description !== undefined) boardUpdates.description = act.description
      if (act.background !== undefined) boardUpdates.background = act.background
    }
    if (Object.keys(boardUpdates).length > 0) {
      try {
        await useBoardsStore.getState().updateBoard(targetBoardId, boardUpdates)
        appliedCount += updateBoardActions.length
      } catch (err: any) {
        errors.push(`Error updating board properties: ${err?.message || 'Unknown error'}`)
      }
    }
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

  const cleanStringForMatch = (s: string) =>
    s
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .toLowerCase()
      .trim()

  const resolveLaneIdFromTitle = (title: string | undefined): number | null | undefined => {
    if (!title) return undefined
    const trimmed = title.trim()
    if (['draft', 'drafts', 'unassigned', 'inbox', 'draft column'].includes(trimmed.toLowerCase())) {
      return null
    }
    const exact = laneTitleToId.get(trimmed.toLowerCase())
    if (exact !== undefined) return exact

    const cleanSearch = cleanStringForMatch(trimmed)
    for (const [t, id] of laneTitleToId.entries()) {
      if (cleanStringForMatch(t) === cleanSearch) return id
    }
    for (const [t, id] of laneTitleToId.entries()) {
      if (cleanSearch.length > 2 && (cleanStringForMatch(t).includes(cleanSearch) || cleanSearch.includes(cleanStringForMatch(t)))) {
        return id
      }
    }
    return undefined
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
        icon: act.icon ?? null,
        description: act.description ?? null,
        background: act.background ?? null,
        order: act.order !== undefined && act.order !== null ? act.order : maxLaneOrder + idx * 100
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
      const updateData: Partial<Lane> = {}
      if (act.title !== undefined) updateData.title = act.title
      if (act.icon !== undefined) updateData.icon = act.icon
      if (act.description !== undefined) updateData.description = act.description
      if (act.background !== undefined) updateData.background = act.background
      if (act.order !== undefined && act.order !== null) updateData.order = act.order

      const res = await updateLane(act.lane_id, updateData)
      if (res) {
        if (act.title) {
          laneTitleToId.set(act.title.toLowerCase().trim(), act.lane_id)
        }
        return true
      }
      return false
    })

    const results = await Promise.allSettled(laneUpdatePromises)
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled' && r.value) {
        appliedCount++
      } else {
        errors.push(`Failed to update column #${updateLaneActions[idx].lane_id}`)
      }
    })
  }

  // Fetch current items on the board to track per-lane orders
  const allBoardItems = useItemsStore
    .getState()
    .items.filter((i) => String(i.board_id) === String(targetBoardId))

  const maxOrderPerLane = new Map<number | null, number>()
  const minOrderPerLane = new Map<number | null, number>()

  for (const item of allBoardItems) {
    const lId = item.lane_id ?? null
    const ord = item.order ?? 0
    const curMax = maxOrderPerLane.get(lId)
    if (curMax === undefined || ord > curMax) {
      maxOrderPerLane.set(lId, ord)
    }
    const curMin = minOrderPerLane.get(lId)
    if (curMin === undefined || ord < curMin) {
      minOrderPerLane.set(lId, ord)
    }
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
          resolvedLaneId = resolveLaneIdFromTitle(act.lane_title) ?? null
        }

        const currentLaneMax = maxOrderPerLane.get(resolvedLaneId) ?? 0
        const calculatedOrder =
          act.order !== undefined && act.order !== null
            ? act.order
            : currentLaneMax + (idx + 1) * 100

        maxOrderPerLane.set(resolvedLaneId, Math.max(currentLaneMax, calculatedOrder))

        return {
          board_id: targetBoardId,
          lane_id: resolvedLaneId,
          title: act.title,
          icon: act.icon ?? null,
          description: act.description ?? null,
          priority: act.priority ?? 0,
          status: act.status ?? false,
          start_date: act.start_date ?? null,
          due_date: act.due_date ?? null,
          assignee: act.assignee ?? null,
          background: act.background ?? null,
          order: calculatedOrder
        }
      })

      const createdItems = await createItemsBulk(itemPayloads)
      appliedCount += createdItems.length

      // Auto email notification for newly created tasks with an assignee
      for (const createdItem of createdItems) {
        if (createdItem.assignee && createdItem.assignee.trim()) {
          sendTicketAssignmentEmail({
            item: createdItem,
            boardId: targetBoardId,
            assigneeName: createdItem.assignee.trim()
          }).catch((err) =>
            console.error('[executeBoardMutations] Failed to send assignment email for created item:', err)
          )
        }
      }
    } catch (err: any) {
      errors.push(`Error bulk creating tasks: ${err?.message || 'Unknown error'}`)
    }
  }

  // -------------------------------------------------------------
  // PHASE 4: Concurrent Update / Move Items
  // -------------------------------------------------------------
  const updateItemActions = actions.filter(
    (a) => a.type === 'update_item' || a.type === 'move_item'
  )
  if (updateItemActions.length > 0) {
    const updatesList = updateItemActions.map((act) => {
      const data: Partial<KanbanItem> = {}
      if ('title' in act && act.title !== undefined) data.title = act.title
      if ('icon' in act && act.icon !== undefined) data.icon = act.icon
      if ('description' in act && act.description !== undefined) data.description = act.description
      if ('priority' in act && act.priority !== undefined) data.priority = act.priority
      if ('status' in act && act.status !== undefined) data.status = act.status
      if ('start_date' in act && act.start_date !== undefined) data.start_date = act.start_date
      if ('due_date' in act && act.due_date !== undefined) data.due_date = act.due_date
      if ('assignee' in act && act.assignee !== undefined) data.assignee = act.assignee
      if ('background' in act && act.background !== undefined) data.background = act.background

      // Resolve destination lane ID
      let resolvedLaneId: number | null | undefined = undefined
      if (act.target_lane_id !== undefined) {
        resolvedLaneId = act.target_lane_id
      } else if (act.target_lane_title) {
        resolvedLaneId = resolveLaneIdFromTitle(act.target_lane_title)
      }

      if (resolvedLaneId !== undefined) {
        data.lane_id = resolvedLaneId
      }

      // Existing task state
      const currentTask = allBoardItems.find((i) => i.id === act.item_id)
      const isLaneChange =
        resolvedLaneId !== undefined &&
        (currentTask ? currentTask.lane_id !== resolvedLaneId : true)
      const targetLane =
        resolvedLaneId !== undefined ? resolvedLaneId : (currentTask?.lane_id ?? null)

      // Calculate order
      if (act.order === 'top') {
        const curMin = minOrderPerLane.get(targetLane) ?? 100
        const newOrder = curMin > 10 ? curMin - 100 : Math.max(1, Math.floor(curMin / 2))
        minOrderPerLane.set(targetLane, newOrder)
        data.order = newOrder
      } else if (act.order === 'bottom') {
        const curMax = maxOrderPerLane.get(targetLane) ?? 0
        const newOrder = curMax + 100
        maxOrderPerLane.set(targetLane, newOrder)
        data.order = newOrder
      } else if (typeof act.order === 'number') {
        data.order = act.order
        const curMax = maxOrderPerLane.get(targetLane) ?? 0
        if (act.order > curMax) {
          maxOrderPerLane.set(targetLane, act.order)
        }
      } else if (isLaneChange) {
        // Default when moving to a new column without explicit order: append to bottom
        const curMax = maxOrderPerLane.get(targetLane) ?? 0
        const newOrder = curMax + 100
        maxOrderPerLane.set(targetLane, newOrder)
        data.order = newOrder
      }

      return {
        id: act.item_id,
        data
      }
    })

    // Track items that are receiving a new or modified assignee
    const assignedUpdatesToNotify: { item: Partial<KanbanItem>; assigneeName: string }[] = []
    for (const act of updateItemActions) {
      if ('assignee' in act && act.assignee !== undefined && act.assignee !== null) {
        const newAssignee = act.assignee.trim()
        const currentTask = allBoardItems.find((i) => i.id === act.item_id)
        const prevAssignee = currentTask?.assignee?.trim() || ''

        // Only notify if newAssignee is non-empty and changed from previous assignee
        if (newAssignee && newAssignee.toLowerCase() !== prevAssignee.toLowerCase()) {
          const updateEntry = updatesList.find((u) => u.id === act.item_id)
          const mergedItem: Partial<KanbanItem> = {
            ...(currentTask || {}),
            ...(updateEntry?.data || {}),
            id: act.item_id,
            board_id: targetBoardId,
            assignee: newAssignee
          }
          assignedUpdatesToNotify.push({ item: mergedItem, assigneeName: newAssignee })
        }
      }
    }

    const updatedSuccessCount = await updateItemsBulk(updatesList)
    appliedCount += updatedSuccessCount
    if (updatedSuccessCount < updateItemActions.length) {
      errors.push(`Some task updates failed (${updateItemActions.length - updatedSuccessCount})`)
    }

    // Auto email notification for successfully updated tasks with new or modified assignee
    if (updatedSuccessCount > 0 && assignedUpdatesToNotify.length > 0) {
      for (const notify of assignedUpdatesToNotify) {
        sendTicketAssignmentEmail({
          item: notify.item,
          boardId: targetBoardId,
          assigneeName: notify.assigneeName
        }).catch((err) =>
          console.error('[executeBoardMutations] Failed to send assignment email for updated item:', err)
        )
      }
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
  if (updateBoardActions.length > 0) {
    broadcastSyncEvent('boards')
  }
  broadcastSyncEvent('lanes')
  broadcastSyncEvent('items')

  return {
    success: errors.length === 0,
    appliedCount,
    errors
  }
}
