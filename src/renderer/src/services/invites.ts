import { supabase } from '@/lib/supabase'

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let part1 = ''
  let part2 = ''
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length))
    part2 += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${part1}-${part2}`
}

export type ExpirationOption = 'never' | '1_hour' | '1_day' | '7_days' | '30_days'
export type MaxUsesOption = 'unlimited' | '1' | '5' | '10'

export async function createInvite({
  boardId,
  permission,
  expiresOption,
  maxUsesOption,
  createdBy
}: {
  boardId: number | string
  permission: 'view' | 'edit'
  expiresOption: ExpirationOption
  maxUsesOption: MaxUsesOption
  createdBy: string
}): Promise<BoardInvite | null> {
  const code = generateInviteCode()

  let expires_at: string | null = null
  const now = Date.now()
  if (expiresOption === '1_hour') {
    expires_at = new Date(now + 60 * 60 * 1000).toISOString()
  } else if (expiresOption === '1_day') {
    expires_at = new Date(now + 24 * 60 * 60 * 1000).toISOString()
  } else if (expiresOption === '7_days') {
    expires_at = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString()
  } else if (expiresOption === '30_days') {
    expires_at = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString()
  }

  let max_uses: number | null = null
  if (maxUsesOption !== 'unlimited') {
    max_uses = parseInt(maxUsesOption, 10)
  }

  const payload: Record<string, any> = {
    board_id: Number(boardId),
    code,
    permission,
    max_uses,
    use_count: 0,
    revoked: false,
    created_by: createdBy
  }

  // Only include expires_at if set
  if (expires_at) {
    payload.expires_at = expires_at
  }

  const { data, error } = await supabase.from('board_invites').insert([payload]).select()

  if (error) {
    // If expires_at column doesn't exist, retry without expires_at
    if (error.message?.includes('expires_at')) {
      delete payload.expires_at
      const { data: retryData, error: retryError } = await supabase
        .from('board_invites')
        .insert([payload])
        .select()

      if (retryError) {
        console.error('Error creating invite (retry):', retryError)
        return null
      }
      return (retryData?.[0] as BoardInvite) || null
    }

    console.error('Error creating invite:', error)
    return null
  }

  return (data?.[0] as BoardInvite) || null
}

export async function getInvitesByBoardId(boardId: number | string): Promise<BoardInvite[]> {
  const { data, error } = await supabase
    .from('board_invites')
    .select('*')
    .eq('board_id', Number(boardId))
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching invites:', error)
    return []
  }

  return data as BoardInvite[]
}

export async function revokeInvite(inviteId: number): Promise<boolean> {
  const { error } = await supabase
    .from('board_invites')
    .update({ revoked: true })
    .eq('id', inviteId)

  if (error) {
    console.error('Error revoking invite:', error)
    return false
  }

  return true
}

export type RedeemResult = {
  success: boolean
  already_member?: boolean
  message: string
  board?: Board
}

export async function redeemInviteCode(code: string, userId: string): Promise<RedeemResult> {
  const cleanCode = code.trim().toUpperCase()
  if (!cleanCode) {
    return { success: false, message: 'Please enter a valid invite code.' }
  }

  if (!userId) {
    return { success: false, message: 'User identity missing.' }
  }

  // 1. Try atomic RPC function first
  const { data: rpcData, error: rpcErr } = await supabase.rpc('redeem_invite_code', {
    p_code: cleanCode,
    p_user_id: userId
  })

  if (!rpcErr && rpcData) {
    return rpcData as RedeemResult
  }

  // 2. Client-side fallback if RPC is not deployed yet
  const { data: invite, error: invErr } = await supabase
    .from('board_invites')
    .select('*')
    .ilike('code', cleanCode)
    .single()

  if (invErr || !invite) {
    return { success: false, message: 'Invite code does not exist.' }
  }

  if (invite.revoked) {
    return { success: false, message: 'Invite code has been revoked.' }
  }

  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return { success: false, message: 'Invite code has expired.' }
  }

  if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
    return { success: false, message: 'Invite code usage limit reached.' }
  }

  // Check board
  const { data: board, error: boardErr } = await supabase
    .from('boards')
    .select('*')
    .eq('id', invite.board_id)
    .single()

  if (boardErr || !board) {
    return { success: false, message: 'Associated board not found.' }
  }

  if (board.owner === userId) {
    return {
      success: true,
      already_member: true,
      message: 'You already have access to this board.',
      board: board as Board
    }
  }

  // Check membership
  const { data: existingMember } = await supabase
    .from('board_members')
    .select('*')
    .eq('board_id', invite.board_id)
    .eq('user_id', userId)
    .maybeSingle()

  if (existingMember) {
    return {
      success: true,
      already_member: true,
      message: 'You already have access to this board.',
      board: board as Board
    }
  }

  // Insert member
  const { error: insertErr } = await supabase.from('board_members').insert([
    {
      board_id: invite.board_id,
      user_id: userId,
      permission: invite.permission || 'view',
      created_at: new Date().toISOString()
    }
  ])

  if (insertErr) {
    if (insertErr.code === '23505') {
      // Unique violation
      return {
        success: true,
        already_member: true,
        message: 'You already have access to this board.',
        board: board as Board
      }
    }
    console.error('Error inserting member:', insertErr)
    return { success: false, message: 'Failed to join board.' }
  }

  // Increment usage count
  await supabase
    .from('board_invites')
    .update({ use_count: (invite.use_count || 0) + 1 })
    .eq('id', invite.id)

  return {
    success: true,
    already_member: false,
    message: 'Board joined successfully.',
    board: board as Board
  }
}
