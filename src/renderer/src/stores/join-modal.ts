import { create } from 'zustand'

const PENDING_CODE_STORAGE_KEY = 'kaizen_pending_invite_code'

type JoinModalState = {
  isOpen: boolean
  inviteCode: string
  pendingInviteCode: string | null
  openModal: (code?: string) => void
  closeModal: () => void
  setInviteCode: (code: string) => void
  setPendingInviteCode: (code: string | null) => void
}

function getInitialPendingCode(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(PENDING_CODE_STORAGE_KEY)
  } catch {
    return null
  }
}

export const useJoinModalStore = create<JoinModalState>((set) => ({
  isOpen: false,
  inviteCode: '',
  pendingInviteCode: getInitialPendingCode(),
  openModal: (code = '') => set({ isOpen: true, inviteCode: code.toUpperCase() }),
  closeModal: () => set({ isOpen: false, inviteCode: '' }),
  setInviteCode: (code: string) => set({ inviteCode: code.toUpperCase() }),
  setPendingInviteCode: (code: string | null) => {
    const formatted = code ? code.trim().toUpperCase() : null
    if (typeof window !== 'undefined') {
      try {
        if (formatted) {
          localStorage.setItem(PENDING_CODE_STORAGE_KEY, formatted)
        } else {
          localStorage.removeItem(PENDING_CODE_STORAGE_KEY)
        }
      } catch (err) {
        console.error('Failed to sync pending invite code to localStorage:', err)
      }
    }
    set({ pendingInviteCode: formatted })
  }
}))
