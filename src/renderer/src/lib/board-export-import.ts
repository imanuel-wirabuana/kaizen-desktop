import { createLane, getLanesByBoardId } from '@/services/lanes'
import { createItem } from '@/services/items'
import { useLanesStore } from '@/stores/lanes'
import { useItemsStore } from '@/stores/items'
import { broadcastSyncEvent } from '@/lib/realtime'

export type ParsedImportItem = {
  title?: string | null
  icon?: string | null
  description?: string | null
  priority?: number | null
  start_date?: string | null
  due_date?: string | null
  status?: boolean | null
  assignee?: string | null
  background?: string | null
}

export type ParsedImportLane = {
  title?: string | null
  icon?: string | null
  description?: string | null
  background?: string | null
  items: ParsedImportItem[]
}

export type ParsedImportData = {
  format: 'JSON' | 'CSV' | 'MARKDOWN'
  boardTitle?: string
  lanes: ParsedImportLane[]
}

function getExportLanes(lanes: Lane[], items: KanbanItem[]): Lane[] {
  const allLanes = [...(lanes || [])]
  const hasDraftItems = (items || []).some((i) => i.lane_id === null || i.lane_id === undefined)
  const hasDraftLane = allLanes.some((l) => l.id === null)
  if (hasDraftItems && !hasDraftLane) {
    allLanes.unshift({
      id: null,
      title: 'Draft',
      order: -9999
    })
  }
  return allLanes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

function isItemInLane(item: KanbanItem, lane: Lane): boolean {
  if (lane.id === null) {
    return item.lane_id === null || item.lane_id === undefined
  }
  return item.lane_id !== null && item.lane_id !== undefined && String(item.lane_id) === String(lane.id)
}

/**
 * Export board, lanes, and items to formatted JSON string.
 */
export function exportBoardToJson(_board: Board | null | undefined, lanes: Lane[], items: KanbanItem[]): string {
  const sortedLanes = getExportLanes(lanes, items)
  const lanesData = sortedLanes.map((lane) => {
    const laneItems = (items || [])
      .filter((item) => isItemInLane(item, lane))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    return {
      title: lane.title || (lane.id === null ? 'Draft' : 'Untitled Column'),
      icon: lane.icon || null,
      description: lane.description || null,
      background: lane.background || null,
      items: laneItems.map((item) => ({
        title: item.title || 'Untitled Task',
        icon: item.icon || null,
        description: item.description || null,
        priority: item.priority ?? null,
        start_date: item.start_date || null,
        due_date: item.due_date || null,
        status: item.status ?? null,
        assignee: item.assignee || null,
        background: item.background || null
      }))
    }
  })

  const exportObj = {
    board: _board?.title || 'Board',
    lanes: lanesData
  }

  return JSON.stringify(exportObj, null, 2)
}

/**
 * Export board, lanes, and items to semicolon-delimited CSV string.
 * Example format:
 * lane1;lane2;lane3;
 * item1;item2;;
 * item3;;;
 */
export function exportBoardToCsv(_board: Board | null | undefined, lanes: Lane[], items: KanbanItem[]): string {
  const sortedLanes = getExportLanes(lanes, items)
  const laneTitles = sortedLanes.map((l) => l.title || (l.id === null ? 'Draft' : 'Untitled Column'))

  const headerLine = `${laneTitles.join(';')};`

  const laneItemsMap = new Map<number | string | null, string[]>()
  let maxItems = 0

  for (const lane of sortedLanes) {
    const laneItems = (items || [])
      .filter((i) => isItemInLane(i, lane))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((i) => i.title || '')
    laneItemsMap.set(lane.id, laneItems)
    if (laneItems.length > maxItems) {
      maxItems = laneItems.length
    }
  }

  const rows: string[] = [headerLine]

  for (let r = 0; r < maxItems; r++) {
    const rowCols: string[] = []
    for (const lane of sortedLanes) {
      const laneItems = laneItemsMap.get(lane.id) || []
      rowCols.push(laneItems[r] || '')
    }
    rows.push(`${rowCols.join(';')};`)
  }

  return rows.join('\n')
}

/**
 * Export board, lanes, and items to formatted Markdown string.
 * Uses # for board title, ## for columns, and - [ ] for tasks.
 */
export function exportBoardToMarkdown(_board: Board | null | undefined, lanes: Lane[], items: KanbanItem[]): string {
  const sortedLanes = getExportLanes(lanes, items)
  const lines: string[] = []

  const boardTitle = _board?.title || 'Board'
  lines.push(`# ${boardTitle}`)
  lines.push('')

  for (const lane of sortedLanes) {
    const laneTitle = lane.title || (lane.id === null ? 'Draft' : 'Untitled Column')
    lines.push(`## ${laneTitle}`)

    const laneItems = (items || [])
      .filter((item) => isItemInLane(item, lane))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    if (laneItems.length === 0) {
      lines.push('')
      continue
    }

    for (const item of laneItems) {
      const itemTitle = item.title || 'Untitled Task'
      lines.push(`- [ ] ${itemTitle}`)
      if (item.description && item.description.trim()) {
        const descLines = item.description.trim().split('\n')
        for (const dl of descLines) {
          lines.push(`  ${dl}`)
        }
      }
    }
    lines.push('')
  }

  return lines.join('\n').trimEnd() + '\n'
}

/**
 * Parse Markdown string into structured board hierarchy.
 */
export function parseMarkdownBoard(trimmed: string): ParsedImportData {
  const lines = trimmed.split(/\r?\n/)
  let detectedBoardTitle: string | undefined
  const lanes: ParsedImportLane[] = []
  let currentLane: ParsedImportLane | null = null
  let currentItem: ParsedImportItem | null = null

  const headingMatches = lines.filter((l) => /^\s*#{1,6}\s+/.test(l))
  const hasH1 = headingMatches.some((l) => /^\s*#\s+[^#]/.test(l))
  const hasH2Plus = headingMatches.some((l) => /^\s*#{2,6}\s+/.test(l))

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const line = rawLine.trim()
    if (!line) {
      currentItem = null
      continue
    }

    // Check heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const title = headingMatch[2].trim()

      if (level === 1 && hasH2Plus && !detectedBoardTitle) {
        detectedBoardTitle = title
        continue
      }

      currentItem = null
      currentLane = {
        title,
        icon: null,
        description: null,
        background: null,
        items: []
      }
      lanes.push(currentLane)
      continue
    }

    // Check list item: - [ ] title, - [x] title, - title, * title, + title, 1. title
    const itemMatch = line.match(/^(?:[-*+]\s+(?:\[[ xX]\]\s+)?|\d+\.\s+)(.+)$/)
    if (itemMatch) {
      if (!currentLane) {
        currentLane = {
          title: 'Imported Tasks',
          icon: null,
          description: null,
          background: null,
          items: []
        }
        lanes.push(currentLane)
      }

      const itemTitle = itemMatch[1].trim()
      currentItem = {
        title: itemTitle,
        icon: null,
        description: null,
        priority: null,
        due_date: null,
        background: null
      }
      currentLane.items.push(currentItem)
      continue
    }

    // Indented description or blockquote line under current item
    if (currentItem && (/^\s{2,}/.test(rawLine) || /^\t/.test(rawLine) || line.startsWith('>'))) {
      const descLine = line.replace(/^>\s*/, '').trim()
      if (descLine) {
        currentItem.description = currentItem.description
          ? `${currentItem.description}\n${descLine}`
          : descLine
      }
      continue
    }

    // Plain text line under a lane heading
    if (currentLane && !line.startsWith('#')) {
      currentItem = {
        title: line,
        icon: null,
        description: null,
        priority: null,
        due_date: null,
        background: null
      }
      currentLane.items.push(currentItem)
      continue
    }
  }

  if (lanes.length === 0) {
    throw new Error('No columns or tasks found in Markdown content.')
  }

  return {
    format: 'MARKDOWN',
    boardTitle: detectedBoardTitle,
    lanes
  }
}

/**
 * Parse JSON, Markdown, or CSV text string input into a structured board hierarchy.
 */
export function parseBoardImportText(text: string): ParsedImportData {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error('Import text is empty.')
  }

  // 1. Try JSON parsing first
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const json = JSON.parse(trimmed)
      const boardTitle = json.board || json.title || undefined
      const rawLanes = Array.isArray(json.lanes) ? json.lanes : Array.isArray(json) ? json : []

      const lanes: ParsedImportLane[] = rawLanes.map((l: any, idx: number) => {
        const laneTitle = typeof l === 'string' ? l : l.title || l.lane || l.name || `Column ${idx + 1}`
        const laneIcon = typeof l === 'object' && l ? (l.icon ?? null) : null
        const laneDesc = typeof l === 'object' && l ? (l.description ?? null) : null
        const laneBg = typeof l === 'object' && l ? (l.background ?? null) : null

        const rawItems = Array.isArray(l.items) ? l.items : []
        const items: ParsedImportItem[] = rawItems.map((i: any) => {
          if (typeof i === 'string') {
            return {
              title: i,
              icon: null,
              description: null,
              priority: null,
              due_date: null,
              background: null
            }
          }
          const itemTitle = i?.title || i?.item || i?.name || 'Untitled Task'
          let parsedPriority: number | null = null
          if (typeof i?.priority === 'number') {
            parsedPriority = i.priority
          } else if (i?.priority !== undefined && i?.priority !== null && !isNaN(Number(i.priority))) {
            parsedPriority = Number(i.priority)
          }

          return {
            title: itemTitle,
            icon: i?.icon ?? null,
            description: i?.description ?? null,
            priority: parsedPriority,
            start_date: i?.start_date ?? null,
            due_date: i?.due_date ?? null,
            status: typeof i?.status === 'boolean' ? i.status : null,
            assignee: i?.assignee ?? null,
            background: i?.background ?? null
          }
        })

        return {
          title: laneTitle,
          icon: laneIcon,
          description: laneDesc,
          background: laneBg,
          items
        }
      })

      return { format: 'JSON', boardTitle, lanes }
    } catch (err: any) {
      if (trimmed.startsWith('{')) {
        throw new Error(`Invalid JSON format: ${err?.message || 'Syntax error'}`)
      }
    }
  }

  // 2. Try Markdown parsing
  const isMarkdown =
    /(?:^|\n)\s*#{1,6}\s+/.test(trimmed) ||
    /(?:^|\n)\s*[-*+]\s+\[[ xX]\]/.test(trimmed) ||
    (/(?:^|\n)\s*[-*]\s+\S+/.test(trimmed) && !trimmed.includes(';'))

  if (isMarkdown) {
    try {
      return parseMarkdownBoard(trimmed)
    } catch (err: any) {
      if (/(?:^|\n)\s*#{1,6}\s+/.test(trimmed)) {
        throw err
      }
    }
  }

  // 3. CSV parsing (delimiter ';' or ',')
  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    throw new Error('No valid content lines found in CSV or Markdown.')
  }

  const delimiter = lines[0].includes(';') ? ';' : ','
  const rawHeaderCols = lines[0].split(delimiter).map((c) => c.trim())

  // Check if first header column is legacy "board"
  const hasBoardCol = rawHeaderCols[0]?.toLowerCase() === 'board'
  const headerCols = hasBoardCol ? rawHeaderCols.slice(1) : rawHeaderCols

  const laneTitles = headerCols.filter((col, idx, arr) => {
    if (idx === arr.length - 1 && col === '') return false
    return true
  })

  if (laneTitles.length === 0) {
    throw new Error('Unable to parse content. Please provide valid JSON, Markdown, or CSV formatted text.')
  }

  const laneItemsMap = laneTitles.map(() => [] as string[])
  let detectedBoardTitle: string | undefined

  for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
    const rawCols = lines[lineIdx].split(delimiter).map((c) => c.trim())
    if (hasBoardCol && !detectedBoardTitle && rawCols[0]) {
      detectedBoardTitle = rawCols[0]
    }
    const cols = hasBoardCol ? rawCols.slice(1) : rawCols

    for (let colIdx = 0; colIdx < laneTitles.length; colIdx++) {
      const itemVal = cols[colIdx]
      if (itemVal && itemVal.trim()) {
        laneItemsMap[colIdx].push(itemVal.trim())
      }
    }
  }

  const lanes: ParsedImportLane[] = laneTitles.map((title, idx) => ({
    title: title || `Column ${idx + 1}`,
    icon: null,
    description: null,
    background: null,
    items: laneItemsMap[idx].map((itemTitle) => ({
      title: itemTitle,
      icon: null,
      description: null,
      priority: null,
      due_date: null,
      background: null
    }))
  }))

  return {
    format: 'CSV',
    boardTitle: detectedBoardTitle,
    lanes
  }
}

