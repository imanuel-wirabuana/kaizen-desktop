import { useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import {
  useBoardsStore,
  selectBoards,
  selectPinnedBoards,
  selectUnpinnedBoards,
} from '@/stores/boards'

/** Initializes the boards store for the current user. Mount once near the app root. */
export function useBoardsInit() {
  const { user, isLoaded, isSignedIn } = useUser()
  const init = useBoardsStore((s) => s.init)
  const cleanup = useBoardsStore((s) => s.cleanup)

  useEffect(() => {
    if (!isLoaded) return
    const owner = isSignedIn && user?.id ? user.id : undefined
    if (!owner) {
      cleanup()
      return
    }
    init(owner)
    return () => cleanup()
  }, [isLoaded, isSignedIn, user?.id, init, cleanup])
}

export function useBoards(): Board[] {
  return useBoardsStore(selectBoards)
}

export function usePinnedBoards(): Board[] {
  return useBoardsStore(selectPinnedBoards)
}

export function useUnpinnedBoards(): Board[] {
  return useBoardsStore(selectUnpinnedBoards)
}

// Alias for convenience
export const useNotPinnedBoards = useUnpinnedBoards