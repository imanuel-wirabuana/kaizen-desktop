import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as boardsService from '@/services/boards'
import * as repo from '@/lib/db/repo'
import { db } from '@/lib/db'
import { useBoardsStore } from '@/stores/boards'
import { isBoardPinned, setBoardPinned } from '@/lib/pinned-boards'
import { broadcastSyncEvent } from '@/lib/realtime'
import { queryKeys } from './query-keys'

export function useBoardsQuery(userId?: string) {
  return useQuery({
    queryKey: queryKeys.boards.list(userId),
    queryFn: async () => {
      const local = await repo.getLocalBoards(userId)
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return local.map((b) => ({ ...b, pinned: isBoardPinned(b.id) }))
      }
      try {
        const data = await boardsService.getBoards(userId)
        await repo.putLocalBoards(data)
        return data.map((b) => ({
          ...b,
          pinned: isBoardPinned(b.id)
        }))
      } catch (err) {
        console.warn('[useBoardsQuery] Network fetch failed, returning local Dexie boards:', err)
        return local.map((b) => ({ ...b, pinned: isBoardPinned(b.id) }))
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2 // 2 minutes fresh
  })
}

export function useBoardDetailQuery(boardId: number | string, userId?: string) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: queryKeys.boards.detail(boardId),
    queryFn: async () => {
      let data: Board | null = null
      try {
        data = await boardsService.getBoardById(boardId)
        if (data) await repo.putLocalBoard(data)
      } catch {
        // Fallback to local
      }

      if (!data) {
        data = (await db.boards.get(Number(boardId))) || null
      }

      if (!data) return null
      const fromStore = useBoardsStore.getState().boards.find((b) => String(b.id) === String(boardId))
      return {
        ...data,
        role: fromStore?.role ?? data.role,
        pinned: isBoardPinned(data.id)
      }
    },
    enabled: !!boardId,
    // Instant initial data from the boards list cache or store if available!
    initialData: () => {
      if (userId) {
        const list = queryClient.getQueryData<Board[]>(queryKeys.boards.list(userId))
        const found = list?.find((b) => String(b.id) === String(boardId))
        if (found) return found
      }

      const allQueries = queryClient.getQueriesData<Board[]>({ queryKey: ['boards'] })
      for (const [, data] of allQueries) {
        if (Array.isArray(data)) {
          const found = data.find((b) => String(b.id) === String(boardId))
          if (found) return found
        }
      }

      const fromStore = useBoardsStore.getState().boards.find((b) => String(b.id) === String(boardId))
      if (fromStore) return fromStore

      return undefined
    },
    initialDataUpdatedAt: () => {
      if (userId) {
        const ts = queryClient.getQueryState(queryKeys.boards.list(userId))?.dataUpdatedAt
        if (ts) return ts
      }
      return queryClient.getQueryState(queryKeys.boards.detail(boardId))?.dataUpdatedAt
    },
    staleTime: 1000 * 60 * 2
  })
}

export function useCreateBoardMutation(userId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (draft: Partial<Omit<Board, 'id' | 'created_at' | 'updated_at'>>) => {
      return boardsService.createBoard(draft)
    },
    onMutate: async (draft) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.list(userId) })
      const previousBoards = queryClient.getQueryData<Board[]>(queryKeys.boards.list(userId)) || []

      const maxOrder = Math.max(0, ...previousBoards.map((b) => b.order ?? 0))
      const tempId = -Date.now()
      const optimistic: Board = {
        id: tempId,
        title: draft.title ?? null,
        description: draft.description ?? null,
        icon: draft.icon ?? '📋',
        pinned: draft.pinned ?? false,
        background: draft.background ?? null,
        owner: draft.owner ?? userId ?? null,
        owner_info: draft.owner_info ?? null,
        order: draft.order ?? maxOrder + 1,
        role: 'owner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      queryClient.setQueryData<Board[]>(queryKeys.boards.list(userId), [optimistic, ...previousBoards])
      broadcastSyncEvent('boards')

      return { previousBoards, tempId }
    },
    onError: (_err, _draft, context) => {
      if (context?.previousBoards) {
        queryClient.setQueryData(queryKeys.boards.list(userId), context.previousBoards)
        broadcastSyncEvent('boards')
      }
    },
    onSuccess: (result, _draft, context) => {
      if (!result) return
      queryClient.setQueryData<Board[]>(queryKeys.boards.list(userId), (old = []) =>
        old.map((b) => (b.id === context?.tempId ? { ...result, role: 'owner' as const, pinned: isBoardPinned(result.id) } : b))
      )
      broadcastSyncEvent('boards')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.all })
    }
  })
}

export function useUpdateBoardMutation(userId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number | string; updates: Partial<Board> }) => {
      return boardsService.updateBoard(id, updates)
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.list(userId) })
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.detail(id) })

      const previousBoards = queryClient.getQueryData<Board[]>(queryKeys.boards.list(userId)) || []
      const previousDetail = queryClient.getQueryData<Board | null>(queryKeys.boards.detail(id))

      if (updates.pinned !== undefined) {
        setBoardPinned(id, Boolean(updates.pinned))
      }

      const patch = { ...updates, updated_at: new Date().toISOString() }

      queryClient.setQueryData<Board[]>(queryKeys.boards.list(userId), (old = []) =>
        old.map((b) => (String(b.id) === String(id) ? { ...b, ...patch } : b))
      )

      if (previousDetail) {
        queryClient.setQueryData<Board>(queryKeys.boards.detail(id), {
          ...previousDetail,
          ...patch
        })
      }

      broadcastSyncEvent('boards')
      return { previousBoards, previousDetail }
    },
    onError: (_err, { id }, context) => {
      if (context?.previousBoards) {
        queryClient.setQueryData(queryKeys.boards.list(userId), context.previousBoards)
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(queryKeys.boards.detail(id), context.previousDetail)
      }
      broadcastSyncEvent('boards')
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.list(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.detail(id) })
    }
  })
}

export function useDeleteBoardMutation(userId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, currentUserId }: { id: number | string; currentUserId?: string }) => {
      return boardsService.deleteBoard(id, currentUserId)
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.list(userId) })
      const previousBoards = queryClient.getQueryData<Board[]>(queryKeys.boards.list(userId)) || []

      queryClient.setQueryData<Board[]>(queryKeys.boards.list(userId), (old = []) =>
        old.filter((b) => String(b.id) !== String(id))
      )

      broadcastSyncEvent('boards')
      return { previousBoards }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousBoards) {
        queryClient.setQueryData(queryKeys.boards.list(userId), context.previousBoards)
        broadcastSyncEvent('boards')
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.all })
    }
  })
}
