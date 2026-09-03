const PINNED_BOARDS_KEY = 'kaizen_pinned_board_ids'

export function getPinnedBoardIds(): string[] {
  try {
    const raw = localStorage.getItem(PINNED_BOARDS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch (err) {
    console.error('Error reading pinned board IDs from localStorage:', err)
    return []
  }
}

export function isBoardPinned(boardId: number | string | undefined): boolean {
  if (boardId === undefined || boardId === null) return false
  const ids = getPinnedBoardIds()
  return ids.includes(String(boardId))
}

export function setBoardPinned(boardId: number | string, pinned: boolean): void {
  try {
    const ids = getPinnedBoardIds()
    const strId = String(boardId)
    const set = new Set(ids)
    if (pinned) {
      set.add(strId)
    } else {
      set.delete(strId)
    }
    localStorage.setItem(PINNED_BOARDS_KEY, JSON.stringify(Array.from(set)))
  } catch (err) {
    console.error('Error writing pinned board IDs to localStorage:', err)
  }
}

export function toggleBoardPinned(boardId: number | string): boolean {
  const current = isBoardPinned(boardId)
  const next = !current
  setBoardPinned(boardId, next)
  return next
}
