import { useState, useRef, useEffect, useMemo } from 'react'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { move } from '@dnd-kit/helpers'
import { CollisionPriority } from '@dnd-kit/abstract'
import { useDroppable } from '@dnd-kit/react'
import { Plus, Pencil, Trash2, FolderIcon, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  SortableGridBoardCard,
  BoardCardPreview,
  BoardDrawer,
  EditBoardDrawer,
  DeleteBoardDrawer,
  LeaveBoardDrawer,
  ShareBoardModal,
  FolderModal,
  DeleteFolderDialog
} from '@/components/boards'
import { useBoardsStore } from '@/stores/boards'
import { useBoardFoldersStore, BoardFolder } from '@/stores/board-folders'
import { useNavigationStore } from '@/stores/navigation'
import { useBreadcrumbs, BreadcrumbItem } from '@/stores/dynamic-breadcrumb'

export function ProjectDetailPage({ projectId }: { projectId: string }) {
  const navigate = useNavigationStore((s) => s.navigate)
  const folders = useBoardFoldersStore((s) => s.folders)
  const boardFolderMap = useBoardFoldersStore((s) => s.boardFolderMap)
  const boardOrderMap = useBoardFoldersStore((s) => s.boardOrderMap)
  const moveBoardToFolder = useBoardFoldersStore((s) => s.moveBoardToFolder)
  const reorderCategoryBoards = useBoardFoldersStore((s) => s.reorderCategoryBoards)

  const folder = folders.find((f) => String(f.id) === String(projectId))

  // Boards store
  const allBoards = useBoardsStore((s) => s.boards)

  // Modals state
  const [createBoardOpen, setCreateBoardOpen] = useState(false)
  const [editFolderOpen, setEditFolderOpen] = useState(false)
  const [deleteFolderOpen, setDeleteFolderOpen] = useState(false)
  const [editingBoard, setEditingBoard] = useState<Board | null>(null)
  const [deletingBoard, setDeletingBoard] = useState<Board | null>(null)
  const [leavingBoard, setLeavingBoard] = useState<Board | null>(null)
  const [sharingBoard, setSharingBoard] = useState<Board | null>(null)
  const [copiedId, setCopiedId] = useState<string | number | null>(null)

  // Boards assigned to this project
  const projectBoards = useMemo(() => {
    if (!folder) return []
    const boardsInFolder = allBoards.filter(
      (b) => b.id !== undefined && boardFolderMap[String(b.id)] === folder.id
    )
    const orderList = boardOrderMap[`folder_${folder.id}`]
    if (!orderList || orderList.length === 0) return boardsInFolder

    const map = new Map(boardsInFolder.map((b) => [String(b.id), b]))
    const ordered: Board[] = []
    for (const id of orderList) {
      const b = map.get(String(id))
      if (b) {
        ordered.push(b)
        map.delete(String(id))
      }
    }
    return [...ordered, ...map.values()]
  }, [allBoards, folder, boardFolderMap, boardOrderMap])

  // Drag & drop items state
  const containerKey = folder ? `folder_${folder.id}` : 'folder_default'
  const [items, setItems] = useState<Record<string, Board[]>>({
    [containerKey]: projectBoards
  })
  const previousItems = useRef(items)
  const itemsRef = useRef(items)
  itemsRef.current = items

  useEffect(() => {
    setItems({ [containerKey]: projectBoards })
  }, [projectBoards, containerKey])

  // Breadcrumb synchronization
  const breadcrumbItems = useMemo(() => {
    if (!folder) {
      return [
        { label: 'Boards', view: { name: 'boards' as const } },
        { label: 'Project Not Found' }
      ]
    }
    return [
      { label: 'Boards', view: { name: 'boards' as const } },
      { label: `${folder.icon || '📁'} ${folder.name}` }
    ]
  }, [folder])

  useBreadcrumbs(breadcrumbItems)

  const handleTogglePin = async (e: React.MouseEvent, board: Board) => {
    e.preventDefault()
    e.stopPropagation()
    if (board.id === undefined) return
    const nextPinned = !board.pinned
    await useBoardsStore.getState().updateBoard(board.id, { pinned: nextPinned })
    if (nextPinned) {
      moveBoardToFolder(board.id, null)
    }
  }

  const handleShare = (e: React.MouseEvent, boardId: string | number) => {
    e.preventDefault()
    e.stopPropagation()
    const found = allBoards.find((b) => b.id === boardId)
    if (found) setSharingBoard(found)
  }

  // Droppable container hook
  const { isDropTarget, ref: dropRef } = useDroppable({
    id: containerKey,
    type: 'column',
    accept: 'board',
    collisionPriority: CollisionPriority.Low
  })

  // If project not found
  if (!folder) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center space-y-3">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/40 text-2xl text-muted-foreground">
          <FolderIcon className="size-7 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">Project not found</h2>
        <p className="text-xs text-muted-foreground max-w-sm">
          This project may have been removed or does not exist.
        </p>
        <Button
          size="sm"
          onClick={() => navigate({ name: 'boards' })}
          className="cursor-pointer"
        >
          Back to Boards
        </Button>
      </div>
    )
  }

  const currentBoards = items[containerKey] || []

  return (
    <div className="flex flex-1 flex-col overflow-y-auto category-scroll p-4 space-y-6">
      {/* ── Project Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-muted/50 text-xl shrink-0 shadow-2xs">
            {folder.icon || '📁'}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {folder.name}
              </h1>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                {projectBoards.length} {projectBoards.length === 1 ? 'board' : 'boards'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Boards organized inside this project
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setCreateBoardOpen(true)}
            className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Create Board</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditFolderOpen(true)}
            className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
          >
            <Pencil className="size-3" />
            <span>Edit</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-xs"
                  className="size-8 cursor-pointer"
                  title="Project options"
                >
                  <MoreVertical className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-44 text-xs">
              <DropdownMenuItem onClick={() => setEditFolderOpen(true)}>
                <Pencil className="mr-2 size-3.5 text-muted-foreground" />
                <span>Rename Project</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteFolderOpen(true)}
              >
                <Trash2 className="mr-2 size-3.5" />
                <span>Delete Project</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Boards Grid with Drag-and-Drop ── */}
      <DragDropProvider
        onDragStart={() => {
          previousItems.current = itemsRef.current
        }}
        onDragOver={(event) => {
          const { source } = event.operation
          if (!source || source.type === 'column') return
          setItems((prev) => {
            const next = move(prev as any, event) as Record<string, Board[]>
            return next
          })
        }}
        onDragEnd={(event) => {
          const { source } = event.operation
          if (event.canceled) {
            setItems(previousItems.current)
            return
          }

          if (source?.type === 'board') {
            const currentContainers = itemsRef.current
            const destBoards = currentContainers[containerKey] || []
            const destIds = destBoards.map((b) => b.id!).filter(Boolean)
            reorderCategoryBoards(containerKey, destIds)
          }
        }}
      >
        <div ref={dropRef} className="min-h-[200px]">
          {currentBoards.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center bg-muted/5 space-y-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted/30 text-xl text-muted-foreground">
                📋
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">No boards in this project yet</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Create a board here or drag existing boards from the sidebar to organize them.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setCreateBoardOpen(true)}
                className="h-8 gap-1.5 text-xs cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Create Board</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {currentBoards.map((board, index) => (
                <SortableGridBoardCard
                  key={board.id}
                  board={board}
                  index={index}
                  group={containerKey}
                  copiedId={copiedId}
                  onNavigate={() => board.id !== undefined && navigate({ name: 'board-detail', boardId: board.id })}
                  onTogglePin={(e) => handleTogglePin(e, board)}
                  onEdit={() => setEditingBoard(board)}
                  onShare={(e) => handleShare(e, board.id!)}
                  onDelete={() => setDeletingBoard(board)}
                  onLeave={() => setLeavingBoard(board)}
                  onCreateFolder={() => {}}
                />
              ))}
            </div>
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {(source) => {
            if (!source) return null
            const activeBoard = allBoards.find((b) => String(b.id) === String(source.id))
            if (!activeBoard) return null
            const width = source.element ? source.element.getBoundingClientRect().width : undefined
            return (
              <div style={{ width: width ? `${width}px` : undefined }}>
                <BoardCardPreview board={activeBoard} />
              </div>
            )
          }}
        </DragOverlay>
      </DragDropProvider>

      {/* ── Drawers & Modals ── */}
      <BoardDrawer
        mode="create"
        open={createBoardOpen}
        onOpenChange={setCreateBoardOpen}
        onSuccess={(created) => {
          if (created && created.id) {
            moveBoardToFolder(created.id, folder.id)
          }
        }}
      />

      <EditBoardDrawer
        board={editingBoard}
        open={!!editingBoard}
        onOpenChange={(open) => !open && setEditingBoard(null)}
      />

      <DeleteBoardDrawer
        board={deletingBoard}
        open={!!deletingBoard}
        onOpenChange={(open) => !open && setDeletingBoard(null)}
      />

      <LeaveBoardDrawer
        board={leavingBoard}
        open={!!leavingBoard}
        onOpenChange={(open) => !open && setLeavingBoard(null)}
      />

      <ShareBoardModal
        board={sharingBoard}
        open={!!sharingBoard}
        onOpenChange={(open) => !open && setSharingBoard(null)}
      />

      <FolderModal
        open={editFolderOpen}
        folderToEdit={folder}
        onOpenChange={setEditFolderOpen}
      />

      <DeleteFolderDialog
        folder={folder}
        open={deleteFolderOpen}
        onOpenChange={setDeleteFolderOpen}
        onSuccess={() => {
          navigate({ name: 'boards' })
        }}
      />
    </div>
  )
}

export default ProjectDetailPage
