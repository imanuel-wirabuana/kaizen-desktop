import { create } from 'zustand'
import { useMemo } from 'react'

export interface BoardPreviewData {
  title?: string
  description?: string
  icon?: string
  background?: string
  pinned?: boolean
}

interface BoardPreviewState {
  activePreviewBoardId: string | number | null
  previewData: BoardPreviewData | null
  setPreview: (boardId: string | number, data: BoardPreviewData) => void
  clearPreview: () => void
}

export const useBoardPreviewStore = create<BoardPreviewState>((set, get) => ({
  activePreviewBoardId: null,
  previewData: null,
  setPreview: (boardId, data) => {
    const current = get()
    if (
      String(current.activePreviewBoardId) === String(boardId) &&
      current.previewData?.title === data.title &&
      current.previewData?.description === data.description &&
      current.previewData?.icon === data.icon &&
      current.previewData?.background === data.background &&
      current.previewData?.pinned === data.pinned
    ) {
      return
    }
    set({
      activePreviewBoardId: boardId,
      previewData: data
    })
  },
  clearPreview: () => {
    const current = get()
    if (current.activePreviewBoardId === null && current.previewData === null) return
    set({
      activePreviewBoardId: null,
      previewData: null
    })
  }
}))

/**
 * Hook to get a board with active live preview applied if currently being edited.
 * If no preview is active for this board, returns the original board untouched.
 */
export function useActiveBoardWithPreview<T extends Board | null | undefined>(board: T): T {
  const preview = useBoardPreviewStore((s) =>
    board && board.id !== undefined && s.activePreviewBoardId !== null && String(s.activePreviewBoardId) === String(board.id)
      ? s.previewData
      : null
  )

  return useMemo(() => {
    if (!board || !preview) return board
    return {
      ...board,
      ...preview
    } as T
  }, [board, preview])
}
