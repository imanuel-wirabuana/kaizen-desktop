import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  boardFoldersIndexedDbStorage,
  migrateFoldersFromLocalStorageToDb
} from '@/lib/folders/board-folders-db'
import { useBoardsStore } from './boards'

export interface BoardFolder {
  id: string
  user_id?: string | null
  name: string
  icon?: string
  color?: string
  order: number
  isCollapsed: boolean
  createdAt: string
  updatedAt: string
}

export interface BoardFoldersState {
  folders: BoardFolder[]
  boardFolderMap: Record<string, string> // boardId (as string) -> folderId
  boardOrderMap: Record<string, (string | number)[]> // categoryKey -> array of board IDs
  isHydrated: boolean
  hasHydrated: boolean
  setHasHydrated: (val: boolean) => void

  // Actions
  createFolder: (
    name: string,
    icon?: string,
    color?: string,
    userId?: string | null
  ) => BoardFolder
  updateFolder: (id: string, updates: Partial<Omit<BoardFolder, 'id' | 'createdAt'>>) => void
  deleteFolder: (id: string) => void
  reorderFolders: (folders: BoardFolder[]) => void
  toggleFolderCollapse: (id: string) => void
  setFolderCollapse: (id: string, isCollapsed: boolean) => void
  moveBoardToFolder: (boardId: string | number, targetFolderId: string | null) => void
  reorderCategoryBoards: (categoryKey: string, boardIds: (string | number)[]) => void
  getBoardFolder: (boardId: string | number) => BoardFolder | undefined
}

