import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

// 1. Fetch all lanes for a specific board, ordered by 'order' ascending
export async function getLanesByBoardId(boardId: number | string): Promise<Lane[]> {
  const { data, error } = await supabase
    .from('lanes')
    .select('*')
    .eq('board_id', boardId)
    .order('order', { ascending: true })

  if (error) {
    console.error('Error fetching lanes:', error)
    return []
  }
  return data as Lane[]
}

// 2. Fetch single lane by ID
export async function getLaneById(id: number | string): Promise<Lane | null> {
  const { data, error } = await supabase.from('lanes').select('*').eq('id', id).single()

  if (error) {
    console.error('Error fetching lane by ID:', error)
    return null
  }
  return data as Lane
}

// 3. Create a new lane
export async function createLane(
  lane: Partial<Omit<Lane, 'id' | 'created_at' | 'updated_at'>>
): Promise<Lane | null> {
  const { data, error } = await supabase.from('lanes').insert([lane]).select()

  if (error) {
    console.error('Error creating lane:', error)
    return null
  }
  return data?.[0] as Lane
}

// 4. Update a lane by ID
export async function updateLane(
  id: number | string,
  updates: Partial<Lane>
): Promise<Lane | null> {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase.from('lanes').update(payload).eq('id', id).select()

  if (error) {
    console.error('Error updating lane:', error)
    return null
  }
  return data?.[0] as Lane
}

// 5. Delete a lane by ID
export async function deleteLane(id: number | string): Promise<boolean> {
  const { error } = await supabase.from('lanes').delete().eq('id', id)

  if (error) {
    console.error('Error deleting lane:', error)
    return false
  }
  return true
}

// 6. Realtime subscription for lanes table on a specific board
export function subscribeLanes(
  boardId: number | string,
  onPayload?: (payload: unknown) => void
): RealtimeChannel {
  const channelName = `lanes-board-${boardId}-${Math.random().toString(36).substring(2, 9)}`
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'lanes',
        filter: `board_id=eq.${boardId}`
      },
      (payload) => {
        console.log('Lanes realtime change received:', payload)
        if (onPayload) {
          onPayload(payload)
        }
      }
    )
    .subscribe()

  return channel
}
