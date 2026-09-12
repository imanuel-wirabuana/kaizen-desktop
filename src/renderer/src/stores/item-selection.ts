import { create } from 'zustand'

export interface ItemSelectionState {
  boardId: number | string | null
  isSelectionMode: boolean
  selectedIds: string[]
  isDraggingSelection: boolean
  lastSelectedId: string | null

  // Actions
  enterSelectionMode: (boardId: number | string, initialItemId?: number | string) => void
  exitSelectionMode: () => void
  toggleSelectionMode: (boardId: number | string) => void
  toggleItem: (itemId: number | string) => void
  selectItem: (itemId: number | string) => void
  deselectItem: (itemId: number | string) => void
  selectRange: (itemIds: (number | string)[]) => void
  selectAll: (itemIds: (number | string)[]) => void
  clearSelection: () => void
  setBoardId: (boardId: number | string | null) => void
  setIsDraggingSelection: (isDragging: boolean) => void
  setLastSelectedId: (id: string | null) => void
}

export const useItemSelectionStore = create<ItemSelectionState>((set, get) => ({
  boardId: null,
  isSelectionMode: false,
  selectedIds: [],
  isDraggingSelection: false,
  lastSelectedId: null,

  enterSelectionMode: (boardId, initialItemId) => {
    const idStr = initialItemId !== undefined ? String(initialItemId) : null
    set({
      boardId,
      isSelectionMode: true,
      selectedIds: idStr ? [idStr] : [],
      lastSelectedId: idStr
    })
  },

  exitSelectionMode: () => {
    set({
      isSelectionMode: false,
      selectedIds: [],
      lastSelectedId: null
    })
  },

  toggleSelectionMode: (boardId) => {
    if (get().isSelectionMode) {
      set({
        isSelectionMode: false,
        selectedIds: [],
        lastSelectedId: null
      })
    } else {
      set({
        boardId,
        isSelectionMode: true,
        selectedIds: [],
        lastSelectedId: null
      })
    }
  },

  toggleItem: (itemId) => {
    const idStr = String(itemId)
    const current = get().selectedIds
    const exists = current.includes(idStr)
    const updated = exists ? current.filter((id) => id !== idStr) : [...current, idStr]
    set({
      selectedIds: updated,
      lastSelectedId: exists ? (get().lastSelectedId === idStr ? null : get().lastSelectedId) : idStr
    })
  },

  selectItem: (itemId) => {
    const idStr = String(itemId)
    const current = get().selectedIds
    if (!current.includes(idStr)) {
      set({ selectedIds: [...current, idStr], lastSelectedId: idStr })
    } else {
      set({ lastSelectedId: idStr })
    }
  },

  deselectItem: (itemId) => {
    const idStr = String(itemId)
    set({
      selectedIds: get().selectedIds.filter((id) => id !== idStr),
      lastSelectedId: get().lastSelectedId === idStr ? null : get().lastSelectedId
    })
  },

  selectRange: (itemIds) => {
    const strIds = itemIds.map((id) => String(id))
    const current = new Set(get().selectedIds)
    strIds.forEach((id) => current.add(id))
    set({
      selectedIds: Array.from(current),
      lastSelectedId: strIds.length > 0 ? strIds[strIds.length - 1] : get().lastSelectedId
    })
  },

  selectAll: (itemIds) => {
    const strIds = Array.from(new Set(itemIds.map((id) => String(id))))
    set({ selectedIds: strIds })
  },

  clearSelection: () => {
    set({ selectedIds: [], lastSelectedId: null })
  },

  setBoardId: (boardId) => {
    if (String(get().boardId) !== String(boardId)) {
      set({
        boardId,
        isSelectionMode: false,
        selectedIds: [],
        isDraggingSelection: false,
        lastSelectedId: null
      })
    }
  },

  setIsDraggingSelection: (isDragging) => {
    set({ isDraggingSelection: isDragging })
  },

  setLastSelectedId: (id) => {
    set({ lastSelectedId: id ? String(id) : null })
  }
}))
