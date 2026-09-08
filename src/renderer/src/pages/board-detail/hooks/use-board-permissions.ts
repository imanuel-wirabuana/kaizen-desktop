import { useMemo } from 'react'

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
    if (dbPermission) return dbPermission
    if (board?.role) return board.role
    if (userId && board?.owner === userId) return 'owner'
    return board ? 'view' : null
  }, [dbPermission, board?.role, board?.owner, board, userId])

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
