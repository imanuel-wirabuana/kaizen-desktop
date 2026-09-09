import { supabase } from '@/lib/supabase'

/**
 * Inserts multiple lanes in a single multi-row database query.
 * Returns the created lanes including their auto-generated IDs.
 */
export async function createLanesBulk(
  lanes: Partial<Omit<Lane, 'id' | 'created_at' | 'updated_at'>>[]
): Promise<Lane[]> {
  if (lanes.length === 0) return []

  const payload = lanes.map((lane) => ({
    board_id: lane.board_id ? Number(lane.board_id) : null,
    title: lane.title || 'New Column',
    icon: lane.icon || null,
    description: lane.description || null,
    background: lane.background || null,
    order: lane.order ?? 100,
    owner: lane.owner || null,
    owner_info: lane.owner_info ?? null
  }))

  const { data, error } = await supabase.from('lanes').insert(payload).select()

  if (error) {
    console.error('Error bulk creating lanes:', error)
    throw new Error(`Failed to bulk create columns: ${error.message}`)
  }

  return (data || []) as Lane[]
}

/**
 * Deletes multiple lanes in a single database query using `.in('id', laneIds)`.
 */
export async function deleteLanesBulk(laneIds: number[]): Promise<boolean> {
  if (laneIds.length === 0) return true

  const { error } = await supabase.from('lanes').delete().in('id', laneIds)

  if (error) {
    console.error('Error bulk deleting lanes:', error)
    return false
  }

  return true
}
