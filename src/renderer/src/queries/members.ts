import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as membersService from '@/services/members'
import { broadcastSyncEvent } from '@/lib/realtime'
import { queryKeys } from './query-keys'

export function useBoardMembersQuery(boardId: number | string) {
  return useQuery({
    queryKey: queryKeys.members.list(boardId),
    queryFn: async () => {
      return membersService.getBoardMembers(boardId)
    },
    enabled: !!boardId,
    staleTime: 1000 * 60 * 2
  })
}

export function useBoardPermissionQuery(boardId: number | string, userId?: string) {
  return useQuery({
    queryKey: queryKeys.members.permission(boardId, userId),
    queryFn: async () => {
      if (!boardId || !userId) return null
      return membersService.getUserBoardPermission(boardId, userId)
    },
    enabled: !!boardId && !!userId,
    staleTime: 1000 * 60 * 2
  })
}

export function useUpdateMemberPermissionMutation(boardId: number | string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ memberId, permission }: { memberId: number; permission: 'view' | 'edit' }) => {
      return membersService.updateMemberPermission(memberId, permission)
    },
    onMutate: async ({ memberId, permission }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.members.list(boardId) })
      const previousMembers = queryClient.getQueryData<BoardMember[]>(queryKeys.members.list(boardId)) || []

      queryClient.setQueryData<BoardMember[]>(queryKeys.members.list(boardId), (old = []) =>
        old.map((m) => (m.id === memberId ? { ...m, permission } : m))
      )

      broadcastSyncEvent('members')
      return { previousMembers }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(queryKeys.members.list(boardId), context.previousMembers)
        broadcastSyncEvent('members')
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.list(boardId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all })
    }
  })
}
