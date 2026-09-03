import { supabase } from '@/lib/supabase'
import { touchBoardActivity } from './boards'

export async function getItemsByBoardId(boardId: number | string): Promise<KanbanItem[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('board_id', Number(boardId))
    .order('order', { ascending: true })

  if (error) {
    console.error('Error fetching items by board ID:', error)
    return []
  }

  return data as KanbanItem[]
}

export async function getItemById(id: number): Promise<KanbanItem | null> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error(`Error fetching item ${id}:`, error)
    return null
  }

  return data as KanbanItem
}

export async function createItem(
  item: Partial<KanbanItem>
): Promise<KanbanItem | null> {
  const payload = {
    board_id: Number(item.board_id),
    lane_id: item.lane_id !== undefined && item.lane_id !== null ? Number(item.lane_id) : null,
    title: item.title ?? 'New Task',
    icon: item.icon ?? null,
    description: item.description ?? null,
    order: item.order ?? 100,
    priority: item.priority ?? 0,
    due_date: item.due_date ?? null,
    background: item.background ?? null,
    owner: item.owner ?? null
  }

  const { data, error } = await supabase
    .from('items')
    .insert([payload])
    .select()

  if (error) {
    console.error('Error creating item:', error)
    return null
  }

  if (data?.[0]?.board_id) {
    touchBoardActivity(data[0].board_id)
  }
  return data?.[0] as KanbanItem
}

export async function updateItem(
  id: number | string,
  updates: Partial<KanbanItem>
): Promise<KanbanItem | null> {
  const payload: Record<string, any> = { ...updates, updated_at: new Date().toISOString() }
  if (payload.lane_id !== undefined) {
    payload.lane_id = payload.lane_id !== null ? (typeof payload.lane_id === 'number' || !isNaN(Number(payload.lane_id)) ? Number(payload.lane_id) : payload.lane_id) : null
  }

  const { data, error } = await supabase
    .from('items')
    .update(payload)
    .eq('id', id)
    .select()

  if (error) {
    console.error(`Error updating item ${id}:`, error)
    return null
  }

  if (data?.[0]?.board_id) {
    touchBoardActivity(data[0].board_id)
  }
  return data?.[0] as KanbanItem
}

export async function deleteItem(id: number | string): Promise<boolean> {
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(`Error deleting item ${id}:`, error)
    return false
  }

  return true
}

export function subscribeItems(
  boardId: number | string,
  onPayload?: (payload: unknown) => void
) {
  const channelName = `items-board-${boardId}-${Math.random().toString(36).substring(2, 9)}`
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'items'
      },
      (payload: any) => {
        if (onPayload) {
          onPayload(payload)
        }
      }
    )
    .subscribe()

  return channel
}
