import { useItemsStore } from '@/stores/items'
import { useLanesStore } from '@/stores/lanes'

export type BoardMutationAction =
  | {
      id: string
      type: 'add_lane'
      title: string
      icon?: string | null
      description?: string | null
      background?: string | null
    }
  | {
      id: string
      type: 'add_item'
      lane_id?: number | null // null for Draft
      lane_title?: string
      title: string
      icon?: string | null
      description?: string | null
      priority?: number | null
      due_date?: string | null
      background?: string | null
    }
  | {
      id: string
      type: 'update_lane'
      lane_id: number
      old_title?: string
      title?: string
      icon?: string | null
      description?: string | null
      background?: string | null
    }
  | {
      id: string
      type: 'update_item'
      item_id: number
      old_title?: string
      title?: string
      icon?: string | null
      description?: string | null
      target_lane_id?: number | null
      target_lane_title?: string
      priority?: number | null
      due_date?: string | null
      background?: string | null
    }
  | {
      id: string
      type: 'delete_item'
      item_id: number
      title?: string
    }
  | {
      id: string
      type: 'delete_lane'
      lane_id: number
      title?: string
    }

export type BoardMutationProposal = {
  summary: string
  actions: BoardMutationAction[]
}

/**
 * Normalizes raw parsed JSON into a valid BoardMutationProposal.
 * Supports both explicit CRUD actions and legacy pure-addition lanes structure.
 */
