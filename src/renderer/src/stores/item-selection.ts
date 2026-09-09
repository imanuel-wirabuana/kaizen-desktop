import { create } from 'zustand'

export interface ItemSelectionState {
  boardId: number | string | null
  isSelectionMode: boolean
  selectedIds: string[]
  isDraggingSelection: boolean

  // Actions
  enterSelectionMode: (boardId: number | string, initialItemId?: number | string) => void
  exitSelectionMode: () => void
  toggleSelectionMode: (boardId: number | string) => void
  toggleItem: (itemId: number | string) => void
  selectItem: (itemId: number | string) => void
  deselectItem: (itemId: number | string) => void
  selectAll: (itemIds: (number | string)[]) => void
  clearSelection: () => void
  setBoardId: (boardId: number | string | null) => void
  setIsDraggingSelection: (isDragging: boolean) => void
}

export const useItemSelectionStore = create<ItemSelectionState>((set, get) => ({
  boardId: null,
  isSelectionMode: false,
  selectedIds: [],
  isDraggingSelection: false,

  enterSelectionMode: (boardId, initialItemId) => {
    const idStr = initialItemId !== undefined ? String(initialItemId) : null
    set({
      boardId,
      isSelectionMode: true,
      selectedIds: idStr ? [idStr] : []
    })
  },

  exitSelectionMode: () => {
    set({
      isSelectionMode: false,
      selectedIds: []
    })
  },

  toggleSelectionMode: (boardId) => {
    if (get().isSelectionMode) {
      set({
        isSelectionMode: false,
        selectedIds: []
      })
    } else {
      set({
        boardId,
        isSelectionMode: true,
        selectedIds: []
      })
    }
  },

  toggleItem: (itemId) => {
    const idStr = String(itemId)
    const current = get().selectedIds
    const exists = current.includes(idStr)
    const updated = exists ? current.filter((id) => id !== idStr) : [...current, idStr]
    set({ selectedIds: updated })
  },

  selectItem: (itemId) => {
    const idStr = String(itemId)
    const current = get().selectedIds
    if (!current.includes(idStr)) {
      set({ selectedIds: [...current, idStr] })
    }
  },

  deselectItem: (itemId) => {
    const idStr = String(itemId)
    set({ selectedIds: get().selectedIds.filter((id) => id !== idStr) })
  },

  selectAll: (itemIds) => {
    const strIds = Array.from(new Set(itemIds.map((id) => String(id))))
    set({ selectedIds: strIds })
  },

  clearSelection: () => {
    set({ selectedIds: [] })
  },

  setBoardId: (boardId) => {
    if (String(get().boardId) !== String(boardId)) {
      set({
        boardId,
        isSelectionMode: false,
        selectedIds: [],
        isDraggingSelection: false
      })
    }
  },

  setIsDraggingSelection: (isDragging) => {
    set({ isDraggingSelection: isDragging })
  }
}))
