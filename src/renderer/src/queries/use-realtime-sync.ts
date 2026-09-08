import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { onSyncEvent } from '@/lib/realtime'
import { supabase } from '@/lib/supabase'
import { subscribeBoards, subscribeBoard } from '@/services/boards'
import { subscribeLanes } from '@/services/lanes'
import { subscribeItems } from '@/services/items'
import { subscribeBoardMembers } from '@/services/members'
import { useBoardsStore } from '@/stores/boards'
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
    const unsubBroadcast = onSyncEvent((event, payload) => {
      if (event === 'boards') {
        if (payload?.id && payload?.updates) {
          queryClient.setQueryData<Board>(queryKeys.boards.detail(payload.id), (old) =>
            old ? { ...old, ...payload.updates } : old
          )
          queryClient.setQueriesData<Board[]>({ queryKey: queryKeys.boards.all }, (old) => {
            if (!Array.isArray(old)) return old
            return old.map((b) =>
              String(b.id) === String(payload.id) ? { ...b, ...payload.updates } : b
            )
          })
          useBoardsStore.setState((s) => ({
            boards: s.boards.map((b) =>
              String(b.id) === String(payload.id) ? { ...b, ...payload.updates } : b
            )
          }))
        }
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
 * Subscribes to board canvas real-time changes (board detail, lanes, items, members).
 * Mount in BoardDetailPage.
 */
export function useRealtimeCanvasSync(boardId: number | string, userId?: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!boardId) return

    // 1. Board detail subscription (for realtime icon, title, description changes)
    const boardChannel = subscribeBoard(boardId, (payload: any) => {
      if (payload?.new) {
        queryClient.setQueryData<Board>(queryKeys.boards.detail(boardId), (old) =>
          old ? { ...old, ...payload.new } : (payload.new as Board)
        )
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.all })
    })

    // 2. Lanes subscription
    const lanesChannel = subscribeLanes(boardId, () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lanes.list(boardId) })
    })

    // 3. Items subscription
    const itemsChannel = subscribeItems(boardId, () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.list(boardId) })
    })

    // 4. Members subscription
    const membersChannel = subscribeBoardMembers(boardId, () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.list(boardId) })
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.members.permission(boardId, userId) })
      }
    })

    // 5. Peer-to-peer broadcast sync
    const unsubBroadcast = onSyncEvent((event, payload) => {
      if (event === 'boards') {
        if (!payload || !payload.id || String(payload.id) === String(boardId)) {
          if (payload?.updates) {
            queryClient.setQueryData<Board>(queryKeys.boards.detail(boardId), (old) =>
              old ? { ...old, ...payload.updates } : old
            )
          }
          queryClient.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) })
        }
      } else if (event === 'lanes') {
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
      supabase.removeChannel(boardChannel)
      supabase.removeChannel(lanesChannel)
      supabase.removeChannel(itemsChannel)
      supabase.removeChannel(membersChannel)
      unsubBroadcast()
    }
  }, [boardId, userId, queryClient])
}
