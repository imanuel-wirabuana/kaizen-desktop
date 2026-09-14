import { create } from 'zustand'
import { useLayoutEffect } from 'react'
import type { View } from './navigation'
import { useBoardFoldersStore } from './board-folders'
import { useBoardsStore } from './boards'
import { useItemsStore } from './items'
import { queryClient } from '@/lib/query-client'
import { queryKeys } from '@/queries/query-keys'

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

  useLayoutEffect(() => {
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
    const board =
      useBoardsStore.getState().boards.find((b) => String(b.id) === boardId) ||
      queryClient.getQueryData<Board>(queryKeys.boards.detail(boardId))

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
  if (view.name === 'item-detail') {
    const itemId = String(view.itemId)
    const item = useItemsStore.getState().items.find((i) => String(i.id) === itemId)
    const effectiveBoardId = view.boardId ? String(view.boardId) : item?.board_id ? String(item.board_id) : null

    const items: BreadcrumbItem[] = [{ label: 'Boards', view: { name: 'boards' } }]

    if (effectiveBoardId) {
      const folderId = useBoardFoldersStore.getState().boardFolderMap[effectiveBoardId]
      const project = folderId
        ? useBoardFoldersStore.getState().folders.find((f) => String(f.id) === String(folderId))
        : null
      const board =
        useBoardsStore.getState().boards.find((b) => String(b.id) === effectiveBoardId) ||
        queryClient.getQueryData<Board>(queryKeys.boards.detail(effectiveBoardId))

      if (project) {
        items.push({
          label: `${project.icon || '📁'} ${project.name}`,
          view: { name: 'project-detail', projectId: project.id }
        })
      }
      if (board && board.id !== undefined) {
        items.push({
          label: `${board.icon || '📋'} ${board.title || 'Untitled Board'}`,
          view: { name: 'board-detail', boardId: board.id }
        })
      }
    }

    const itemLabel = item?.title ? `${item.icon ? `${item.icon} ` : ''}${item.title}` : 'Task Detail'
    items.push({ label: itemLabel })
    return items
  }
  return []
}