export const useBoardFoldersStore = create<BoardFoldersState>()(
  persist(
    (set, get) => ({
      folders: [],
      boardFolderMap: {},
      boardOrderMap: {},
      isHydrated: false,
      hasHydrated: false,
      setHasHydrated: (val) => set({ hasHydrated: val, isHydrated: val }),

      createFolder: (name, icon = '📁', color, userId) => {
        const folders = get().folders
        const maxOrder = folders.length > 0 ? Math.max(...folders.map((f) => f.order ?? 0)) : 0
        const resolvedUserId =
          userId !== undefined ? userId : (useBoardsStore.getState().owner || null)
        const newFolder: BoardFolder = {
          id: `folder_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          user_id: resolvedUserId,
          name: name.trim(),
          icon: icon || '📁',
          color: color || '#3b82f6',
          order: maxOrder + 1,
          isCollapsed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        set({ folders: [...folders, newFolder] })
        return newFolder
      },

      updateFolder: (id, updates) => {
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id
              ? {
                  ...f,
                  ...updates,
                  updatedAt: new Date().toISOString()
                }
              : f
          )
        }))
      },

      deleteFolder: (id) => {
        set((state) => {
          // Remove folder from folders array
          const newFolders = state.folders.filter((f) => f.id !== id)
          // Unassign any boards assigned to this folder (clean up map)
          const newMap = { ...state.boardFolderMap }
          for (const [bId, fId] of Object.entries(newMap)) {
            if (fId === id) {
              delete newMap[bId]
            }
          }

          const newOrderMap = { ...state.boardOrderMap }
          delete newOrderMap[`folder_${id}`]

          return {
            folders: newFolders,
            boardFolderMap: newMap,
            boardOrderMap: newOrderMap
          }
        })
      },

      reorderFolders: (newFolders) => {
        const indexed = newFolders.map((f, idx) => ({ ...f, order: idx + 1 }))
        set({ folders: indexed })
      },

      toggleFolderCollapse: (id) => {
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, isCollapsed: !f.isCollapsed } : f
          )
        }))
      },

      setFolderCollapse: (id, isCollapsed) => {
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, isCollapsed } : f
          )
        }))
      },

      moveBoardToFolder: (boardId, targetFolderId) => {
        const key = String(boardId)
        set((state) => {
          const newMap = { ...state.boardFolderMap }
          if (targetFolderId === null) {
            delete newMap[key]
          } else {
            newMap[key] = targetFolderId
          }
          return { boardFolderMap: newMap }
        })
      },

      reorderCategoryBoards: (categoryKey, boardIds) => {
        set((state) => ({
          boardOrderMap: {
            ...state.boardOrderMap,
            [categoryKey]: boardIds
          }
        }))
      },

      getBoardFolder: (boardId) => {
        const folderId = get().boardFolderMap[String(boardId)]
        if (!folderId) return undefined
        return get().folders.find((f) => f.id === folderId)
      }
    }),
    {
      name: 'kaizen_board_folders_v1',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (persistedState && Array.isArray(persistedState.folders)) {
          persistedState.folders = persistedState.folders.map((f: any) => ({
            ...f,
            user_id: f.user_id ?? null
          }))
        }
        return persistedState
      },
      storage: createJSONStorage(() => boardFoldersIndexedDbStorage),
      partialize: (state) => ({
        folders: state.folders,
        boardFolderMap: state.boardFolderMap,
        boardOrderMap: state.boardOrderMap
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Partial<BoardFoldersState>) || {}
        return {
          ...currentState,
          ...persisted,
          folders: persisted.folders || currentState.folders || [],
          boardFolderMap: persisted.boardFolderMap || currentState.boardFolderMap || {},
          boardOrderMap: persisted.boardOrderMap || currentState.boardOrderMap || {},
          isHydrated: true,
          hasHydrated: true
        }
      },
      onRehydrateStorage: () => {
        return (_state, error) => {
          if (error) {
            console.error('[Board Folders] Failed to rehydrate folders from IndexedDB:', error)
          }
          useBoardFoldersStore.setState({ isHydrated: true, hasHydrated: true })
        }
      }
    }
  )
)

// Proactively migrate any existing localStorage folder data to IndexedDB
if (typeof window !== 'undefined') {
  migrateFoldersFromLocalStorageToDb().catch((err) => {
    console.warn('[Board Folders] Proactive migration check failed:', err)
  })
}

/**
 * Utility function to categorize all boards into:
 * - pinned
 * - customFolders (each folder with its boards)
 * - myBoards (owned, unpinned, not in custom folder)
 * - sharedBoards (shared, unpinned, not in custom folder)
 */
export function categorizeBoards(
  allBoards: Board[],
  folders: BoardFolder[],
  boardFolderMap: Record<string, string>,
  boardOrderMap?: Record<string, (string | number)[]>,
  currentUserId?: string
) {
  // Sort helper using category-specific custom order if available, falling back to board.order
  const sortByCustomOrder = (boards: Board[], categoryKey: string) => {
    const customOrder = boardOrderMap?.[categoryKey]
    if (!customOrder || customOrder.length === 0) {
      return [...boards].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    }
    const orderLookup = new Map(customOrder.map((id, idx) => [String(id), idx]))
    return [...boards].sort((a, b) => {
      const idxA = orderLookup.get(String(a.id))
      const idxB = orderLookup.get(String(b.id))
      if (idxA !== undefined && idxB !== undefined) return idxA - idxB
      if (idxA !== undefined) return -1
      if (idxB !== undefined) return 1
      return (a.order ?? 0) - (b.order ?? 0)
    })
  }

  // 1. Pinned boards: any board with pinned: true
  const rawPinned = allBoards.filter((b) => Boolean(b.pinned))
  const pinned = sortByCustomOrder(rawPinned, 'pinned')

  // Map of non-pinned boards
  const unpinnedBoards = allBoards.filter((b) => !b.pinned)

  // 2. Custom folders (filtered for current user if currentUserId is set)
  const userFolders = currentUserId
    ? folders.filter((f) => !f.user_id || f.user_id === currentUserId)
    : folders
  const sortedFolders = [...userFolders].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const customFolders = sortedFolders.map((folder) => {
    const folderBoards = unpinnedBoards.filter(
      (b) => boardFolderMap[String(b.id)] === folder.id
    )
    return {
      folder,
      boards: sortByCustomOrder(folderBoards, `folder_${folder.id}`)
    }
  })

  // 3. Unfiled unpinned boards
  const unfiledBoards = unpinnedBoards.filter((b) => !boardFolderMap[String(b.id)])

  // 4. My Boards (owned & unfiled)
  const rawMyBoards = unfiledBoards.filter(
    (b) => !b.role || b.role === 'owner' || (currentUserId && b.owner === currentUserId)
  )
  const myBoards = sortByCustomOrder(rawMyBoards, 'my-boards')

  // 5. Shared Boards (shared & unfiled)
  const rawSharedBoards = unfiledBoards.filter(
    (b) => b.role === 'edit' || b.role === 'view'
  )
  const sharedBoards = sortByCustomOrder(rawSharedBoards, 'shared-boards')

  return {
    pinned,
    customFolders,
    myBoards,
    sharedBoards
  }
}
