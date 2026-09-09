import { useMemo } from 'react'
import { useBoardsStore } from '@/stores/boards'

export type PermissionRole = 'owner' | 'edit' | 'view' | null

export interface BoardPermissions {
  permissionRole: PermissionRole
  isOwner: boolean
  isReadOnly: boolean
  canEdit: boolean
}

export function useBoardPermissions(
  board: Board | null | undefined,
  dbPermission?: 'owner' | 'edit' | 'view' | null,
  userId?: string | null
): BoardPermissions {
  const permissionRole = useMemo<PermissionRole>(() => {
    if (!board) return null

    // 1. User is explicitly the board owner
    if (userId && board.owner && board.owner === userId) {
      return 'owner'
    }

    // 2. Unowned boards (local offline or demo boards)
    if (!board.owner) {
      return 'owner'
    }

    // 3. Database permission query explicitly completed
    // (if null, user is unauthorized - neither owner nor in board_members)
    if (dbPermission !== undefined) {
      return dbPermission
    }

    // 4. Fallback while database query is still in flight
    if (board.role) {
      return board.role
    }

    // Check boards store for preloaded role
    if (board.id !== undefined) {
      const fromStore = useBoardsStore.getState().boards.find((b) => String(b.id) === String(board.id))
      if (fromStore?.role) {
        return fromStore.role
      }
    }

    // 5. Pending resolution for shared board
    return 'view'
  }, [dbPermission, board?.role, board?.owner, board?.id, board, userId])

  const isOwner = permissionRole === 'owner'
  const isReadOnly = permissionRole === 'view'
  const canEdit = permissionRole === 'owner' || permissionRole === 'edit'

  return {
    permissionRole,
    isOwner,
    isReadOnly,
    canEdit
  }
}
