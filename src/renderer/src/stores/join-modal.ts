import { create } from 'zustand'

type JoinModalState = {
  isOpen: boolean
  inviteCode: string
  openModal: (code?: string) => void
  closeModal: () => void
  setInviteCode: (code: string) => void
}

export const useJoinModalStore = create<JoinModalState>((set) => ({
  isOpen: false,
  inviteCode: '',
  openModal: (code = '') => set({ isOpen: true, inviteCode: code.toUpperCase() }),
  closeModal: () => set({ isOpen: false, inviteCode: '' }),
  setInviteCode: (code: string) => set({ inviteCode: code.toUpperCase() })
}))
