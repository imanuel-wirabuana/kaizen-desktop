import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { BoardMutationProposal } from '@/lib/ai/ai-tools'
import { aiChatIndexedDbStorage } from '@/lib/ai/ai-chat-db'

export interface BoardAiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
  proposal?: BoardMutationProposal
  applied?: boolean
}

interface BoardAiState {
  isOpen: boolean
  isFullScreen: boolean
  isPreviewOpen: boolean
  isGenerating: boolean
  activeProposal: BoardMutationProposal | null
  chatsByBoard: Record<string, BoardAiMessage[]>
  hasHydrated: boolean
  setHasHydrated: (val: boolean) => void

  // Sidebar controls
  toggleSidebar: () => void
  openSidebar: () => void
  closeSidebar: () => void
  toggleFullScreen: () => void
  setIsFullScreen: (val: boolean) => void

  // Chat message management
  getBoardMessages: (boardId: string | number) => BoardAiMessage[]
  addMessage: (boardId: string | number, message: BoardAiMessage) => void
  updateLastAssistantMessage: (
    boardId: string | number,
    updater: (prev: BoardAiMessage) => BoardAiMessage
  ) => void
  markProposalApplied: (boardId: string | number, messageId: string) => void
  clearBoardChat: (boardId: string | number) => void
  setIsGenerating: (val: boolean) => void

  // Proposal preview modal controls
  openPreviewModal: (proposal: BoardMutationProposal) => void
  closePreviewModal: () => void
}

export const useBoardAiStore = create<BoardAiState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      isFullScreen: false,
      isPreviewOpen: false,
      isGenerating: false,
      activeProposal: null,
      chatsByBoard: {},
      hasHydrated: false,
      setHasHydrated: (val) => set({ hasHydrated: val }),

      toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
      openSidebar: () => set({ isOpen: true }),
      closeSidebar: () => set({ isOpen: false, isFullScreen: false }),
      toggleFullScreen: () => set((state) => ({ isFullScreen: !state.isFullScreen })),
      setIsFullScreen: (val) => set({ isFullScreen: val }),

      getBoardMessages: (boardId) => {
        const key = String(boardId)
        return get().chatsByBoard[key] || []
      },

      addMessage: (boardId, message) => {
        const key = String(boardId)
        set((state) => {
          const boardList = state.chatsByBoard[key] || []
          return {
            chatsByBoard: {
              ...state.chatsByBoard,
              [key]: [...boardList, message]
            }
          }
        })
      },

      updateLastAssistantMessage: (boardId, updater) => {
        const key = String(boardId)
        set((state) => {
          const list = state.chatsByBoard[key] || []
          if (list.length === 0) return state
          const lastIdx = list.length - 1
          const updated = [...list]
          updated[lastIdx] = updater(updated[lastIdx])
          return {
            chatsByBoard: {
              ...state.chatsByBoard,
              [key]: updated
            }
          }
        })
      },

      markProposalApplied: (boardId, messageId) => {
        const key = String(boardId)
        set((state) => {
          const list = state.chatsByBoard[key] || []
          const updated = list.map((msg) =>
            msg.id === messageId ? { ...msg, applied: true } : msg
          )
          return {
            chatsByBoard: {
              ...state.chatsByBoard,
              [key]: updated
            }
          }
        })
      },

      clearBoardChat: (boardId) => {
        const key = String(boardId)
        set((state) => {
          const copy = { ...state.chatsByBoard }
          delete copy[key]
          return { chatsByBoard: copy }
        })
      },

      setIsGenerating: (val) => set({ isGenerating: val }),

      openPreviewModal: (proposal) =>
        set({ activeProposal: proposal, isPreviewOpen: true }),
      closePreviewModal: () =>
        set({ activeProposal: null, isPreviewOpen: false })
    }),
    {
      name: 'kaizen_board_ai_chats',
      storage: createJSONStorage(() => aiChatIndexedDbStorage),
      partialize: (state) => ({
        chatsByBoard: state.chatsByBoard
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Partial<BoardAiState>) || {}
        const mergedChats: Record<string, BoardAiMessage[]> = {
          ...(persisted.chatsByBoard || {})
        }

        if (currentState.chatsByBoard) {
          for (const [boardId, currentMsgs] of Object.entries(currentState.chatsByBoard)) {
            const persistedMsgs = mergedChats[boardId] || []
            const existingIds = new Set(persistedMsgs.map((m) => m.id))
            const newMsgs = currentMsgs.filter((m) => !existingIds.has(m.id))
            mergedChats[boardId] = [...persistedMsgs, ...newMsgs]
          }
        }

        return {
          ...currentState,
          ...persisted,
          chatsByBoard: mergedChats,
          hasHydrated: true
        }
      },
      onRehydrateStorage: () => {
        return (_state, error) => {
          if (error) {
            console.error('[AI Chat] Failed to rehydrate chats from IndexedDB:', error)
          }
          useBoardAiStore.setState({ hasHydrated: true })
        }
      }
    }
  )
)
