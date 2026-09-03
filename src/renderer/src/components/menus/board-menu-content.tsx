import {
  MenuProvider,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
  MenuSubContent,
  MenuVariant
} from './unified-menu-primitives'
import {
  PinIcon,
  PinOffIcon,
  PencilIcon,
  Trash2Icon,
  CopyIcon,
  CopyPlusIcon,
  LayersIcon
} from 'lucide-react'
import { useBoardsStore } from '@/stores/boards'
import { useUser } from '@/providers/auth-provider'

export type BoardMenuContentProps = {
  board: Board
  variant: MenuVariant
  permissionRole?: string
  isOwner?: boolean
  canEdit?: boolean
  onEdit?: (e?: any) => void
  onDelete?: (e?: any) => void
  onTogglePin?: (e?: any) => void
}

export function BoardMenuContent({
  board,
  variant,
  permissionRole,
  isOwner: propIsOwner,
  canEdit: propCanEdit,
  onEdit,
  onDelete,
  onTogglePin
}: BoardMenuContentProps) {
  const updateBoard = useBoardsStore((s) => s.updateBoard)
  const duplicateBoard = useBoardsStore((s) => s.duplicateBoard)
  const { user } = useUser()

  const isOwner =
    propIsOwner ??
    (permissionRole === 'owner' ||
      board.role === 'owner' ||
      Boolean(user?.id && board.owner === user.id) ||
      (!permissionRole && !board.role && !board.owner))
  const canEdit =
    propCanEdit ?? (isOwner || permissionRole === 'edit' || board.role === 'edit')

  const handleTogglePin = (e?: any) => {
    if (onTogglePin) {
      onTogglePin(e)
    } else if (board.id) {
      updateBoard(board.id, { pinned: !board.pinned })
    }
  }

  return (
    <MenuProvider variant={variant}>
      <MenuItem onClick={handleTogglePin}>
        {board.pinned ? (
          <>
            <PinOffIcon className="text-muted-foreground" />
            <span>Unpin Board</span>
          </>
        ) : (
          <>
            <PinIcon className="text-muted-foreground" />
            <span>Pin Board</span>
          </>
        )}
      </MenuItem>

      {canEdit && onEdit && (
        <MenuItem onClick={onEdit}>
          <PencilIcon className="text-muted-foreground" />
          <span>Edit Board</span>
        </MenuItem>
      )}

      {/* Duplicate Submenu */}
      <MenuSub>
        <MenuSubTrigger>
          <CopyIcon className="text-muted-foreground" />
          <span>Duplicate</span>
        </MenuSubTrigger>
        <MenuSubContent className="w-56 text-xs shadow-xl">
          <MenuItem
            onClick={() =>
              duplicateBoard(board.id!, {
                includeLanes: false,
                includeItems: false
              })
            }
          >
            <CopyIcon className="mr-2 size-3.5 text-muted-foreground" />
            <span>Duplicate Board</span>
          </MenuItem>
          <MenuItem
            onClick={() =>
              duplicateBoard(board.id!, {
                includeLanes: true,
                includeItems: false
              })
            }
          >
            <CopyPlusIcon className="mr-2 size-3.5 text-muted-foreground" />
            <span>Duplicate Board with Lanes</span>
          </MenuItem>
          <MenuItem
            onClick={() =>
              duplicateBoard(board.id!, {
                includeLanes: true,
                includeItems: true
              })
            }
          >
            <LayersIcon className="mr-2 size-3.5 text-muted-foreground" />
            <span>Duplicate Board with Lanes & Items</span>
          </MenuItem>
        </MenuSubContent>
      </MenuSub>

      {isOwner && onDelete && (
        <>
          <MenuSeparator />
          <MenuItem destructive onClick={onDelete}>
            <Trash2Icon />
            <span>Delete Board</span>
          </MenuItem>
        </>
      )}
    </MenuProvider>
  )
}
