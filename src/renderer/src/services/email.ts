import { Resend } from 'resend'
import { supabase } from '@/lib/supabase'
import { useBoardsStore } from '@/stores/boards'
import * as membersService from '@/services/members'

export interface ResolvedAssignee {
  email: string
  name: string
}

export interface TicketAssignmentEmailParams {
  item: Partial<KanbanItem>
  boardId?: number | string | null
  assigneeName?: string | null
  assignedByName?: string | null
}

const resendApiKey =
  (import.meta as any).env?.VITE_RESEND_API_KEY ||
  (typeof process !== 'undefined' ? process.env?.RESEND_API_KEY : '') ||
  ''

export const defaultSenderEmail =
  (import.meta as any).env?.VITE_RESEND_FROM_EMAIL ||
  (typeof process !== 'undefined' ? process.env?.RESEND_FROM_EMAIL : '') ||
  'kaizen@kaizen33.space'

export const resend = new Resend(resendApiKey)

/**
 * Resolves the email address and display name for an assignee string.
 * Checks:
 * 1. Direct email address format
 * 2. Board members list
 * 3. Currently authenticated user (self-assignment)
 * 4. Board owner info
 * 5. Supabase profiles table
 */
export async function resolveAssigneeEmail(
  assignee: string | null | undefined,
  boardId?: number | string | null
): Promise<ResolvedAssignee | null> {
  if (!assignee || !assignee.trim()) return null
  const trimmed = assignee.trim()
  const lower = trimmed.toLowerCase()

  // 1. Direct email string match or embedded email in string (e.g., "Name <email@domain.com>" or "user@domain.com")
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  const emailMatch = trimmed.match(emailRegex)
  if (emailMatch) {
    const extractedEmail = emailMatch[0]
    const extractedName =
      trimmed.replace(extractedEmail, '').replace(/[<>()[\]]/g, '').trim() ||
      extractedEmail.split('@')[0]
    return {
      email: extractedEmail,
      name: extractedName
    }
  }

  // 2. Search board members
  if (boardId) {
    try {
      const members = await membersService.getBoardMembers(boardId)
      for (const m of members) {
        const mName = (m.user_name || m.full_name || '').toLowerCase()
        const mEmail = (m.user_email || m.email || '').toLowerCase()
        if ((mName && mName === lower) || (mEmail && mEmail === lower)) {
          const email = m.user_email || m.email
          if (email && emailRegex.test(email)) {
            return {
              email,
              name: m.user_name || m.full_name || trimmed
            }
          }
        }
      }
    } catch (err) {
      console.warn('[resolveAssigneeEmail] Failed to fetch board members:', err)
    }
  }

  // 3. Check current authenticated user (if assigned to self)
  try {
    const { data: authData } = await supabase.auth.getUser()
    const currentUser = authData?.user
    if (currentUser?.email) {
      const currentFullName = (
        currentUser.user_metadata?.full_name ||
        currentUser.user_metadata?.name ||
        currentUser.email.split('@')[0]
      ).toLowerCase()

      if (
        currentFullName === lower ||
        currentUser.email.toLowerCase() === lower ||
        `${currentFullName} (me)` === lower
      ) {
        return {
          email: currentUser.email,
          name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || trimmed
        }
      }
    }
  } catch (err) {
    console.warn('[resolveAssigneeEmail] Failed to check auth user:', err)
  }

  // 4. Check board owner info
  if (boardId) {
    const boards = useBoardsStore.getState().boards
    const board = boards.find((b) => String(b.id) === String(boardId))
    if (board) {
      const cleanLower = lower.replace(/\s*\((me,\s*owner|me|owner)\)$/i, '').trim()

      if (board.owner_info?.email) {
        const ownerName = (board.owner_info.name || '').toLowerCase()
        const ownerEmail = board.owner_info.email.toLowerCase()
        if (
          ownerName === lower ||
          ownerName === cleanLower ||
          ownerEmail === lower ||
          ownerEmail === cleanLower ||
          (ownerName && cleanLower.includes(ownerName)) ||
          (ownerName && ownerName.includes(cleanLower)) ||
          cleanLower === 'owner' ||
          cleanLower === 'board owner'
        ) {
          return {
            email: board.owner_info.email,
            name: board.owner_info.name || trimmed
          }
        }
      }

      // If owner_info email is not directly on board, lookup owner profile via board.owner
      if (board.owner) {
        try {
          const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('email, full_name, display_name, name')
            .eq('id', board.owner)
            .single()

          if (ownerProfile?.email) {
            const profName = (
              ownerProfile.full_name ||
              ownerProfile.display_name ||
              ownerProfile.name ||
              ''
            ).toLowerCase()
            const profEmail = ownerProfile.email.toLowerCase()

            if (
              profName === lower ||
              profName === cleanLower ||
              profEmail === lower ||
              profEmail === cleanLower ||
              (profName && cleanLower.includes(profName)) ||
              cleanLower === 'owner' ||
              cleanLower === 'board owner'
            ) {
              return {
                email: ownerProfile.email,
                name: ownerProfile.full_name || ownerProfile.display_name || ownerProfile.name || trimmed
              }
            }
          }
        } catch {
          // Ignore profile lookup error
        }
      }
    }
  }

  // 5. Check Supabase profiles table
  try {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('email, full_name, display_name, name')
      .or(`full_name.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%,name.ilike.%${trimmed}%`)
      .limit(1)

    if (profiles && profiles.length > 0 && profiles[0].email) {
      return {
        email: profiles[0].email,
        name: profiles[0].full_name || profiles[0].display_name || profiles[0].name || trimmed
      }
    }
  } catch (_e) {
    // profiles table might not be exposed
  }

  return null
}

