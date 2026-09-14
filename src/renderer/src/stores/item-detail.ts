import { create } from 'zustand'

export type ItemDetailOrientation = 'vertical' | 'horizontal'

type ItemDetailState = {
  activeItemId: number | null
  orientation: ItemDetailOrientation
  isFullscreen: boolean

  openItemDetail: (itemId: number) => void
  closeItemDetail: () => void
  setOrientation: (orientation: ItemDetailOrientation) => void
  toggleOrientation: () => void
  setFullscreen: (fullscreen: boolean) => void
  toggleFullscreen: () => void
}

const STORAGE_KEY = 'kaizen_item_detail_orientation'

const getInitialOrientation = (): ItemDetailOrientation => {
  if (typeof window === 'undefined') return 'vertical'
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'horizontal' ? 'horizontal' : 'vertical'
}

export const useItemDetailStore = create<ItemDetailState>((set, get) => ({
  activeItemId: null,
  orientation: getInitialOrientation(),
  isFullscreen: false,

  openItemDetail: (itemId: number) => set({ activeItemId: itemId }),
  closeItemDetail: () => set({ activeItemId: null, isFullscreen: false }),

  setOrientation: (orientation: ItemDetailOrientation) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, orientation)
    }
    set({ orientation })
  },

  toggleOrientation: () => {
    const next = get().orientation === 'vertical' ? 'horizontal' : 'vertical'
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, next)
    }
    set({ orientation: next })
  },

  setFullscreen: (fullscreen: boolean) => set({ isFullscreen: fullscreen }),
  toggleFullscreen: () => set((s) => ({ isFullscreen: !s.isFullscreen }))
}))
