import { create } from 'zustand'

type AuthModalState = {
  isOpen: boolean
  defaultTab: 'signin' | 'signup'
  openModal: (defaultTab?: 'signin' | 'signup') => void
  closeModal: () => void
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  defaultTab: 'signin',
  openModal: (defaultTab = 'signin') => set({ isOpen: true, defaultTab }),
  closeModal: () => set({ isOpen: false })
}))