function normalizeToMutationProposal(parsed: any): BoardMutationProposal | null {
  if (!parsed || typeof parsed !== 'object') return null

  const summary = typeof parsed.summary === 'string' ? parsed.summary : 'Proposed board changes'

  // 1. Direct actions array format
  if (Array.isArray(parsed.actions) && parsed.actions.length > 0) {
    const validActions: BoardMutationAction[] = []
    parsed.actions.forEach((act: any, idx: number) => {
      const actId = `act-${Date.now()}-${idx}`
      const type = act.type

      if (type === 'add_lane' && act.title) {
        validActions.push({
          id: actId,
          type: 'add_lane',
          title: String(act.title).trim(),
          icon: act.icon ? String(act.icon).trim() : undefined,
          description: act.description ? String(act.description).trim() : undefined,
          background: act.background ? String(act.background).trim() : undefined
        })
      } else if (type === 'add_item' && act.title) {
        let parsedPriority: number | null | undefined = undefined
        if (typeof act.priority === 'number') {
          parsedPriority = act.priority
        } else if (act.priority !== undefined && act.priority !== null && !isNaN(Number(act.priority))) {
          parsedPriority = Number(act.priority)
        }

        validActions.push({
          id: actId,
          type: 'add_item',
          lane_id: act.lane_id !== undefined ? act.lane_id : undefined,
          lane_title: act.lane_title ? String(act.lane_title).trim() : undefined,
          title: String(act.title).trim(),
          icon: act.icon ? String(act.icon).trim() : undefined,
          description: act.description ? String(act.description).trim() : undefined,
          priority: parsedPriority,
          due_date: act.due_date ? String(act.due_date).trim() : undefined,
          background: act.background ? String(act.background).trim() : undefined
        })
      } else if (type === 'update_lane' && (act.lane_id !== undefined || act.lane_title || act.title)) {
        let resolvedLaneId: number | undefined = undefined
        if (act.lane_id !== undefined) {
          resolvedLaneId = Number(act.lane_id)
        } else {
          const searchName = (act.lane_title || act.title || '').toLowerCase().trim()
          const found = useLanesStore.getState().lanes.find(
            (l) => l.title && l.title.toLowerCase().trim() === searchName && l.id !== null
          )
          if (found && found.id !== null) {
            resolvedLaneId = found.id
          }
        }

        if (resolvedLaneId !== undefined) {
          const existingLane = useLanesStore.getState().lanes.find((l) => l.id === resolvedLaneId)
          const currentLaneTitle = existingLane?.title || 'Untitled Column'

          validActions.push({
            id: actId,
            type: 'update_lane',
            lane_id: resolvedLaneId,
            old_title: act.old_title ? String(act.old_title).trim() : currentLaneTitle,
            title: act.title ? String(act.title).trim() : undefined,
            icon: act.icon !== undefined ? (act.icon ? String(act.icon).trim() : null) : undefined,
            description:
              act.description !== undefined
                ? act.description
                  ? String(act.description).trim()
                  : null
                : undefined,
            background:
              act.background !== undefined
                ? act.background
                  ? String(act.background).trim()
                  : null
                : undefined
          })
        }
      } else if (type === 'update_item' && act.item_id !== undefined) {
        let parsedPriority: number | null | undefined = undefined
        if (typeof act.priority === 'number') {
          parsedPriority = act.priority
        } else if (act.priority !== undefined && act.priority !== null && !isNaN(Number(act.priority))) {
          parsedPriority = Number(act.priority)
        } else if (act.priority === null) {
          parsedPriority = null
        }

        validActions.push({
          id: actId,
          type: 'update_item',
          item_id: Number(act.item_id),
          old_title: act.old_title ? String(act.old_title).trim() : undefined,
          title: act.title ? String(act.title).trim() : undefined,
          icon: act.icon !== undefined ? (act.icon ? String(act.icon).trim() : null) : undefined,
          description:
            act.description !== undefined
              ? act.description
                ? String(act.description).trim()
                : null
              : undefined,
          target_lane_id: act.target_lane_id !== undefined ? act.target_lane_id : undefined,
          target_lane_title: act.target_lane_title ? String(act.target_lane_title).trim() : undefined,
          priority: parsedPriority,
          due_date:
            act.due_date !== undefined ? (act.due_date ? String(act.due_date).trim() : null) : undefined,
          background:
            act.background !== undefined
              ? act.background
                ? String(act.background).trim()
                : null
              : undefined
        })
      } else if (type === 'delete_item' && act.item_id !== undefined) {
        let itemTitle = act.title ? String(act.title).trim() : undefined
        if (!itemTitle) {
          try {
            const found = useItemsStore.getState().items.find((i) => i.id === Number(act.item_id))
            itemTitle = found?.title || 'Untitled Task'
          } catch {
            itemTitle = 'Untitled Task'
          }
        }
        validActions.push({
          id: actId,
          type: 'delete_item',
          item_id: Number(act.item_id),
          title: itemTitle
        })
      } else if (type === 'delete_lane' && act.lane_id !== undefined) {
        let laneTitle = act.title ? String(act.title).trim() : undefined
        if (!laneTitle) {
          try {
            const found = useLanesStore.getState().lanes.find((l) => l.id === Number(act.lane_id))
            laneTitle = found?.title || 'Untitled Column'
          } catch {
            laneTitle = 'Untitled Column'
          }
        }
        validActions.push({
          id: actId,
          type: 'delete_lane',
          lane_id: Number(act.lane_id),
          title: laneTitle
        })
      }
    })

    if (validActions.length > 0) {
      return { summary, actions: validActions }
    }
  }

  // 2. Legacy lanes structure format ({ lanes: [{ title, items }] })
  if (Array.isArray(parsed.lanes) && parsed.lanes.length > 0) {
    const actions: BoardMutationAction[] = []
    parsed.lanes.forEach((l: any, lIdx: number) => {
      const laneTitle = String(l.title || l.lane || `Column ${lIdx + 1}`).trim()
      actions.push({
        id: `act-lane-${Date.now()}-${lIdx}`,
        type: 'add_lane',
        title: laneTitle,
        icon: l.icon ? String(l.icon).trim() : undefined,
        description: l.description ? String(l.description).trim() : undefined,
        background: l.background ? String(l.background).trim() : undefined
      })

      const rawItems = Array.isArray(l.items) ? l.items : []
      rawItems.forEach((i: any, iIdx: number) => {
        const itemTitle = typeof i === 'string' ? i : i.title || i.item || 'Untitled Task'
        const itemIcon = typeof i === 'object' && i?.icon ? String(i.icon).trim() : undefined
        const itemDesc = typeof i === 'object' && i?.description ? String(i.description).trim() : undefined
        const itemPriority =
          typeof i === 'object' && i && typeof i.priority === 'number' ? i.priority : undefined
        const itemDueDate = typeof i === 'object' && i?.due_date ? String(i.due_date).trim() : undefined
        const itemBg = typeof i === 'object' && i?.background ? String(i.background).trim() : undefined

        actions.push({
          id: `act-item-${Date.now()}-${lIdx}-${iIdx}`,
          type: 'add_item',
          lane_title: laneTitle,
          title: String(itemTitle).trim(),
          icon: itemIcon,
          description: itemDesc,
          priority: itemPriority,
          due_date: itemDueDate,
          background: itemBg
        })
      })
    })

    if (actions.length > 0) {
      return { summary, actions }
    }
  }

  return null
}

