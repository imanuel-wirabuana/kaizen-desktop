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

export {
  type BoardPermissionRole,
  KAIZEN_ASSISTANT_ROLE,
  KAIZEN_ASSISTANT_ROLE_EDIT,
  KAIZEN_ASSISTANT_ROLE_VIEW,
  BOARD_MUTATION_SCHEMA_DETAILS,
  BOARD_MUTATION_JSON_SCHEMA_EXAMPLE,
  MUTATION_GUIDELINES,
  VIEW_ONLY_GUIDELINES,
  QUICK_SUGGESTIONS,
  QUICK_SUGGESTIONS_EDIT,
  QUICK_SUGGESTIONS_VIEW,
  formatBoardContext,
  buildSystemPrompt
} from './ai-prompts'


