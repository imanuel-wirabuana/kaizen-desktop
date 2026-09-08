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
  LayersIcon,
  LogOutIcon,
  DownloadIcon,
  UploadIcon,
  FolderIcon,
  FolderPlusIcon,
  CheckIcon
} from 'lucide-react'
import { useBoardsStore } from '@/stores/boards'
import { useBoardFoldersStore } from '@/stores/board-folders'
import { useUser } from '@/providers/auth-provider'

export type BoardMenuContentProps = {
  board: Board
  variant: MenuVariant
  permissionRole?: string
  isOwner?: boolean
  canEdit?: boolean
  onEdit?: (e?: any) => void
  onDelete?: (e?: any) => void
  onLeave?: (e?: any) => void
  onExport?: (e?: any) => void
  onImport?: (e?: any) => void
  onTogglePin?: (e?: any) => void
  onCreateFolder?: () => void
}

export function BoardMenuContent({
  board,
  variant,
  permissionRole,
  isOwner: propIsOwner,
  canEdit: propCanEdit,
  onEdit,
  onDelete,
  onLeave,
  onExport,
  onImport,
  onTogglePin,
  onCreateFolder
}: BoardMenuContentProps) {
  const updateBoard = useBoardsStore((s) => s.updateBoard)
  const duplicateBoard = useBoardsStore((s) => s.duplicateBoard)
  const { user } = useUser()

  const folders = useBoardFoldersStore((s) => s.folders)
  const boardFolderMap = useBoardFoldersStore((s) => s.boardFolderMap)
  const moveBoardToFolder = useBoardFoldersStore((s) => s.moveBoardToFolder)
  const currentFolderId = board.id !== undefined ? boardFolderMap[String(board.id)] : undefined

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

      {/* Move to Project Submenu */}
      <MenuSub>
        <MenuSubTrigger>
          <FolderIcon className="text-muted-foreground" />
          <span>Move to Project</span>
        </MenuSubTrigger>
        <MenuSubContent className="w-52 text-xs shadow-xl">
          <MenuItem
            onClick={() => {
              if (board.id !== undefined) {
                moveBoardToFolder(board.id, null)
              }
            }}
          >
            <span className="flex size-4 items-center justify-center">
              {!currentFolderId && <CheckIcon className="size-3 text-primary" />}
            </span>
            <span className="ml-1">None (No Project)</span>
          </MenuItem>
          {folders.length > 0 && <MenuSeparator />}
          {folders.map((folder) => {
            const isSelected = currentFolderId === folder.id
            return (
              <MenuItem
                key={folder.id}
                onClick={() => {
                  if (board.id !== undefined) {
                    if (board.pinned) {
                      updateBoard(board.id, { pinned: false })
                    }
                    moveBoardToFolder(board.id, folder.id)
                  }
                }}
              >
                <span className="flex size-4 items-center justify-center">
                  {isSelected ? (
                    <CheckIcon className="size-3 text-primary" />
                  ) : (
                    <span className="text-xs">{folder.icon || '📁'}</span>
                  )}
                </span>
                <span className="ml-1 truncate">{folder.name}</span>
              </MenuItem>
            )
          })}
          {onCreateFolder && (
            <>
              <MenuSeparator />
              <MenuItem onClick={onCreateFolder}>
                <FolderPlusIcon className="size-3.5 text-muted-foreground" />
                <span className="ml-1">New Project...</span>
              </MenuItem>
            </>
          )}
        </MenuSubContent>
      </MenuSub>

      {canEdit && onEdit && (
        <MenuItem onClick={onEdit}>
          <PencilIcon className="text-muted-foreground" />
          <span>Edit Board</span>
        </MenuItem>
      )}

      {canEdit && onExport && (
        <MenuItem onClick={onExport}>
          <UploadIcon className="text-muted-foreground" />
          <span>Export Board</span>
        </MenuItem>
      )}

      {canEdit && onImport && (
        <MenuItem onClick={onImport}>
          <DownloadIcon className="text-muted-foreground" />
          <span>Import Content</span>
        </MenuItem>
      )}

      {/* Duplicate Submenu */}

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

      {!isOwner && onLeave && (
        <>
          <MenuSeparator />
          <MenuItem destructive onClick={onLeave}>
            <LogOutIcon />
            <span>Leave Board</span>
          </MenuItem>
        </>
      )}
    </MenuProvider>
  )
}
