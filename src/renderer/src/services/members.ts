import { supabase } from '@/lib/supabase'

export async function getBoardMembers(boardId: number | string): Promise<BoardMember[]> {
  const { data, error } = await supabase
    .from('board_members')
    .select('*')
    .eq('board_id', Number(boardId))
    .order('created_at', { ascending: true })

  if (error || !data) {
    if (error) console.error('Error fetching board members:', error)
    return []
  }

  const userIds = data.map((m: any) => m.user_id).filter(Boolean)
  if (userIds.length === 0) return data as BoardMember[]

  try {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, display_name, name')
      .in('id', userIds)

    if (profiles && profiles.length > 0) {
      const profileMap = new Map(profiles.map((p: any) => [p.id, p]))
      return data.map((m: any) => {
        const prof = profileMap.get(m.user_id)
        return {
          ...m,
          user_email: m.user_email || m.email || prof?.email || null,
          user_name: m.user_name || m.full_name || prof?.full_name || prof?.display_name || prof?.name || null
        }
      }) as BoardMember[]
    }
  } catch (_e) {
    // Ignore if profiles table does not exist
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
