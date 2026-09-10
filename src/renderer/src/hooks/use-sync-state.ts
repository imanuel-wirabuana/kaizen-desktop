import { useEffect, useState, useCallback } from 'react'
import {
  subscribeSyncState,
  getSyncState,
  flushOutbox,
  type SyncState
} from '@/lib/db/sync-outbox'

export function useSyncState() {
  const [state, setState] = useState<{
    status: SyncState
    pendingCount: number
    lastSyncedAt: Date | null
    lastError: string | null
  }>(getSyncState())

  useEffect(() => {
    return subscribeSyncState((next) => {
      setState(next)
    })
  }, [])

  const flushNow = useCallback(async () => {
    await flushOutbox()
  }, [])

  return {
    ...state,
    flushNow
  }
}
