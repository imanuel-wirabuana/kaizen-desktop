export type BoardMutationAction =
  | {
      id: string
      type: 'add_lane'
      title: string
    }
  | {
      id: string
      type: 'add_item'
      lane_id?: number | null // null for Draft
      lane_title?: string
      title: string
      description?: string
      priority?: number
    }
  | {
      id: string
      type: 'update_lane'
      lane_id: number
      old_title?: string
      title: string
    }
  | {
      id: string
      type: 'update_item'
      item_id: number
      old_title?: string
      title?: string
      description?: string
      target_lane_id?: number | null
      target_lane_title?: string
      priority?: number
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
          title: String(act.title).trim()
        })
      } else if (type === 'add_item' && act.title) {
        validActions.push({
          id: actId,
          type: 'add_item',
          lane_id: act.lane_id !== undefined ? act.lane_id : undefined,
          lane_title: act.lane_title ? String(act.lane_title).trim() : undefined,
          title: String(act.title).trim(),
          description: act.description ? String(act.description).trim() : undefined,
          priority: typeof act.priority === 'number' ? act.priority : undefined
        })
      } else if (type === 'update_lane' && act.lane_id !== undefined && act.title) {
        validActions.push({
          id: actId,
          type: 'update_lane',
          lane_id: Number(act.lane_id),
          old_title: act.old_title ? String(act.old_title).trim() : undefined,
          title: String(act.title).trim()
        })
      } else if (type === 'update_item' && act.item_id !== undefined) {
        validActions.push({
          id: actId,
          type: 'update_item',
          item_id: Number(act.item_id),
          old_title: act.old_title ? String(act.old_title).trim() : undefined,
          title: act.title ? String(act.title).trim() : undefined,
          description: act.description !== undefined ? String(act.description).trim() : undefined,
          target_lane_id: act.target_lane_id !== undefined ? act.target_lane_id : undefined,
          target_lane_title: act.target_lane_title ? String(act.target_lane_title).trim() : undefined,
          priority: typeof act.priority === 'number' ? act.priority : undefined
        })
      } else if (type === 'delete_item' && act.item_id !== undefined) {
        validActions.push({
          id: actId,
          type: 'delete_item',
          item_id: Number(act.item_id),
          title: act.title ? String(act.title).trim() : `Task #${act.item_id}`
        })
      } else if (type === 'delete_lane' && act.lane_id !== undefined) {
        validActions.push({
          id: actId,
          type: 'delete_lane',
          lane_id: Number(act.lane_id),
          title: act.title ? String(act.title).trim() : `Column #${act.lane_id}`
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
        title: laneTitle
      })

      const rawItems = Array.isArray(l.items) ? l.items : []
      rawItems.forEach((i: any, iIdx: number) => {
        const itemTitle = typeof i === 'string' ? i : i.title || i.item || 'Untitled Task'
        actions.push({
          id: `act-item-${Date.now()}-${lIdx}-${iIdx}`,
          type: 'add_item',
          lane_title: laneTitle,
          title: String(itemTitle).trim()
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
 * Serializes the current board, lanes, and tasks into a clean markdown context
 * including exact database IDs for surgical CRUD operations.
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
      const laneItems = items
        .filter((i) =>
          lane.id === null ? i.lane_id === null : Number(i.lane_id) === Number(lane.id)
        )
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

      lines.push(`• Column [${laneTitle}] (${laneIdLabel}): ${laneItems.length} task(s)`)
      for (const item of laneItems) {
        lines.push(`   - [item_id: ${item.id}] ${item.title || 'Untitled'}`)
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
- UPDATING existing columns (renaming) and tasks (renaming, changing description, or moving between lanes)
- DELETING existing columns or tasks

BOARD CONTEXT:
${boardContext}

GUIDELINES:
1. When proposing ANY addition, update, or deletion, explain your plan clearly and concisely, and ALWAYS append a structured \`\`\`json code block at the end of your response with this exact schema:

\`\`\`json
{
  "summary": "Brief 1-sentence summary of proposed changes",
  "actions": [
    // --- ADD EXAMPLES ---
    { "type": "add_lane", "title": "Testing & QA" },
    { "type": "add_item", "lane_title": "Testing & QA", "title": "Run regression smoke tests" },

    // --- UPDATE EXAMPLES (Use exact IDs from context) ---
    { "type": "update_lane", "lane_id": 102, "title": "In Code Review" },
    { "type": "update_item", "item_id": 405, "title": "Updated Task Title", "target_lane_id": 103 },

    // --- DELETE EXAMPLES (Use exact IDs from context) ---
    { "type": "delete_item", "item_id": 408, "title": "Obsolete task title" },
    { "type": "delete_lane", "lane_id": 105, "title": "Deprecated Column" }
  ]
}
\`\`\`

2. When referencing existing lanes or items, ALWAYS use their exact \`lane_id\` and \`item_id\` shown in the BOARD CONTEXT.
3. For new tasks in a newly added column in the same batch, specify \`lane_title\` matching the new column's title.
4. Keep chat explanations friendly, concise, and formatted in clean markdown.
5. If the user asks a general or analytical question about the board or tasks without requesting changes, answer directly without providing a json block.`
}
