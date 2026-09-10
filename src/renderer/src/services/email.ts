import { Resend } from 'resend'
import { supabase } from '@/lib/supabase'
import { useBoardsStore } from '@/stores/boards'
import { useLanesStore } from '@/stores/lanes'
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
  // Clean any leading '@' handles (e.g., "@alice" or "@user@company.com")
  const cleaned = trimmed.replace(/^@+/, '').trim()
  const lower = cleaned.toLowerCase()
  const cleanLower = lower.replace(/\s*\((me,\s*owner|me|owner)\)$/i, '').trim()

  // 1. Direct email string match or embedded email in string (e.g., "Name <email@domain.com>" or "user@domain.com")
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  const emailMatch = cleaned.match(emailRegex) || trimmed.match(emailRegex)
  if (emailMatch) {
    const extractedEmail = emailMatch[0]
    const extractedName =
      cleaned.replace(extractedEmail, '').replace(/[<>()[\]]/g, '').trim() ||
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
        const mName = (m.user_name || m.full_name || '').toLowerCase().trim()
        const mEmail = (m.user_email || m.email || '').toLowerCase().trim()
        if (
          (mName && (mName === lower || mName === cleanLower || (cleanLower.length >= 3 && (mName.startsWith(cleanLower) || cleanLower.startsWith(mName))))) ||
          (mEmail && (mEmail === lower || mEmail === cleanLower))
        ) {
          const email = m.user_email || m.email
          if (email && emailRegex.test(email)) {
            return {
              email,
              name: m.user_name || m.full_name || cleaned
            }
          }
        }
      }
    } catch (err) {
      console.warn('[resolveAssigneeEmail] Failed to fetch board members:', err)
    }
  }

  // 3. Check current authenticated user (if assigned to self or "me")
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
        currentFullName === cleanLower ||
        currentUser.email.toLowerCase() === lower ||
        currentUser.email.toLowerCase() === cleanLower ||
        `${currentFullName} (me)` === lower ||
        cleanLower === 'me' ||
        cleanLower === 'myself'
      ) {
        return {
          email: currentUser.email,
          name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || cleaned
        }
      }
    }
  } catch (err) {
    console.warn('[resolveAssigneeEmail] Failed to check auth user:', err)
  }

  // 4. Check board owner info (from store cache or database fallback)
  if (boardId) {
    let board = useBoardsStore.getState().boards.find((b) => String(b.id) === String(boardId))

    // Fallback query if board is not loaded in store yet
    if (!board || !board.owner_info?.email) {
      try {
        const { data: bData } = await supabase
          .from('boards')
          .select('id, owner, owner_info')
          .eq('id', Number(boardId))
          .single()
        if (bData) {
          board = bData as any
        }
      } catch {
        // Ignore fallback query failure
      }
    }

    if (board) {
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
            name: board.owner_info.name || cleaned
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
                name: ownerProfile.full_name || ownerProfile.display_name || ownerProfile.name || cleaned
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
      .or(`full_name.ilike.%${cleaned}%,display_name.ilike.%${cleaned}%,name.ilike.%${cleaned}%`)
      .limit(1)

    if (profiles && profiles.length > 0 && profiles[0].email) {
      return {
        email: profiles[0].email,
        name: profiles[0].full_name || profiles[0].display_name || profiles[0].name || cleaned
      }
    }
  } catch (_e) {
    // profiles table might not be exposed
  }

  return null
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatDate(dateStr?: string | null): string | null {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return null
  }
}

function formatDateTime(dateStr?: string | null): string | null {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return null
  }
}

