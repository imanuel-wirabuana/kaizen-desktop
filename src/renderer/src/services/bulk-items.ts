import { supabase } from '@/lib/supabase'

/**
 * Inserts multiple tasks in a single multi-row database query.
 * Returns the created items including their auto-generated IDs.
 */
export async function createItemsBulk(
  items: Partial<KanbanItem>[]
): Promise<KanbanItem[]> {
  if (items.length === 0) return []

  const payload = items.map((item, idx) => ({
    board_id: Number(item.board_id),
    lane_id: item.lane_id !== undefined && item.lane_id !== null ? Number(item.lane_id) : null,
    title: item.title || 'New Task',
    icon: item.icon ?? null,
    description: item.description ?? null,
    order: item.order ?? (idx + 1) * 100,
    priority: item.priority ?? 0,
    due_date: item.due_date ?? null,
    background: item.background ?? null,
    owner: item.owner ?? null
  }))

  const { data, error } = await supabase.from('items').insert(payload).select()

  if (error) {
    console.error('Error bulk creating items:', error)
    throw new Error(`Failed to bulk create tasks: ${error.message}`)
  }

  return (data || []) as KanbanItem[]
}

/**
 * Deletes multiple tasks in a single query using `.in('id', itemIds)`.
 */
export async function deleteItemsBulk(itemIds: (number | string)[]): Promise<boolean> {
  if (itemIds.length === 0) return true

  const numericIds = itemIds.map(Number).filter((id) => !isNaN(id))
  if (numericIds.length === 0) return true

  const { error } = await supabase.from('items').delete().in('id', numericIds)

  if (error) {
    console.error('Error bulk deleting items:', error)
    return false
  }

  return true
}

/**
 * Updates multiple items with the same fields in a single SQL query using `.in('id', numericIds)`.
 */
export async function updateItemsCommonFields(
  itemIds: (number | string)[],
  updates: Partial<KanbanItem>
): Promise<boolean> {
  if (itemIds.length === 0) return true

  const numericIds = itemIds.map(Number).filter((id) => !isNaN(id))
  if (numericIds.length === 0) return true

  const payload: Record<string, any> = {
    ...updates,
    updated_at: new Date().toISOString()
  }

  if (payload.lane_id !== undefined) {
    payload.lane_id =
      payload.lane_id !== null && !isNaN(Number(payload.lane_id)) ? Number(payload.lane_id) : null
  }

  const { error } = await supabase.from('items').update(payload).in('id', numericIds)

  if (error) {
    console.error('Error updating items common fields:', error)
    return false
  }

  return true
}

/**
 * Deletes all items belonging to specified lane IDs in a single query.
 */
export async function deleteItemsByLaneIds(laneIds: number[]): Promise<boolean> {
  if (laneIds.length === 0) return true

  const { error } = await supabase.from('items').delete().in('lane_id', laneIds)

  if (error) {
    console.error('Error deleting items by lane ids:', error)
    return false
  }

  return true
}

/**
 * Concurrently updates multiple tasks using Promise.allSettled.
 */
export async function updateItemsBulk(
  updatesList: { id: number; data: Partial<KanbanItem> }[]
): Promise<number> {
  if (updatesList.length === 0) return 0

  const promises = updatesList.map(({ id, data }) => {
    const payload: Record<string, any> = {
      ...data,
      updated_at: new Date().toISOString()
    }
    if (payload.lane_id !== undefined) {
      payload.lane_id =
        payload.lane_id !== null && !isNaN(Number(payload.lane_id)) ? Number(payload.lane_id) : null
    }
    if (payload.order !== undefined && payload.order !== null) {
      payload.order = Number(payload.order)
    }

    return supabase.from('items').update(payload).eq('id', Number(id))
  })

  const results = await Promise.allSettled(promises)
  let successCount = 0

  results.forEach((res, idx) => {
    const targetId = updatesList[idx]?.id
    if (res.status === 'fulfilled') {
      if (res.value.error) {
        console.error(`updateItemsBulk: failed to update item ${targetId}:`, res.value.error)
      } else {
        successCount++
      }
    } else {
      console.error(`updateItemsBulk: rejected updating item ${targetId}:`, res.reason)
    }
  })

  return successCount
}
