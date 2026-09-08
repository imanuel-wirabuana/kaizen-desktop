import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as itemsService from '@/services/items'
import { broadcastSyncEvent } from '@/lib/realtime'
import { queryKeys } from './query-keys'

export function useItemsQuery(boardId: number | string) {
  return useQuery({
    queryKey: queryKeys.items.list(boardId),
    queryFn: async () => {
      return itemsService.getItemsByBoardId(boardId)
    },
    enabled: !!boardId,
    staleTime: 1000 * 60 * 2
  })
}

export function useCreateItemMutation(boardId: number | string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (draft: Partial<KanbanItem>) => {
      return itemsService.createItem({ ...draft, board_id: Number(boardId) })
    },
    onMutate: async (draft) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.items.list(boardId) })
      const previousItems = queryClient.getQueryData<KanbanItem[]>(queryKeys.items.list(boardId)) || []

      const laneId =
        draft.lane_id !== undefined && draft.lane_id !== null
          ? typeof draft.lane_id === 'number' || !isNaN(Number(draft.lane_id))
            ? Number(draft.lane_id)
            : draft.lane_id
          : null

      const sameLaneItems = previousItems.filter(
        (i) => (i.lane_id === null && laneId === null) || (i.lane_id !== null && String(i.lane_id) === String(laneId))
      )
      const maxOrder = sameLaneItems.length > 0 ? Math.max(...sameLaneItems.map((i) => i.order ?? 0)) : 0
      const order = draft.order ?? maxOrder + 100

      const tempId = -Date.now()
      const optimistic: KanbanItem = {
        id: tempId,
        board_id: Number(boardId),
        lane_id: laneId,
        title: draft.title ?? 'New Task',
        icon: draft.icon ?? null,
        description: draft.description ?? null,
        order,
        priority: draft.priority ?? 0,
        due_date: draft.due_date ?? null,
        background: draft.background ?? null,
        owner: draft.owner ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      queryClient.setQueryData<KanbanItem[]>(queryKeys.items.list(boardId), [...previousItems, optimistic])
      broadcastSyncEvent('items')

      return { previousItems, tempId }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(queryKeys.items.list(boardId), context.previousItems)
        broadcastSyncEvent('items')
      }
    },
    onSuccess: (result, _vars, context) => {
      if (!result) return
      queryClient.setQueryData<KanbanItem[]>(queryKeys.items.list(boardId), (old = []) =>
        old.map((i) => (i.id === context?.tempId ? result : i))
      )
      broadcastSyncEvent('items')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.list(boardId) })
    }
  })
}

export function useUpdateItemMutation(boardId: number | string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number | string; updates: Partial<KanbanItem> }) => {
      return itemsService.updateItem(id, updates)
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.items.list(boardId) })
      const previousItems = queryClient.getQueryData<KanbanItem[]>(queryKeys.items.list(boardId)) || []

      queryClient.setQueryData<KanbanItem[]>(queryKeys.items.list(boardId), (old = []) =>
        old.map((i) => (String(i.id) === String(id) ? { ...i, ...updates, updated_at: new Date().toISOString() } : i))
      )

      broadcastSyncEvent('items')
      return { previousItems }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(queryKeys.items.list(boardId), context.previousItems)
        broadcastSyncEvent('items')
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.list(boardId) })
    }
  })
}

export function useDeleteItemMutation(boardId: number | string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number | string) => {
      return itemsService.deleteItem(id)
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.items.list(boardId) })
      const previousItems = queryClient.getQueryData<KanbanItem[]>(queryKeys.items.list(boardId)) || []

      queryClient.setQueryData<KanbanItem[]>(queryKeys.items.list(boardId), (old = []) =>
        old.filter((i) => String(i.id) !== String(id))
      )

      broadcastSyncEvent('items')
      return { previousItems }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(queryKeys.items.list(boardId), context.previousItems)
        broadcastSyncEvent('items')
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.list(boardId) })
    }
  })
}

export function useMoveItemMutation(boardId: number | string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      targetLaneId,
      newOrder
    }: {
      id: number | string
      targetLaneId: number | null
      newOrder: number
    }) => {
      return itemsService.updateItem(id, {
        lane_id: targetLaneId,
        order: newOrder
      })
    },
    onMutate: async ({ id, targetLaneId, newOrder }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.items.list(boardId) })
      const previousItems = queryClient.getQueryData<KanbanItem[]>(queryKeys.items.list(boardId)) || []

      const normalizedTargetLane =
        targetLaneId !== null && !isNaN(Number(targetLaneId)) ? Number(targetLaneId) : null

      queryClient.setQueryData<KanbanItem[]>(queryKeys.items.list(boardId), (old = []) =>
        old.map((i) =>
          String(i.id) === String(id)
            ? { ...i, lane_id: normalizedTargetLane, order: newOrder, updated_at: new Date().toISOString() }
            : i
        )
      )

      broadcastSyncEvent('items')
      return { previousItems }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(queryKeys.items.list(boardId), context.previousItems)
        broadcastSyncEvent('items')
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.list(boardId) })
    }
  })
}