/**
 * Attempts to parse a JSON proposal block from markdown text.
 */
export function extractProposalFromContent(text: string): BoardMutationProposal | null {
  if (!text) return null

  // 1. Check for markdown code blocks (```json ... ``` or ``` ... ```)
  const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g
  let match: RegExpExecArray | null

  while ((match = jsonRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim())
      const normalized = normalizeToMutationProposal(parsed)
      if (normalized) return normalized
    } catch {
      // Continue searching
    }
  }

  // 2. Fallback: Search for outer curly braces
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const raw = text.substring(firstBrace, lastBrace + 1)
      const parsed = JSON.parse(raw)
      const normalized = normalizeToMutationProposal(parsed)
      if (normalized) return normalized
    } catch {
      // Ignore
    }
  }

  return null
}

/**
 * Strips raw JSON code blocks from message text once extracted so the message
 * remains clean and readable, while the proposal card renders underneath.
 */
export function cleanContentForDisplay(text: string): string {
  if (!text) return ''
  const cleaned = text.replace(/```(?:json)?\s*[\s\S]*?```/g, '').trim()
  return cleaned || 'Here are the suggested board changes based on your request:'
}

/**
 * Splits in-progress streaming content to separate conversational text
 * from trailing JSON proposal blocks that may be partially generated.
 */