/**
 * Import parsed lanes and items into an existing target board.
 */
export async function importContentIntoBoard(
  boardId: number | string,
  parsedData: ParsedImportData
): Promise<boolean> {
  const targetBoardId = Number(boardId)
  const existingLanes = await getLanesByBoardId(targetBoardId)
  const startLaneOrder =
    existingLanes.length > 0 ? Math.max(...existingLanes.map((l) => l.order ?? 0)) + 100 : 100

  for (let lIdx = 0; lIdx < parsedData.lanes.length; lIdx++) {
    const laneData = parsedData.lanes[lIdx]
    const createdLane = await createLane({
      board_id: targetBoardId,
      title: laneData.title || `Column ${lIdx + 1}`,
      icon: laneData.icon ?? undefined,
      description: laneData.description ?? undefined,
      background: laneData.background ?? undefined,
      order: startLaneOrder + lIdx * 100
    })

    if (!createdLane || createdLane.id === undefined || createdLane.id === null) {
      throw new Error(`Failed to create column "${laneData.title}". Check database permissions.`)
    }

    for (let iIdx = 0; iIdx < laneData.items.length; iIdx++) {
      const itemData = laneData.items[iIdx]
      const itemTitle = itemData?.title
      if (itemTitle && itemTitle.trim()) {
        const createdItem = await createItem({
          board_id: targetBoardId,
          lane_id: createdLane.id,
          title: itemTitle.trim(),
          icon: itemData.icon ?? undefined,
          description: itemData.description ?? undefined,
          priority: itemData.priority ?? undefined,
          start_date: itemData.start_date ?? undefined,
          due_date: itemData.due_date ?? undefined,
          status: itemData.status ?? undefined,
          assignee: itemData.assignee ?? undefined,
          background: itemData.background ?? undefined,
          order: (iIdx + 1) * 100
        })
        if (!createdItem) {
          console.warn(`Warning: Failed to create task "${itemTitle}" in column "${createdLane.title}".`)
        }
      }
    }
  }

  // Refresh stores for this board (non-destructive) and trigger peer broadcasts
  const boardIdStr = String(boardId)
  await useLanesStore.getState().refreshLanes(boardIdStr)
  await useItemsStore.getState().refreshItems(boardIdStr)
  broadcastSyncEvent('lanes')
  broadcastSyncEvent('items')
  return true
}
