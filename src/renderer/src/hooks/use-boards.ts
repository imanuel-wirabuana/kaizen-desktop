import { useEffect } from 'react'
import { useShallow } from 'zustand/shallow'
import { useUser } from '@/providers/auth-provider'
import {
  useBoardsStore,
  selectBoards,
  selectPinnedBoards,
  selectUnpinnedBoards
} from '@/stores/boards'

import { useBoardsQuery } from '@/queries/boards'

/** Initializes the boards store for the current user. Mount once near the app root. */
export function useBoardsInit() {
  const { user, isLoaded, isSignedIn } = useUser()
  const owner = isLoaded && isSignedIn && user?.id ? user.id : undefined
  const { data: boards, isLoading } = useBoardsQuery(owner)

  useEffect(() => {
    if (!owner) {
      useBoardsStore.getState().cleanup()
      return
    }
    if (boards) {
      useBoardsStore.setState({ boards, loading: false, owner })
    } else if (isLoading && useBoardsStore.getState().boards.length === 0) {
      useBoardsStore.setState({ loading: true, owner })
    }
  }, [owner, boards, isLoading])
}

export function useBoards(): Board[] {
  return useBoardsStore(selectBoards)
}

export function usePinnedBoards(): Board[] {
  return useBoardsStore(useShallow(selectPinnedBoards))
}

export function useUnpinnedBoards(): Board[] {
  return useBoardsStore(useShallow(selectUnpinnedBoards))
}

// Alias for convenience
export const useNotPinnedBoards = useUnpinnedBoards
