import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

// 1. Fetch all boards (owned and shared for current user)
export async function getBoards(userId?: string): Promise<Board[]> {
  if (!userId) {
    const { data, error } = await supabase.from('boards').select('*').order('order', { ascending: true })
    if (error) {
      console.error('Error fetching boards:', error)
      return []
    }
    return (data as Board[]).map((b) => ({ ...b, role: 'owner' as const }))
  }

  // 1. Fetch owned boards
  const { data: ownedBoards, error: ownedErr } = await supabase
    .from('boards')
    .select('*')
    .eq('owner', userId)

  if (ownedErr) {
    console.error('Error fetching owned boards:', ownedErr)
  }

  // 2. Fetch member memberships
  const { data: memberships, error: memberErr } = await supabase
    .from('board_members')
    .select('board_id, permission')
    .eq('user_id', userId)

  if (memberErr) {
    console.error('Error fetching board memberships:', memberErr)
  }

  const memberBoardIds = (memberships || [])
    .map((m) => m.board_id)
    .filter((id): id is number => id !== null && id !== undefined)

  const memberPermissionMap = new Map<number, 'edit' | 'view' | 'owner'>(
    (memberships || []).map((m) => [m.board_id, (m.permission as any) || 'view'])
  )

  let sharedBoards: Board[] = []
  if (memberBoardIds.length > 0) {
    const ownedIds = new Set((ownedBoards || []).map((b) => b.id))
    const idsToFetch = memberBoardIds.filter((id) => !ownedIds.has(id))

    if (idsToFetch.length > 0) {
      const { data: fetchedShared, error: sharedErr } = await supabase
        .from('boards')
        .select('*')
        .in('id', idsToFetch)

      if (sharedErr) {
        console.error('Error fetching shared boards:', sharedErr)
      } else if (fetchedShared) {
        sharedBoards = fetchedShared as Board[]
      }
    }
  }

  const ownedList: Board[] = (ownedBoards || []).map((b) => ({
    ...b,
    role: 'owner' as const
  }))

  const sharedList: Board[] = sharedBoards.map((b) => ({
    ...b,
    role: (memberPermissionMap.get(b.id!) || 'view') as 'edit' | 'view'
  }))

  const allBoards = [...ownedList, ...sharedList].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  )

  return allBoards
}

// 2. Fetch paginated boards (optionally filtered by owner)
export async function getPaginatedBoards(from = 0, to = 9, owner?: string): Promise<Board[]> {
  let query = supabase
    .from('boards')
    .select('*')
    .order('order', { ascending: true })
    .range(from, to)

  if (owner) {
    query = query.eq('owner', owner)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching paginated boards:', error)
    return []
  }
  return data as Board[]
}

// 3. Search and filter boards
export async function searchBoards(filters?: {
  title?: string
  pinned?: boolean
  ids?: (number | string)[]
  owner?: string
}): Promise<Board[]> {
  let query = supabase.from('boards').select('*').order('order', { ascending: true })

  if (filters?.owner) {
    query = query.eq('owner', filters.owner)
  }
  if (filters?.title) {
    query = query.ilike('title', `%${filters.title}%`)
  }
  if (filters?.pinned !== undefined) {
    query = query.eq('pinned', filters.pinned)
  }
  if (filters?.ids && filters.ids.length > 0) {
    query = query.in('id', filters.ids)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error searching boards:', error)
    return []
  }
  return data as Board[]
}

// 4. Fetch single board by ID
export async function getBoardById(id: number | string): Promise<Board | null> {
  const { data, error } = await supabase.from('boards').select('*').eq('id', id).single()

  if (error) {
    console.error('Error fetching board by ID:', error)
    return null
  }
  return data as Board
}

// 5. Insert single board
export async function createBoard(
  board: Partial<Omit<Board, 'id' | 'created_at' | 'updated_at'>>
): Promise<Board | null> {
  const { data, error } = await supabase.from('boards').insert([board]).select()

  if (error) {
    console.error('Error creating board:', error)
    return null
  }
  return data?.[0] as Board
}

// 6. Insert multiple boards
export async function createMultipleBoards(
  boards: Partial<Omit<Board, 'id' | 'created_at' | 'updated_at'>>[]
): Promise<Board[]> {
  const { data, error } = await supabase.from('boards').insert(boards).select()

  if (error) {
    console.error('Error creating multiple boards:', error)
    return []
  }
  return data as Board[]
}

// 7. Update board by ID
export async function updateBoard(
  id: number | string,
  updates: Partial<Board>
): Promise<Board | null> {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase.from('boards').update(payload).eq('id', id).select()

  if (error) {
    console.error('Error updating board:', error)
    return null
  }
  return data?.[0] as Board
}

// 8. Delete board by ID
export async function deleteBoard(id: number | string): Promise<boolean> {
  const { error } = await supabase.from('boards').delete().eq('id', id)

  if (error) {
    console.error('Error deleting board:', error)
    return false
  }
  return true
}

// 9. Upsert board
export async function upsertBoard(board: Partial<Board>): Promise<Board | null> {
  const payload = {
    ...board,
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase.from('boards').upsert(payload).select()

  if (error) {
    console.error('Error upserting board:', error)
    return null
  }
  return data?.[0] as Board
}

// 10. Realtime Subscription
export function subscribeBoards(onPayload?: (payload: unknown) => void): RealtimeChannel {
  const channelName = `boards-changes-${Math.random().toString(36).substring(2, 9)}`
  const boardsChannel = supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'boards' }, (payload) => {
      console.log('Boards change received!', payload)
      if (onPayload) {
        onPayload(payload)
      }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'board_members' }, (payload) => {
      console.log('Board members change received!', payload)
      if (onPayload) {
        onPayload(payload)
      }
    })
    .subscribe()

  return boardsChannel
}
