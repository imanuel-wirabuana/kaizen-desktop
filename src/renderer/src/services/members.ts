import { supabase } from '@/lib/supabase'

export async function getBoardMembers(boardId: number | string): Promise<BoardMember[]> {
  const { data, error } = await supabase
    .from('board_members')
    .select('*')
    .eq('board_id', Number(boardId))
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching board members:', error)
    return []
  }

  return data as BoardMember[]
}

export async function updateMemberPermission(
  memberId: number,
  permission: 'view' | 'edit'
): Promise<boolean> {
  const { error } = await supabase
    .from('board_members')
    .update({ permission, updated_at: new Date().toISOString() })
    .eq('id', memberId)

  if (error) {
    console.error('Error updating member permission:', error)
    return false
  }

  return true
}

export async function removeMember(memberId: number): Promise<boolean> {
  const { error } = await supabase.from('board_members').delete().eq('id', memberId)

  if (error) {
    console.error('Error removing member:', error)
    return false
  }

  return true
}

export async function getUserBoardPermission(
  boardId: number | string,
  userId: string
): Promise<'owner' | 'edit' | 'view' | null> {
  if (!boardId || !userId) return null

  // 1. Check if user is owner of board
  const { data: board } = await supabase
    .from('boards')
    .select('owner')
    .eq('id', Number(boardId))
    .single()

  if (board && board.owner === userId) {
    return 'owner'
  }

  // 2. Check board_members
  const { data: member } = await supabase
    .from('board_members')
    .select('permission')
    .eq('board_id', Number(boardId))
    .eq('user_id', userId)
    .maybeSingle()

  if (member && member.permission) {
    return member.permission as 'edit' | 'view'
  }

  return null
}