/**
 * Sends an email notification to the assignee using Resend.
 */
export async function sendTicketAssignmentEmail(
  params: TicketAssignmentEmailParams
): Promise<boolean> {
  const { item, boardId, assigneeName, assignedByName } = params
  const targetAssignee = assigneeName || item.assignee
  if (!targetAssignee || !targetAssignee.trim()) {
    return false
  }

  const resolved = await resolveAssigneeEmail(targetAssignee, boardId || item.board_id)
  if (!resolved || !resolved.email) {
    console.warn(`[Kaizen Email] No recipient email found for assignee "${targetAssignee}". Skipping email.`)
    return false
  }

  // Resolve Board Title
  const boards = useBoardsStore.getState().boards
  const board = boards.find((b) => String(b.id) === String(boardId || item.board_id))
  const boardTitle = board?.title || 'Kaizen Board'

  // Resolve Assigner Name
  let assigner: string = assignedByName || ''
  if (!assigner) {
    const { data: authData } = await supabase.auth.getUser()
    assigner =
      authData?.user?.user_metadata?.full_name ||
      authData?.user?.user_metadata?.name ||
      authData?.user?.email?.split('@')[0] ||
      'A team member'
  }

  const ticketTitle = item.title || 'Untitled Ticket'
  const subject = `[Kaizen] You were assigned to: ${ticketTitle}`

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
      <h2 style="color: #6366f1; margin: 0 0 12px 0; font-size: 18px; font-weight: 700;">kaizen33 &bull; Ticket Assignment</h2>
      <p style="font-size: 14px; margin: 0 0 16px 0; color: #cbd5e1; line-height: 1.5;">
        Hi <strong>${resolved.name}</strong>, <strong>${assigner}</strong> has assigned you to the following ticket in <strong>${boardTitle}</strong>:
      </p>
      <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #ffffff;">${ticketTitle}</h3>
        ${item.description ? `<p style="margin: 0 0 10px 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">${item.description.replace(/\n/g, '<br>')}</p>` : ''}
        ${item.due_date ? `<p style="margin: 0; font-size: 12px; color: #cbd5e1;">Due: <strong>${new Date(item.due_date).toLocaleDateString()}</strong></p>` : ''}
      </div>
      <a href="https://kaizen33.space" style="display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 10px 20px; border-radius: 6px;">
        Open in Kaizen &rarr;
      </a>
      <p style="margin: 24px 0 0 0; font-size: 11px; color: #64748b;">
        Sent automatically by Kaizen Continuous Improvement Kanban &bull; kaizen33.space
      </p>
    </div>
  `.trim()

  console.log(
    `[Kaizen Email] Dispatching email: from "${defaultSenderEmail}" -> to "${resolved.email}" (Assignee: "${targetAssignee}", Ticket: "${ticketTitle}")`
  )

  // 1. If running in Electron Desktop with IPC available, use main process (pure Node.js, avoids browser CORS)
  if (window.api && typeof window.api.sendEmail === 'function') {
    try {
      const ipcRes = await window.api.sendEmail({
        from: defaultSenderEmail,
        replyTo: 'wirabuana.imanuel@gmail.com',
        to: resolved.email,
        subject,
        html
      })

      if (ipcRes.success) {
        console.log('[Resend Success via Desktop IPC]', { data: ipcRes.data })
        return true
      } else {
        console.error('[Resend Error via Desktop IPC]', ipcRes.error)
        return false
      }
    } catch (ipcErr) {
      console.error('[Resend IPC Exception]', ipcErr)
    }
  }

  // 2. Direct Resend SDK call (for web or if IPC not available)
  try {
    const { data, error } = await resend.emails.send({
      from: defaultSenderEmail,
      replyTo: 'wirabuana.imanuel@gmail.com',
      to: [resolved.email],
      subject,
      html
    })

    if (error) {
      console.error('[Resend Error]', { error })
      return false
    }

    console.log('[Resend Success]', { data })
    return true
  } catch (err) {
    console.error('[Resend Exception]', err)
    return false
  }
}
