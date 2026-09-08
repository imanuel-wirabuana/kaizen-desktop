import { create } from 'zustand'
import { useEffect } from 'react'
import type { View } from './navigation'
import { useBoardFoldersStore } from './board-folders'
import { useBoardsStore } from './boards'

export type BreadcrumbItem = {
  label: string
  view?: View
}

type BreadcrumbState = {
  items: BreadcrumbItem[]
  setItems: (items: BreadcrumbItem[]) => void
  resetItems: () => void
}

export const useBreadcrumbStore = create<BreadcrumbState>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
  resetItems: () => set({ items: [] })
}))

// Backward compatibility alias if needed
export const dynamicBreadcrumbStore = useBreadcrumbStore

/**
 * Declarative hook for setting breadcrumbs in any view/page.
 * Automatically cleans up when the component unmounts.
 */
export function useBreadcrumbs(items?: BreadcrumbItem[]) {
  const setItems = useBreadcrumbStore((s) => s.setItems)
  const resetItems = useBreadcrumbStore((s) => s.resetItems)

  const serialized = items ? JSON.stringify(items) : ''

  useEffect(() => {
    if (!items || items.length === 0) return

    setItems(items)
    return () => {
      resetItems()
    }
  }, [serialized, setItems, resetItems])
}

export function breadcrumbFromView(view: View): BreadcrumbItem[] {
  if (view.name === 'landing') {
    return [{ label: 'Home', view: { name: 'landing' } }]
  }
  if (view.name === 'boards') {
    return [{ label: 'Boards', view: { name: 'boards' } }]
  }
  if (view.name === 'project-detail') {
    const project = useBoardFoldersStore.getState().folders.find((f) => String(f.id) === String(view.projectId))
    return [
      { label: 'Boards', view: { name: 'boards' } },
      { label: project ? `${project.icon || '📁'} ${project.name}` : 'Project' }
    ]
  }
  if (view.name === 'board-detail') {
    const boardId = String(view.boardId)
    const folderId = useBoardFoldersStore.getState().boardFolderMap[boardId]
    const project = folderId
      ? useBoardFoldersStore.getState().folders.find((f) => String(f.id) === String(folderId))
      : null
    const board = useBoardsStore.getState().boards.find((b) => String(b.id) === boardId)

    const items: BreadcrumbItem[] = [{ label: 'Boards', view: { name: 'boards' } }]
    if (project) {
      items.push({
        label: `${project.icon || '📁'} ${project.name}`,
        view: { name: 'project-detail', projectId: project.id }
      })
    }
    if (board) {
      items.push({ label: `${board.icon || '📋'} ${board.title || 'Untitled Board'}` })
    }
    return items
  }
  return []
}