/**
 * Sends an email notification to the assignee using Resend, containing all item properties.
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

  // 1. Resolve Board Title & Icon
  const boards = useBoardsStore.getState().boards
  const board = boards.find((b) => String(b.id) === String(boardId || item.board_id))
  const boardTitle = board?.title || 'Kaizen Board'
  const boardIcon = board?.icon ? `${board.icon} ` : ''

  // 2. Resolve Lane / Column Title
  const lanes = useLanesStore.getState().lanes
  const lane = lanes.find((l) => String(l.id) === String(item.lane_id))
  const laneTitle = lane?.title || (item.lane_id ? `Lane #${item.lane_id}` : 'General Backlog')

  // 3. Resolve Assigner Name
  let assigner: string = assignedByName || ''
  if (!assigner) {
    const { data: authData } = await supabase.auth.getUser()
    assigner =
      authData?.user?.user_metadata?.full_name ||
      authData?.user?.user_metadata?.name ||
      authData?.user?.email?.split('@')[0] ||
      'A team member'
  }

  // 4. Resolve Item Properties
  const itemIcon = item.icon?.trim() || ''
  const ticketTitle = item.title?.trim() || 'Untitled Ticket'
  const displayTitle = itemIcon ? `${itemIcon} ${ticketTitle}` : ticketTitle
  const taskId = item.id && item.id > 0 ? `#${item.id}` : 'Pending Sync'

  // Priority
  const priorityNum = Number(item.priority ?? 0)
  const priorityInfo =
    priorityNum === 3
      ? { label: 'Urgent', color: '#f87171', bg: '#450a0a', border: '#7f1d1d', icon: '🚨' }
      : priorityNum === 2
        ? { label: 'High', color: '#fb923c', bg: '#431407', border: '#7c2d12', icon: '⚡' }
        : priorityNum === 1
          ? { label: 'Medium', color: '#fbbf24', bg: '#451a03', border: '#78350f', icon: '🟡' }
          : { label: 'Low', color: '#94a3b8', bg: '#1e293b', border: '#334155', icon: '⚪' }

  // Status
  const isCompleted = Boolean(item.status)
  const statusInfo = isCompleted
    ? { label: 'Completed', color: '#34d399', bg: '#064e3b', border: '#047857' }
    : { label: 'In Progress', color: '#38bdf8', bg: '#082f49', border: '#0284c7' }

  // Dates
  const formattedStartDate = formatDate(item.start_date)
  const formattedDueDate = formatDate(item.due_date)
  const formattedCreatedAt = formatDateTime(item.created_at)
  const formattedUpdatedAt = formatDateTime(item.updated_at)

  // Overdue calculation
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const isOverdue = !isCompleted && item.due_date && new Date(item.due_date) < now

  let scheduleText = 'Not scheduled'
  if (formattedStartDate && formattedDueDate) {
    scheduleText = `${formattedStartDate} &rarr; <strong>${formattedDueDate}</strong>`
  } else if (formattedDueDate) {
    scheduleText = `Due: <strong>${formattedDueDate}</strong>`
  } else if (formattedStartDate) {
    scheduleText = `Starts: <strong>${formattedStartDate}</strong>`
  }
  if (isOverdue) {
    scheduleText += ` <span style="display: inline-block; background-color: #450a0a; color: #f87171; border: 1px solid #7f1d1d; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; margin-left: 6px;">OVERDUE</span>`
  }

  // Creator
  const creatorName =
    item.owner_info?.name ||
    (item.owner_info?.email ? item.owner_info.email.split('@')[0] : null) ||
    assigner ||
    'Team Member'
  const creatorEmail = item.owner_info?.email || undefined

  // Background / Accent Color
  const accentColor = item.background?.trim() || ''

  // Description
  const rawDescription = item.description?.trim() || ''
  const safeDescription = rawDescription ? escapeHtml(rawDescription).replace(/\n/g, '<br>') : ''

  // Subject line
  const subjectPrefix = priorityNum >= 2 ? `[Kaizen] [${priorityInfo.label.toUpperCase()}] ` : '[Kaizen] '
  const subject = `${subjectPrefix}You were assigned to: ${displayTitle}`

  // 5. Build Rich HTML Email
  const accentBorderCss = accentColor ? `border-left: 4px solid ${accentColor};` : ''
  const accentRowHtml = accentColor
    ? `<tr>
        <td style="padding: 9px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 12px; font-weight: 600; width: 130px; text-transform: uppercase; letter-spacing: 0.5px;">Accent</td>
        <td style="padding: 9px 0; border-bottom: 1px solid #1e293b; color: #f8fafc; font-size: 13px;">
          <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${accentColor}; margin-right: 6px; vertical-align: middle;"></span>
          <span style="vertical-align: middle;">${escapeHtml(accentColor)}</span>
        </td>
      </tr>`
    : ''

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">

    <!-- Top Accent Bar -->
    <div style="height: 4px; background: linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%); border-radius: 4px 4px 0 0;"></div>

    <!-- Main Container -->
    <div style="background-color: #111827; border: 1px solid #1f2937; border-top: none; border-radius: 0 0 16px 16px; padding: 28px 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">

      <!-- Brand Header -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
        <tr>
          <td>
            <span style="font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">kaizen<span style="color: #6366f1;">33</span></span>
            <span style="display: inline-block; margin-left: 8px; font-size: 10px; font-weight: 600; text-transform: uppercase; background-color: #1e1b4b; color: #818cf8; border: 1px solid #3730a3; padding: 2px 7px; border-radius: 9999px;">Continuous Improvement</span>
          </td>
          <td align="right">
            <span style="font-size: 11px; color: #64748b; font-weight: 500;">Ticket Assignment</span>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <p style="font-size: 14.5px; margin: 0 0 20px 0; color: #cbd5e1; line-height: 1.55;">
        Hi <strong style="color: #ffffff;">${escapeHtml(resolved.name)}</strong>,<br>
        <strong style="color: #6366f1;">${escapeHtml(assigner)}</strong> has assigned you to the following ticket in <strong style="color: #ffffff;">${boardIcon}${escapeHtml(boardTitle)}</strong>:
      </p>

      <!-- Ticket Card Box -->
      <div style="background-color: #162032; border: 1px solid #23304a; ${accentBorderCss} border-radius: 12px; padding: 20px; margin-bottom: 24px;">

        <!-- Title & Badges Header -->
        <div style="margin-bottom: 12px;">
          <div style="display: inline-block; font-size: 11px; font-weight: 700; color: #818cf8; background-color: #1e1b4b; border: 1px solid #3730a3; padding: 2px 8px; border-radius: 4px; margin-bottom: 8px;">
            ${taskId}
          </div>
          <h2 style="margin: 0; font-size: 19px; font-weight: 700; color: #ffffff; line-height: 1.35;">
            ${escapeHtml(displayTitle)}
          </h2>
        </div>

        <!-- Badges Row -->
        <div style="margin-bottom: 16px;">
          <span style="display: inline-block; background-color: ${priorityInfo.bg}; color: ${priorityInfo.color}; border: 1px solid ${priorityInfo.border}; padding: 2px 9px; border-radius: 9999px; font-weight: 600; font-size: 11px; margin-right: 6px;">
            ${priorityInfo.icon} ${priorityInfo.label} Priority
          </span>
          <span style="display: inline-block; background-color: ${statusInfo.bg}; color: ${statusInfo.color}; border: 1px solid ${statusInfo.border}; padding: 2px 9px; border-radius: 9999px; font-weight: 600; font-size: 11px; margin-right: 6px;">
            ${statusInfo.label}
          </span>
          <span style="display: inline-block; background-color: #1e293b; color: #cbd5e1; border: 1px solid #334155; padding: 2px 9px; border-radius: 9999px; font-weight: 500; font-size: 11px;">
            📂 ${escapeHtml(laneTitle)}
          </span>
        </div>

        <!-- Description Box -->
        <div style="margin-bottom: 18px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 6px;">
            Description
          </div>
          <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 12px 14px; font-size: 13.5px; line-height: 1.6; color: ${safeDescription ? '#e2e8f0' : '#64748b'};">
            ${safeDescription || '<em style="color: #64748b;">No description provided.</em>'}
          </div>
        </div>

        <!-- Comprehensive Properties Table -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-top: 4px;">
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 12px; font-weight: 600; width: 130px; text-transform: uppercase; letter-spacing: 0.5px;">Board</td>
            <td style="padding: 9px 0; border-bottom: 1px solid #1e293b; color: #f8fafc; font-size: 13px; font-weight: 500;">
              ${boardIcon}${escapeHtml(boardTitle)}
            </td>
          </tr>
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 12px; font-weight: 600; width: 130px; text-transform: uppercase; letter-spacing: 0.5px;">Lane / Column</td>
            <td style="padding: 9px 0; border-bottom: 1px solid #1e293b; color: #f8fafc; font-size: 13px; font-weight: 500;">
              ${escapeHtml(laneTitle)}
            </td>
          </tr>
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 12px; font-weight: 600; width: 130px; text-transform: uppercase; letter-spacing: 0.5px;">Assignee</td>
            <td style="padding: 9px 0; border-bottom: 1px solid #1e293b; color: #f8fafc; font-size: 13px;">
              <strong>${escapeHtml(resolved.name)}</strong> <span style="color: #94a3b8;">(${escapeHtml(resolved.email)})</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 12px; font-weight: 600; width: 130px; text-transform: uppercase; letter-spacing: 0.5px;">Assigned By</td>
            <td style="padding: 9px 0; border-bottom: 1px solid #1e293b; color: #f8fafc; font-size: 13px;">
              ${escapeHtml(assigner)}
            </td>
          </tr>
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 12px; font-weight: 600; width: 130px; text-transform: uppercase; letter-spacing: 0.5px;">Created By</td>
            <td style="padding: 9px 0; border-bottom: 1px solid #1e293b; color: #f8fafc; font-size: 13px;">
              ${escapeHtml(creatorName)}${creatorEmail ? ` <span style="color: #94a3b8;">(${escapeHtml(creatorEmail)})</span>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 12px; font-weight: 600; width: 130px; text-transform: uppercase; letter-spacing: 0.5px;">Schedule</td>
            <td style="padding: 9px 0; border-bottom: 1px solid #1e293b; color: #f8fafc; font-size: 13px;">
              ${scheduleText}
            </td>
          </tr>
          ${accentRowHtml}
          <tr>
            <td style="padding: 9px 0; ${formattedUpdatedAt ? 'border-bottom: 1px solid #1e293b;' : ''} color: #94a3b8; font-size: 12px; font-weight: 600; width: 130px; text-transform: uppercase; letter-spacing: 0.5px;">Created At</td>
            <td style="padding: 9px 0; ${formattedUpdatedAt ? 'border-bottom: 1px solid #1e293b;' : ''} color: #94a3b8; font-size: 12px;">
              ${formattedCreatedAt || 'Recently'}
            </td>
          </tr>
          ${
            formattedUpdatedAt
              ? `<tr>
                  <td style="padding: 9px 0; color: #94a3b8; font-size: 12px; font-weight: 600; width: 130px; text-transform: uppercase; letter-spacing: 0.5px;">Last Updated</td>
                  <td style="padding: 9px 0; color: #94a3b8; font-size: 12px;">
                    ${formattedUpdatedAt}
                  </td>
                </tr>`
              : ''
          }
        </table>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin: 28px 0 12px 0;">
        <a href="https://kaizen33.space" style="display: inline-block; background-color: #6366f1; background-image: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);">
          Open Ticket in Kaizen &rarr;
        </a>
      </div>

      <!-- Footer -->
      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #1f2937; text-align: center; font-size: 11px; color: #64748b; line-height: 1.6;">
        <p style="margin: 0 0 4px 0; font-weight: 600; color: #94a3b8;">
          Kaizen Continuous Improvement Kanban &bull; <a href="https://kaizen33.space" style="color: #6366f1; text-decoration: none;">kaizen33.space</a>
        </p>
        <p style="margin: 0;">
          This notification was sent to <strong style="color: #cbd5e1;">${escapeHtml(resolved.email)}</strong> because you were assigned to this task.
        </p>
        <p style="margin: 4px 0 0 0; font-size: 10.5px; color: #475569;">
          Replies to this email will be directed to wirabuana.imanuel@gmail.com.
        </p>
      </div>

    </div>
  </div>
</body>
</html>
  `.trim()

  // 6. Build Plain-Text Fallback Email
  const text = `
==================================================
KAIZEN • TICKET ASSIGNMENT
==================================================

Hi ${resolved.name},

${assigner} has assigned you to the following ticket in "${boardTitle}":

--------------------------------------------------
Ticket:       ${displayTitle}
Ticket ID:    ${taskId}
Board:        ${boardTitle}
Lane:         ${laneTitle}
Status:       ${statusInfo.label}
Priority:     ${priorityInfo.label}
Assignee:     ${resolved.name} (${resolved.email})
Assigned By:  ${assigner}
Created By:   ${creatorName}${creatorEmail ? ` (${creatorEmail})` : ''}
Start Date:   ${formattedStartDate || 'Not set'}
Due Date:     ${formattedDueDate || 'Not set'}${isOverdue ? ' [OVERDUE]' : ''}
${accentColor ? `Accent Color: ${accentColor}\n` : ''}Created At:   ${formattedCreatedAt || 'Recently'}${formattedUpdatedAt ? `\nLast Updated: ${formattedUpdatedAt}` : ''}
--------------------------------------------------

Description:
${rawDescription || 'No description provided.'}

==================================================
Open in Kaizen: https://kaizen33.space
Replies are directed to wirabuana.imanuel@gmail.com
==================================================
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
        html,
        text
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
      html,
      text
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
