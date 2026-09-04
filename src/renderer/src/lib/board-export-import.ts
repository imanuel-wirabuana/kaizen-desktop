import { createLane, getLanesByBoardId } from '@/services/lanes'
import { createItem } from '@/services/items'
import { useLanesStore } from '@/stores/lanes'
import { useItemsStore } from '@/stores/items'
import { broadcastSyncEvent } from '@/lib/realtime'

export type ParsedImportData = {
  format: 'JSON' | 'CSV'
  boardTitle?: string
  lanes: {
    title: string
    items: string[]
  }[]
}

/**
 * Export board, lanes, and items to formatted JSON string.
 */
export function exportBoardToJson(board: Board, lanes: Lane[], items: KanbanItem[]): string {
  const sortedLanes = [...lanes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const lanesData = sortedLanes.map((lane) => {
    const laneItems = items
      .filter((item) => Number(item.lane_id) === Number(lane.id))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    return {
      lane: lane.title || 'Untitled Column',
      items: laneItems.map((item) => ({
        item: item.title || 'Untitled Task'
      }))
    }
  })

  const exportObj = {
    board: board.title || 'Untitled Board',
    lanes: lanesData
  }

  return JSON.stringify(exportObj, null, 2)
}

/**
 * Export board, lanes, and items to semicolon-delimited CSV string.
 * Example format:
 * board;lane1;lane2;lane3;
 * board1;item1;item2;
 * board1;item3;
 */
export function exportBoardToCsv(board: Board, lanes: Lane[], items: KanbanItem[]): string {
  const sortedLanes = [...lanes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const laneTitles = sortedLanes.map((l) => l.title || 'Untitled Column')

  const headerLine = `board;${laneTitles.join(';')};`

  const laneItemsMap = new Map<number | string, string[]>()
  let maxItems = 0

  for (const lane of sortedLanes) {
    if (lane.id === undefined || lane.id === null) continue
    const laneItems = items
      .filter((i) => Number(i.lane_id) === Number(lane.id))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((i) => i.title || '')
    laneItemsMap.set(lane.id, laneItems)
    if (laneItems.length > maxItems) {
      maxItems = laneItems.length
    }
  }

  const boardTitle = board.title || 'Untitled Board'
  const rows: string[] = [headerLine]

  for (let r = 0; r < maxItems; r++) {
    const rowCols: string[] = [boardTitle]
    for (const lane of sortedLanes) {
      const laneItems = lane.id !== undefined && lane.id !== null ? laneItemsMap.get(lane.id) || [] : []
      rowCols.push(laneItems[r] || '')
    }
    rows.push(`${rowCols.join(';')};`)
  }

  return rows.join('\n')
}

/**
 * Parse JSON or CSV text string input into a structured board hierarchy.
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

      const lanes = rawLanes.map((l: any, idx: number) => {
        const laneTitle = typeof l === 'string' ? l : l.lane || l.title || l.name || `Column ${idx + 1}`
        const rawItems = Array.isArray(l.items) ? l.items : []
        const items = rawItems.map((i: any) =>
          typeof i === 'string' ? i : i.item || i.title || i.name || 'Untitled Task'
        )
        return { title: laneTitle, items }
      })

      return { format: 'JSON', boardTitle, lanes }
    } catch (err: any) {
      if (trimmed.startsWith('{')) {
        throw new Error(`Invalid JSON format: ${err?.message || 'Syntax error'}`)
      }
    }
  }

  // 2. CSV parsing (delimiter ';' or ',')
  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    throw new Error('No valid content lines found in CSV.')
  }

  const delimiter = lines[0].includes(';') ? ';' : ','
  const headerCols = lines[0].split(delimiter).map((c) => c.trim())

  const laneTitles = headerCols.slice(1).filter((col, idx, arr) => {
    if (idx === arr.length - 1 && col === '') return false
    return true
  })

  if (laneTitles.length === 0) {
    throw new Error('CSV header line must specify at least one column (e.g. board;lane1;lane2;)')
  }

  const laneItemsMap = laneTitles.map(() => [] as string[])
  let detectedBoardTitle: string | undefined

  for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
    const cols = lines[lineIdx].split(delimiter).map((c) => c.trim())
    if (!detectedBoardTitle && cols[0]) {
      detectedBoardTitle = cols[0]
    }

    for (let colIdx = 0; colIdx < laneTitles.length; colIdx++) {
      const itemVal = cols[colIdx + 1]
      if (itemVal && itemVal.trim()) {
        laneItemsMap[colIdx].push(itemVal.trim())
      }
    }
  }

  const lanes = laneTitles.map((title, idx) => ({
    title: title || `Column ${idx + 1}`,
    items: laneItemsMap[idx]
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
      order: startLaneOrder + lIdx * 100
    })

    if (!createdLane || createdLane.id === undefined || createdLane.id === null) {
      throw new Error(`Failed to create column "${laneData.title}". Check database permissions.`)
    }

    for (let iIdx = 0; iIdx < laneData.items.length; iIdx++) {
      const itemTitle = laneData.items[iIdx]
      if (itemTitle && itemTitle.trim()) {
        const createdItem = await createItem({
          board_id: targetBoardId,
          lane_id: createdLane.id,
          title: itemTitle.trim(),
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
