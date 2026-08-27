import { useEffect, useState, useMemo } from 'react'
import { getBoards, subscribeBoards } from '@/services/boards'
import { supabase } from '@/lib/supabase'
import { useUser } from '@clerk/clerk-react'

export function useBoards(explicitOwner?: string): Board[] {
  const { user, isLoaded, isSignedIn } = useUser()
  const [boards, setBoards] = useState<Board[]>([])

  const owner = explicitOwner !== undefined ? explicitOwner : (isSignedIn && user?.id ? user.id : undefined)

  useEffect(() => {
    if (!isLoaded) return

    if (!owner) {
      setBoards([])
      return
    }

    const fetchInitialBoards = async () => {
      const data = await getBoards(owner)
      if (data) {
        setBoards(data)
      }
    }

    fetchInitialBoards()

    const channel = subscribeBoards(() => {
      fetchInitialBoards()
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [owner, isLoaded])

  return boards
}

export function usePinnedBoards(explicitOwner?: string): Board[] {
  const boards = useBoards(explicitOwner)
  return useMemo(() => boards.filter((b) => Boolean(b.pinned)), [boards])
}

export function useUnpinnedBoards(explicitOwner?: string): Board[] {
  const boards = useBoards(explicitOwner)
  return useMemo(() => boards.filter((b) => !b.pinned), [boards])
}

// Alias for convenience
export const useNotPinnedBoards = useUnpinnedBoards