export function splitStreamingContent(text: string): { display: string; hasProposalBlock: boolean } {
  if (!text) return { display: '', hasProposalBlock: false }

  // Check for completed or in-progress ```json block containing '{'
  const jsonMatch = text.search(/```(?:json)?\s*\{/i)
  if (jsonMatch !== -1) {
    const display = text.slice(0, jsonMatch).trim()
    return { display, hasProposalBlock: true }
  }

  // Also check if ```json has started at the very tail
  const rawBackticks = text.search(/```(?:json)?\s*$/i)
  if (rawBackticks !== -1) {
    const display = text.slice(0, rawBackticks).trim()
    return { display, hasProposalBlock: true }
  }

  return { display: text, hasProposalBlock: false }
}

/**
 * Serializes the current board, lanes, and tasks into a clean markdown context
 * including exact database IDs and metadata for surgical CRUD operations.
 */
export function formatBoardContext(
  board: Board | null | undefined,
  lanes: Lane[],
  items: KanbanItem[]
): string {
  if (!board) return 'No board context available.'

  const sortedLanes = [...lanes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const lines: string[] = [
    `Current Board: "${board.title || 'Untitled'}" (board_id: ${board.id ?? 'unknown'})`,
    board.description ? `Description: ${board.description}` : '',
    '',
    'Existing Columns & Tasks (Use exact lane_id and item_id when updating or deleting):'
  ]

  if (sortedLanes.length === 0) {
    lines.push('- No columns created yet.')
  } else {
    for (const lane of sortedLanes) {
      const laneTitle = lane.title || (lane.id === null ? 'Draft' : 'Untitled Column')
      const laneIdLabel = lane.id === null ? 'Draft (lane_id: null)' : `lane_id: ${lane.id}`
      const laneIconStr = lane.icon ? ` ${lane.icon}` : ''
      const laneItems = items
        .filter((i) =>
          lane.id === null ? i.lane_id === null : Number(i.lane_id) === Number(lane.id)
        )
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

      const laneBgStr = lane.background ? ` [bg: "${lane.background}"]` : ''
      lines.push(
        `• Column [${laneTitle}]${laneIconStr}${laneBgStr} (${laneIdLabel}): ${laneItems.length} task(s)`
      )
      for (const item of laneItems) {
        const itemIconStr = item.icon ? `${item.icon} ` : ''
        const itemPrioStr = item.priority ? ` [priority: ${item.priority}]` : ''
        const itemDueStr = item.due_date ? ` [due: ${item.due_date}]` : ''
        const itemBgStr = item.background ? ` [bg: "${item.background}"]` : ''
        const itemDescStr = item.description ? ` - "${item.description}"` : ''
        lines.push(
          `   - [item_id: ${item.id}] ${itemIconStr}${item.title || 'Untitled'}${itemPrioStr}${itemDueStr}${itemBgStr}${itemDescStr}`
        )
      }
    }
  }

  return lines.filter(Boolean).join('\n')
}

export function buildSystemPrompt(
  board: Board | null | undefined,
  lanes: Lane[],
  items: KanbanItem[]
): string {
  const boardContext = formatBoardContext(board, lanes, items)

  return `You are Kaizen Assistant, an intelligent, agile project management co-pilot inside Kaizen Kanban Desktop.
You help users plan workflows, break down objectives, write actionable user stories, and organize tasks.
You have FULL CAPABILITY to propose:
- ADDING new columns/lanes and tasks
- UPDATING existing columns (renaming, changing icon, description, background color) and tasks (renaming, changing description, icon, priority, due date, background color, or moving between lanes)
- DELETING existing columns or tasks

BOARD CONTEXT:
${boardContext}

SCHEMA DETAILS:
- Lane:
  - title (string, required when adding, optional when updating)
  - icon (string optional, emoji character e.g. "🚀", "📁", "🔥")
  - description (string optional, brief summary)
  - background (string optional, hex color or style e.g. "#22c55e", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6")
- Item / Task:
  - title (string, required when adding, optional when updating)
  - icon (string optional, emoji character e.g. "⚡", "🐛", "🎨")
  - description (string optional, acceptance criteria or details)
  - priority (number optional: 0 = Low/None, 1 = Medium, 2 = High, 3 = Urgent)
  - due_date (string optional, ISO format "YYYY-MM-DD")
  - background (string optional, hex color or style e.g. "#ef4444", "#3b82f6")

GUIDELINES:
1. When proposing ANY addition, update, or deletion, explain your plan clearly and concisely, and ALWAYS append a structured \`\`\`json code block at the end of your response with this exact schema:

\`\`\`json
{
  "summary": "Brief 1-sentence summary of proposed changes",
  "actions": [
    // --- ADD EXAMPLES ---
    { "type": "add_lane", "title": "Testing & QA", "icon": "🧪", "description": "QA validation", "background": "#22c55e" },
    { "type": "add_item", "lane_title": "Testing & QA", "title": "Run regression smoke tests", "icon": "🚀", "priority": 3, "due_date": "2026-09-15" },

    // --- UPDATE EXAMPLES (Use exact IDs from context) ---
    { "type": "update_lane", "lane_id": 102, "title": "In Code Review", "icon": "👀" },
    { "type": "update_lane", "lane_id": 105, "background": "#3b82f6" },
    { "type": "update_item", "item_id": 405, "title": "Updated Task Title", "target_lane_id": 103, "priority": 2, "due_date": "2026-09-20" },
    { "type": "update_item", "item_id": 406, "background": "#ef4444" },

    // --- DELETE EXAMPLES (Use exact IDs from context) ---
    { "type": "delete_item", "item_id": 408, "title": "Obsolete task title" },
    { "type": "delete_lane", "lane_id": 105, "title": "Deprecated Column" }
  ]
}
\`\`\`

2. When referencing existing lanes or items, ALWAYS use their exact \`lane_id\` and \`item_id\` shown in the BOARD CONTEXT.
3. For new tasks in a newly added column in the same batch, specify \`lane_title\` matching the new column's title.
4. When asked to change, set, or add a background or color to a column/lane or task, ALWAYS propose an \`update_lane\` or \`update_item\` with the \`background\` property set to a clean hex color code (e.g. Green: "#22c55e", Blue: "#3b82f6", Red: "#ef4444", Amber: "#f59e0b", Purple: "#8b5cf6", Teal: "#14b8a6", Slate: "#0f172a") or CSS gradient.
5. Keep chat explanations friendly, concise, and formatted in clean markdown.
6. If the user asks a general or analytical question about the board or tasks without requesting changes, answer directly without providing a json block.`
}
