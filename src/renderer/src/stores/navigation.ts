import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type View =
  | { name: 'landing' }
  | { name: 'success' }
  | { name: 'boards' }
  | { name: 'board-detail'; boardId: number | string }

type NavigationState = {
  currentView: View
  history: View[]
  navigate: (view: View) => void
  goBack: () => void
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set, get) => ({
      currentView: { name: 'landing' },
      history: [],
      navigate: (view: View) => {
        const current = get().currentView
        if (
          current.name === view.name &&
          (current as any).boardId === (view as any).boardId
        ) {
          return
        }
        set((state) => ({
          history: [...state.history.slice(-20), current],
          currentView: view
        }))
      },
      goBack: () => {
        const history = get().history
        if (history.length === 0) return
        const prev = history[history.length - 1]
        set({
          currentView: prev,
          history: history.slice(0, -1)
        })
      }
    }),
    {
      name: 'kaizen-navigation'
    }
  )
)
