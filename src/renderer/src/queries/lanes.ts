import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as lanesService from '@/services/lanes'
import { broadcastSyncEvent } from '@/lib/realtime'
import { queryKeys } from './query-keys'

export function createVirtualDraftLane(boardId: number | string): Lane {
  return {
    id: null,
    board_id: Number(boardId),
    title: 'Draft',
    description: 'Unassigned & draft items',
    background: null,
    order: -Infinity,
    isVirtual: true,
    created_at: new Date().toISOString()
  }
}

export function useLanesQuery(boardId: number | string) {
  return useQuery({
    queryKey: queryKeys.lanes.list(boardId),
    queryFn: async () => {
      const userLanes = await lanesService.getLanesByBoardId(boardId)
      return [createVirtualDraftLane(boardId), ...userLanes]
    },
    enabled: !!boardId,
    staleTime: 1000 * 60 * 2
  })
}

export function useCreateLaneMutation(boardId: number | string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (draft: Partial<Omit<Lane, 'id' | 'created_at' | 'updated_at'>>) => {
      return lanesService.createLane({ ...draft, board_id: Number(boardId) })
    },
    onMutate: async (draft) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.lanes.list(boardId) })
      const previousLanes = queryClient.getQueryData<Lane[]>(queryKeys.lanes.list(boardId)) || []

      const realLanes = previousLanes.filter((l) => l.id !== null)
      const maxOrder = realLanes.length > 0 ? Math.max(...realLanes.map((l) => l.order ?? 0)) : 0
      const order = draft.order ?? maxOrder + 1

      const tempId = -Date.now()
      const optimistic: Lane = {
        id: tempId,
        board_id: Number(boardId),
        title: draft.title ?? 'New Column',
        description: draft.description ?? null,
        background: draft.background ?? null,
        order,
        created_at: new Date().toISOString()
      }

      queryClient.setQueryData<Lane[]>(queryKeys.lanes.list(boardId), [...previousLanes, optimistic])
      broadcastSyncEvent('lanes')

      return { previousLanes, tempId }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousLanes) {
        queryClient.setQueryData(queryKeys.lanes.list(boardId), context.previousLanes)
        broadcastSyncEvent('lanes')
      }
    },
    onSuccess: (result, _vars, context) => {
      if (!result) return
      queryClient.setQueryData<Lane[]>(queryKeys.lanes.list(boardId), (old = []) =>
        old.map((l) => (l.id === context?.tempId ? result : l))
      )
      broadcastSyncEvent('lanes')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lanes.list(boardId) })
    }
  })
}

export function useUpdateLaneMutation(boardId: number | string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number | string; updates: Partial<Lane> }) => {
      return lanesService.updateLane(id, updates)
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.lanes.list(boardId) })
      const previousLanes = queryClient.getQueryData<Lane[]>(queryKeys.lanes.list(boardId)) || []

      queryClient.setQueryData<Lane[]>(queryKeys.lanes.list(boardId), (old = []) =>
        old.map((l) => (String(l.id) === String(id) ? { ...l, ...updates } : l))
      )

      broadcastSyncEvent('lanes')
      return { previousLanes }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousLanes) {
        queryClient.setQueryData(queryKeys.lanes.list(boardId), context.previousLanes)
        broadcastSyncEvent('lanes')
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lanes.list(boardId) })
    }
  })
}

export function useDeleteLaneMutation(boardId: number | string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number | string) => {
      return lanesService.deleteLane(id)
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.lanes.list(boardId) })
      const previousLanes = queryClient.getQueryData<Lane[]>(queryKeys.lanes.list(boardId)) || []

      queryClient.setQueryData<Lane[]>(queryKeys.lanes.list(boardId), (old = []) =>
        old.filter((l) => String(l.id) !== String(id))
      )

      broadcastSyncEvent('lanes')
      return { previousLanes }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousLanes) {
        queryClient.setQueryData(queryKeys.lanes.list(boardId), context.previousLanes)
        broadcastSyncEvent('lanes')
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lanes.list(boardId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.items.list(boardId) })
    }
  })
}

export function useReorderLanesMutation(boardId: number | string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reordered: Lane[]) => {
      const real = reordered.filter((l) => l.id !== null && typeof l.id === 'number' && l.id > 0)
      const updates = real.map((lane, index) => lanesService.updateLane(lane.id!, { order: index }))
      const results = await Promise.all(updates)
      return results.every((r) => r !== null)
    },
    onMutate: async (reordered) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.lanes.list(boardId) })
      const previousLanes = queryClient.getQueryData<Lane[]>(queryKeys.lanes.list(boardId)) || []

      const draft = previousLanes.find((l) => l.id === null)
      const nonDraft = reordered.filter((l) => l.id !== null).map((l, i) => ({ ...l, order: i }))
      const nextList = draft ? [draft, ...nonDraft] : nonDraft

      queryClient.setQueryData<Lane[]>(queryKeys.lanes.list(boardId), nextList)
      broadcastSyncEvent('lanes')

      return { previousLanes }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousLanes) {
        queryClient.setQueryData(queryKeys.lanes.list(boardId), context.previousLanes)
        broadcastSyncEvent('lanes')
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lanes.list(boardId) })
    }
  })
}
