import { create } from 'zustand'

type DraftSidebarState = {
  isOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
}

export const useDraftSidebarStore = create<DraftSidebarState>((set) => ({
  isOpen: false,
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false })
}))
