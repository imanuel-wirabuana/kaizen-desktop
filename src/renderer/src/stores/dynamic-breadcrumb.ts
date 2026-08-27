import { create } from 'zustand'
import { useEffect } from 'react'
import type { View } from './navigation'

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
  if (view.name === 'board-detail') {
    return [{ label: 'Boards', view: { name: 'boards' } }]
  }
  return []
}
