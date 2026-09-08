import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { onSyncEvent } from '@/lib/realtime'
import { supabase } from '@/lib/supabase'
import { subscribeBoards } from '@/services/boards'
import { subscribeLanes } from '@/services/lanes'
import { subscribeItems } from '@/services/items'
import { subscribeBoardMembers } from '@/services/members'
import { queryKeys } from './query-keys'

/**
 * Subscribes to global boards real-time changes (postgres changes + broadcast).
 * Mount near the app root (e.g. in BoardsLayout).
 */
export function useRealtimeBoardsSync(userId?: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    // 1. Postgres changes subscription
    const channel = subscribeBoards(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.all })
    })

    // 2. Peer-to-peer broadcast sync (<50ms delivery)
    const unsubBroadcast = onSyncEvent((event) => {
      if (event === 'boards') {
        queryClient.invalidateQueries({ queryKey: queryKeys.boards.all })
      }
    })

    return () => {
      supabase.removeChannel(channel)
      unsubBroadcast()
    }
  }, [userId, queryClient])
}

/**
 * Subscribes to board canvas real-time changes (lanes, items, members).
 * Mount in BoardDetailPage.
 */
export function useRealtimeCanvasSync(boardId: number | string, userId?: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!boardId) return

    // 1. Lanes subscription
    const lanesChannel = subscribeLanes(boardId, () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lanes.list(boardId) })
    })

    // 2. Items subscription
    const itemsChannel = subscribeItems(boardId, () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.list(boardId) })
    })

    // 3. Members subscription
    const membersChannel = subscribeBoardMembers(boardId, () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.list(boardId) })
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.members.permission(boardId, userId) })
      }
    })

    // 4. Peer-to-peer broadcast sync
    const unsubBroadcast = onSyncEvent((event) => {
      if (event === 'lanes') {
        queryClient.invalidateQueries({ queryKey: queryKeys.lanes.list(boardId) })
      } else if (event === 'items') {
        queryClient.invalidateQueries({ queryKey: queryKeys.items.list(boardId) })
      } else if (event === 'members') {
        queryClient.invalidateQueries({ queryKey: queryKeys.members.list(boardId) })
        if (userId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.members.permission(boardId, userId) })
        }
      }
    })

    return () => {
      supabase.removeChannel(lanesChannel)
      supabase.removeChannel(itemsChannel)
      supabase.removeChannel(membersChannel)
      unsubBroadcast()
    }
  }, [boardId, userId, queryClient])
}
