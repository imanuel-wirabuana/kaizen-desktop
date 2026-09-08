import { useState, useRef, useEffect, useMemo } from 'react'
import { DragDropProvider, DragOverlay, useDroppable } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { move } from '@dnd-kit/helpers'
import { CollisionPriority } from '@dnd-kit/abstract'
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar'
import {
  FolderIcon,
  FolderPlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  GripVerticalIcon,
  MoreVerticalIcon,
  PencilIcon,
  Trash2Icon,
  PlusIcon,
  UsersIcon,
  PinIcon,
  LogIn
} from 'lucide-react'
import { EditBoardDrawer } from './edit-board-drawer'
import { DeleteBoardDrawer } from './delete-board-drawer'
import { LeaveBoardDrawer } from './leave-board-drawer'
import { ShareBoardModal } from './share-board-modal'
import { BoardDrawer } from './board-drawer'
import { FolderModal, DeleteFolderDialog } from './folder-modal'
import { BoardMenuContent } from '@/components/menus/board-menu-content'
import { useBoardsStore, selectLoading } from '@/stores/boards'
import { useBoardFoldersStore, BoardFolder, categorizeBoards } from '@/stores/board-folders'
import { useNavigationStore } from '@/stores/navigation'
import { useJoinModalStore } from '@/stores/join-modal'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function TruncatedText({ text, className }: { text: string; className?: string }) {
  const textRef = useRef<HTMLSpanElement>(null)
  const [isTruncated, setIsTruncated] = useState(false)

  const checkTruncation = () => {
    if (textRef.current) {
      setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth)
    }
  }

  useEffect(() => {
    checkTruncation()
    window.addEventListener('resize', checkTruncation)
    return () => window.removeEventListener('resize', checkTruncation)
  }, [text])

  if (isTruncated) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
              <span
                ref={textRef}
                onMouseEnter={checkTruncation}
                className={cn('truncate', className)}
              >
                {text}
              </span>
            }
          />
          <TooltipContent side="right" className="text-xs max-w-xs">
            {text}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <span
      ref={textRef}
      onMouseEnter={checkTruncation}
      className={cn('truncate', className)}
    >
      {text}
    </span>
  )
}

export function NavSidebarBoards() {
  const loading = useBoardsStore(selectLoading)
  const boards = useBoardsStore((s) => s.boards)
  const currentUserId = useBoardsStore((s) => s.owner)

  const folders = useBoardFoldersStore((s) => s.folders)
  const boardFolderMap = useBoardFoldersStore((s) => s.boardFolderMap)
  const boardOrderMap = useBoardFoldersStore((s) => s.boardOrderMap)
  const moveBoardToFolder = useBoardFoldersStore((s) => s.moveBoardToFolder)
  const reorderCategoryBoards = useBoardFoldersStore((s) => s.reorderCategoryBoards)
  const reorderFolders = useBoardFoldersStore((s) => s.reorderFolders)
  const setFolderCollapse = useBoardFoldersStore((s) => s.setFolderCollapse)

  // Categorize boards cleanly
  const categorized = useMemo(() => {
    return categorizeBoards(boards, folders, boardFolderMap, boardOrderMap, currentUserId)
  }, [boards, folders, boardFolderMap, boardOrderMap, currentUserId])

  // Build the multi-container dictionary for @dnd-kit
  const buildContainers = (): Record<string, Board[]> => {
    const containers: Record<string, Board[]> = {
      pinned: categorized.pinned,
      'my-boards': categorized.myBoards,
      'shared-boards': categorized.sharedBoards
    }
    for (const cf of categorized.customFolders) {
      containers[`folder_${cf.folder.id}`] = cf.boards
    }
    return containers
  }

  const [items, setItems] = useState<Record<string, Board[]>>(buildContainers)
  const previousItems = useRef(items)
  const itemsRef = useRef(items)
  itemsRef.current = items

  // Keep local DnD containers synchronized when external state updates
  useEffect(() => {
    setItems(buildContainers())
  }, [categorized])

  const { isMobile } = useSidebar()
  const { currentView, navigate } = useNavigationStore()
  const openJoinModal = useJoinModalStore((s) => s.openModal)

  // Auto-expand the project containing the active board on navigation / page refresh
  const lastAutoExpandedBoardIdRef = useRef<string | number | null>(null)
  useEffect(() => {
    if (currentView.name === 'board-detail' && currentView.boardId) {
      if (lastAutoExpandedBoardIdRef.current !== currentView.boardId) {
        lastAutoExpandedBoardIdRef.current = currentView.boardId
        const folderId = boardFolderMap[String(currentView.boardId)]
        if (folderId) {
          setFolderCollapse(folderId, false)
        }
      }
    }
  }, [currentView, boardFolderMap, setFolderCollapse])

  // Board modals state
  const [createBoardOpen, setCreateBoardOpen] = useState(false)
  const [activeBoardForEdit, setActiveBoardForEdit] = useState<Board | null>(null)
  const [activeBoardForDelete, setActiveBoardForDelete] = useState<Board | null>(null)
  const [activeBoardForLeave, setActiveBoardForLeave] = useState<Board | null>(null)
  const [activeBoardForShare, setActiveBoardForShare] = useState<Board | null>(null)

  // Folder modals state
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false)
  const [activeFolderForEdit, setActiveFolderForEdit] = useState<BoardFolder | null>(null)
  const [activeFolderForDelete, setActiveFolderForDelete] = useState<BoardFolder | null>(null)

  // Quick create board inside specific folder
  const [createBoardFolderId, setCreateBoardFolderId] = useState<string | null>(null)

  const handleCreateBoard = () => {
    setCreateBoardFolderId(null)
    setCreateBoardOpen(true)
  }

  const handleTogglePin = async (e: any, item: Board) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault()
      e.stopPropagation()
    }
    if (item.id === undefined) return
    const nextPinned = !item.pinned
    await useBoardsStore.getState().updateBoard(item.id, { pinned: nextPinned })
    if (nextPinned) {
      moveBoardToFolder(item.id, null)
    }
  }

  const handleShare = (e: React.MouseEvent, item: Board) => {
    e.preventDefault()
    e.stopPropagation()
    setActiveBoardForShare(item)
  }

  if (loading) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden space-y-4 p-2">
        <div className="space-y-2">
          <Skeleton className="h-3 w-14 rounded-md ml-1" />
          <div className="space-y-1">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex h-8 items-center justify-between gap-2 px-2 rounded-lg border border-transparent bg-muted/10"
              >
                <div className="flex items-center gap-2 flex-1">
                  <Skeleton className="size-4 rounded-md shrink-0" />
                  <Skeleton className="h-3.5 w-28 rounded-md" />
                </div>
                <Skeleton className="size-3.5 rounded shrink-0" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2 pt-1">
          <Skeleton className="h-3 w-16 rounded-md ml-1" />
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex h-8 items-center justify-between gap-2 px-2 rounded-lg border border-transparent bg-muted/10"
              >
                <div className="flex items-center gap-2 flex-1">
                  <Skeleton className="size-4 rounded-md shrink-0" />
                  <Skeleton className="h-3.5 w-32 rounded-md" />
                </div>
                <Skeleton className="size-3.5 rounded shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </SidebarGroup>
    )
  }

  return (
    <>
      <DragDropProvider
        modifiers={[RestrictToVerticalAxis]}
        onDragStart={() => {
          previousItems.current = itemsRef.current
        }}
        onDragOver={(event) => {
          const { source } = event.operation
          if (!source) return

          // Folder reordering drag
          if (source.type === 'folder') {
            return
          }

          // Board drag across containers
          if (source.type === 'board') {
            setItems((prev) => {
              const next = move(prev as any, event) as Record<string, Board[]>
              return next
            })
          }
        }}
        onDragEnd={(event) => {
          const { source, target } = event.operation
          if (event.canceled) {
            if (source?.type === 'board') {
              setItems(previousItems.current)
            }
            return
          }

          // Handle folder reordering
          if (source?.type === 'folder') {
            if (target && target.type === 'folder') {
              const oldIdx = folders.findIndex((f) => String(f.id) === String(source.id))
              const newIdx = folders.findIndex((f) => String(f.id) === String(target.id))
              if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
                const reordered = [...folders]
                const [moved] = reordered.splice(oldIdx, 1)
                reordered.splice(newIdx, 0, moved)
                reorderFolders(reordered)
              }
            }
            return
          }

          // Handle board reordering and cross-container drops
          if (source?.type === 'board') {
            const currentContainers = itemsRef.current
            const sourceBoardId = source.id
            const allBoards = boards

            // Find which container the board is now located in
            let destContainerKey: string | null = null
            for (const [cKey, cBoards] of Object.entries(currentContainers)) {
              if (cBoards.some((b) => String(b.id) === String(sourceBoardId))) {
                destContainerKey = cKey
                break
              }
            }

            if (!destContainerKey) return

            // Persist the board ordering inside the destination container
            const destBoards = currentContainers[destContainerKey] || []
            const destIds = destBoards.map((b) => b.id!).filter(Boolean)
            reorderCategoryBoards(destContainerKey, destIds)

            // Update board pin and folder assignment according to destination container
            if (destContainerKey === 'pinned') {
              useBoardsStore.getState().updateBoard(sourceBoardId, { pinned: true })
              moveBoardToFolder(sourceBoardId, null)
            } else if (destContainerKey.startsWith('folder_')) {
              const folderId = destContainerKey.replace('folder_', '')
              useBoardsStore.getState().updateBoard(sourceBoardId, { pinned: false })
              moveBoardToFolder(sourceBoardId, folderId)
            } else if (destContainerKey === 'my-boards' || destContainerKey === 'shared-boards') {
              useBoardsStore.getState().updateBoard(sourceBoardId, { pinned: false })
              moveBoardToFolder(sourceBoardId, null)
            }

            // Sync global board order
            const allReordered: Board[] = []
            for (const cBoards of Object.values(currentContainers)) {
              allReordered.push(...cBoards)
            }
            if (allReordered.length > 0) {
              useBoardsStore.getState().reorderBoards(allReordered)
            }
          }
        }}
      >
        {/* ── 1. Projects Category (/custom-folder1, /custom-folder2, ...) ── */}
        <CustomFoldersSection
          folders={folders}
          itemsMap={items}
          currentView={currentView}
          isMobile={isMobile}
          onNavigate={(id) => navigate({ name: 'board-detail', boardId: id })}
          onTogglePin={handleTogglePin}
          onEditBoard={setActiveBoardForEdit}
          onShareBoard={(e, item) => handleShare(e, item)}
          onDeleteBoard={setActiveBoardForDelete}
          onLeaveBoard={setActiveBoardForLeave}
          onCreateFolder={() => setCreateFolderModalOpen(true)}
          onEditFolder={(folder) => setActiveFolderForEdit(folder)}
          onDeleteFolder={(folder) => setActiveFolderForDelete(folder)}
          onCreateBoardInFolder={(folderId) => {
            setCreateBoardFolderId(folderId)
            setCreateBoardOpen(true)
          }}
        />

        {/* ── 2. Pinned Boards Category (/pinned) ── */}
        <PinnedBoardsGroup
          items={items['pinned'] || []}
          currentView={currentView}
          isMobile={isMobile}
          copiedBoardId={null}
          onNavigate={(id) => navigate({ name: 'board-detail', boardId: id })}
          onTogglePin={handleTogglePin}
          onEdit={setActiveBoardForEdit}
          onShare={(e, item) => handleShare(e, item)}
          onDelete={setActiveBoardForDelete}
          onLeave={setActiveBoardForLeave}
          onCreateFolder={() => setCreateFolderModalOpen(true)}
        />

        {/* ── 3. My Boards Category (/my boards) ── */}
        <MyBoardsGroup
          items={items['my-boards'] || []}
          currentView={currentView}
          isMobile={isMobile}
          copiedBoardId={null}
          onNavigate={(id) => navigate({ name: 'board-detail', boardId: id })}
          onTogglePin={handleTogglePin}
          onEdit={setActiveBoardForEdit}
          onShare={(e, item) => handleShare(e, item)}
          onDelete={setActiveBoardForDelete}
          onLeave={setActiveBoardForLeave}
          onCreateFolder={() => setCreateFolderModalOpen(true)}
          onCreateBoard={handleCreateBoard}
        />

        {/* ── 4. Shared Boards Category (/shared boards) ── */}
        <SharedBoardsGroup
          items={items['shared-boards'] || []}
          currentView={currentView}
          isMobile={isMobile}
          copiedBoardId={null}
          onNavigate={(id) => navigate({ name: 'board-detail', boardId: id })}
          onTogglePin={handleTogglePin}
          onEdit={setActiveBoardForEdit}
          onShare={(e, item) => handleShare(e, item)}
          onDelete={setActiveBoardForDelete}
          onLeave={setActiveBoardForLeave}
          onCreateFolder={() => setCreateFolderModalOpen(true)}
          onJoinBoard={() => openJoinModal()}
        />

        {/* ── Drag Overlay for Boards and Folders ── */}
        <DragOverlay dropAnimation={null}>
          {(source) => {
            if (!source) return null

            if (source.type === 'folder') {
              const activeFolder = folders.find((f) => String(f.id) === String(source.id))
              if (!activeFolder) return null
              return <FolderDragPreview folder={activeFolder} />
            }

            if (source.type === 'board') {
              const activeBoard = boards.find((b) => String(b.id) === String(source.id))
              if (!activeBoard) return null
              return <BoardDragPreview item={activeBoard} />
            }

            return null
          }}
        </DragOverlay>
      </DragDropProvider>

      {/* Board Modals */}
      <BoardDrawer
        mode="create"
        open={createBoardOpen}
        onOpenChange={setCreateBoardOpen}
        onSuccess={(created) => {
          if (created && created.id && createBoardFolderId) {
            moveBoardToFolder(created.id, createBoardFolderId)
          }
          setCreateBoardFolderId(null)
        }}
      />

      <EditBoardDrawer
        board={activeBoardForEdit}
        open={!!activeBoardForEdit}
        onOpenChange={(open) => !open && setActiveBoardForEdit(null)}
      />

      <DeleteBoardDrawer
        board={activeBoardForDelete}
        open={!!activeBoardForDelete}
        onOpenChange={(open) => !open && setActiveBoardForDelete(null)}
        onSuccess={() => {
          if (
            currentView.name === 'board-detail' &&
            currentView.boardId === activeBoardForDelete?.id
          ) {
            navigate({ name: 'boards' })
          }
        }}
      />

      <LeaveBoardDrawer
        board={activeBoardForLeave}
        open={!!activeBoardForLeave}
        onOpenChange={(open) => !open && setActiveBoardForLeave(null)}
        onSuccess={() => {
          if (
            currentView.name === 'board-detail' &&
            currentView.boardId === activeBoardForLeave?.id
          ) {
            navigate({ name: 'boards' })
          }
        }}
      />

      <ShareBoardModal
        board={activeBoardForShare}
        open={!!activeBoardForShare}
        onOpenChange={(open: boolean) => !open && setActiveBoardForShare(null)}
      />

      {/* Folder Modals */}
      <FolderModal
        open={createFolderModalOpen}
        onOpenChange={setCreateFolderModalOpen}
      />

      <FolderModal
        open={!!activeFolderForEdit}
        folderToEdit={activeFolderForEdit}
        onOpenChange={(open) => !open && setActiveFolderForEdit(null)}
      />

      <DeleteFolderDialog
        folder={activeFolderForDelete}
        open={!!activeFolderForDelete}
        onOpenChange={(open) => !open && setActiveFolderForDelete(null)}
      />

      {/* Quick Board Creation in specific folder */}
      <BoardDrawer
        mode="create"
        open={!!createBoardFolderId}
        onOpenChange={(open) => !open && setCreateBoardFolderId(null)}
        onSuccess={(created) => {
          if (created && created.id && createBoardFolderId) {
            moveBoardToFolder(created.id, createBoardFolderId)
          }
        }}
      />
    </>
  )
}

// ── 1. Droppable Group for Pinned Boards (/pinned) ──
function PinnedBoardsGroup({
  items,
  currentView,
  isMobile,
  copiedBoardId,
  onNavigate,
  onTogglePin,
  onEdit,
  onShare,
  onDelete,
  onLeave,
  onCreateFolder
}: {
  items: Board[]
  currentView: ReturnType<typeof useNavigationStore.getState>['currentView']
  isMobile: boolean
  copiedBoardId: number | string | null
  onNavigate: (id: number | string) => void
  onTogglePin: (e: React.MouseEvent, item: Board) => void
  onEdit: (item: Board) => void
  onShare: (e: React.MouseEvent, item: Board) => void
  onDelete: (item: Board) => void
  onLeave?: (item: Board) => void
  onCreateFolder?: () => void
}) {
  const { isDropTarget, ref } = useDroppable({
    id: 'pinned',
    type: 'column',
    accept: 'board',
    collisionPriority: CollisionPriority.Low
  })

  return (
    <SidebarGroup className="group/category group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="flex items-center gap-1.5">
        <PinIcon className="size-3 text-primary" />
        <span>Pinned</span>
      </SidebarGroupLabel>
      <div
        ref={ref}
        className={`min-h-[36px] max-h-[200px] category-scroll pr-1 rounded-md transition-colors ${
          isDropTarget ? 'bg-accent/40 ring-1 ring-accent-foreground/20' : ''
        }`}
      >
        <SidebarMenu className="space-y-1">
          {items.map((item, index) => (
            <SortableSidebarBoardItem
              key={item.id}
              item={item}
              index={index}
              group="pinned"
              isCurrentPage={
                currentView.name === 'board-detail' &&
                String(currentView.boardId) === String(item.id)
              }
              isMobile={isMobile}
              copiedBoardId={copiedBoardId}
              onNavigate={() => item.id !== undefined && onNavigate(item.id)}
              onTogglePin={(e) => onTogglePin(e, item)}
              onEdit={() => onEdit(item)}
              onShare={(e) => onShare(e, item)}
              onDelete={() => onDelete(item)}
              onLeave={() => onLeave && onLeave(item)}
              onCreateFolder={onCreateFolder}
            />
          ))}
          {items.length === 0 && (
            <div className="flex h-8 items-center justify-center rounded-md border border-dashed border-sidebar-border px-2 text-[10px] text-muted-foreground/60">
              {isDropTarget ? 'Drop here to pin' : 'Drag a board here to pin'}
            </div>
          )}
        </SidebarMenu>
      </div>
    </SidebarGroup>
  )
}

// ── 2. Custom Folders Section (/custom-folder1, /custom-folder2, ...) ──
function CustomFoldersSection({
  folders,
  itemsMap,
  currentView,
  isMobile,
  onNavigate,
  onTogglePin,
  onEditBoard,
  onShareBoard,
  onDeleteBoard,
  onLeaveBoard,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onCreateBoardInFolder
}: {
  folders: BoardFolder[]
  itemsMap: Record<string, Board[]>
  currentView: ReturnType<typeof useNavigationStore.getState>['currentView']
  isMobile: boolean
  onNavigate: (id: number | string) => void
  onTogglePin: (e: React.MouseEvent, item: Board) => void
  onEditBoard: (item: Board) => void
  onShareBoard: (e: React.MouseEvent, item: Board) => void
  onDeleteBoard: (item: Board) => void
  onLeaveBoard?: (item: Board) => void
  onCreateFolder: () => void
  onEditFolder: (folder: BoardFolder) => void
  onDeleteFolder: (folder: BoardFolder) => void
  onCreateBoardInFolder: (folderId: string) => void
}) {
  return (
    <SidebarGroup className="group/category group-data-[collapsible=icon]:hidden">
      <div className="flex items-center justify-between pr-1">
        <SidebarGroupLabel className="flex items-center gap-1.5">
          <FolderIcon className="size-3 text-muted-foreground" />
          <span>Projects</span>
          {folders.length > 0 && (
            <span className="text-[10px] text-muted-foreground/70 font-normal">
              ({folders.length})
            </span>
          )}
        </SidebarGroupLabel>
        <SidebarGroupAction
          onClick={onCreateFolder}
          title="New Project"
          className="cursor-pointer"
        >
          <PlusIcon className="size-3.5" />
        </SidebarGroupAction>
      </div>

      <div className="space-y-1 mt-1 max-h-[220px] category-scroll pr-1">
        {folders.map((folder, folderIndex) => {
          const folderBoards = itemsMap[`folder_${folder.id}`] || []
          return (
            <SortableFolderItem
              key={folder.id}
              folder={folder}
              index={folderIndex}
              boards={folderBoards}
              currentView={currentView}
              isMobile={isMobile}
              onNavigate={onNavigate}
              onTogglePin={onTogglePin}
              onEditBoard={onEditBoard}
              onShareBoard={onShareBoard}
              onDeleteBoard={onDeleteBoard}
              onLeaveBoard={onLeaveBoard}
              onCreateFolder={onCreateFolder}
              onEditFolder={onEditFolder}
              onDeleteFolder={onDeleteFolder}
              onCreateBoardInFolder={onCreateBoardInFolder}
            />
          )
        })}

        {folders.length === 0 && (
          <div
            onClick={onCreateFolder}
            className="flex h-8 items-center justify-center rounded-md border border-dashed border-sidebar-border px-2 text-[10px] text-muted-foreground/60 hover:text-foreground hover:bg-sidebar-accent/50 cursor-pointer transition-colors"
          >
            + Create a project
          </div>
        )}
      </div>
    </SidebarGroup>
  )
}

// ── Individual Sortable Custom Folder with Expand/Collapse & Drop Target ──
function SortableFolderItem({
  folder,
  index,
  boards,
  currentView,
  isMobile,
  onNavigate,
  onTogglePin,
  onEditBoard,
  onShareBoard,
  onDeleteBoard,
  onLeaveBoard,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onCreateBoardInFolder
}: {
  folder: BoardFolder
  index: number
  boards: Board[]
  currentView: ReturnType<typeof useNavigationStore.getState>['currentView']
  isMobile: boolean
  onNavigate: (id: number | string) => void
  onTogglePin: (e: React.MouseEvent, item: Board) => void
  onEditBoard: (item: Board) => void
  onShareBoard: (e: React.MouseEvent, item: Board) => void
  onDeleteBoard: (item: Board) => void
  onLeaveBoard?: (item: Board) => void
  onCreateFolder: () => void
  onEditFolder: (folder: BoardFolder) => void
  onDeleteFolder: (folder: BoardFolder) => void
  onCreateBoardInFolder: (folderId: string) => void
}) {
  const toggleFolderCollapse = useBoardFoldersStore((s) => s.toggleFolderCollapse)

  // Sortable folder reordering
  const {
    ref: sortableRef,
    handleRef: sortableHandleRef,
    isDragSource: isFolderDragging
  } = useSortable({
    id: folder.id,
    index,
    type: 'folder',
    accept: 'folder',
    group: 'folders'
  })

  // Droppable container for boards dropping into this folder (even when collapsed!)
  const { isDropTarget, ref: dropRef } = useDroppable({
    id: `folder_${folder.id}`,
    type: 'column',
    accept: 'board',
    collisionPriority: CollisionPriority.Low
  })

  const navigate = useNavigationStore((s) => s.navigate)
  const isCollapsed = Boolean(folder.isCollapsed)
  const isCurrentProject =
    currentView.name === 'project-detail' && currentView.projectId === folder.id

  return (
    <div
      ref={sortableRef}
      className={cn(
        'group/folder rounded-lg transition-all',
        isFolderDragging && 'opacity-40',
        isDropTarget && 'bg-accent/40 ring-1 ring-primary/40'
      )}
    >
      {/* Folder Header */}
      <div
        ref={dropRef}
        className={cn(
          'group/folder flex h-7 items-center justify-between gap-1 px-1.5 rounded-md text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent/70 transition-colors',
          isDropTarget && 'bg-accent/50',
          isCurrentProject && 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
        )}
      >
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {/* Drag Handle for Folder Reordering */}
          <span
            ref={sortableHandleRef}
            className="hidden group-hover/folder:inline-flex items-center cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-foreground shrink-0"
            title="Drag to reorder project"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVerticalIcon className="size-3" />
          </span>

          {/* Expand/Collapse Chevron Button */}
          <button
            type="button"
            onClick={() => toggleFolderCollapse(folder.id)}
            className="flex size-4 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground cursor-pointer transition-transform"
            title={isCollapsed ? 'Expand project' : 'Collapse project'}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="size-3.5" />
            ) : (
              <ChevronDownIcon className="size-3.5" />
            )}
          </button>

          {/* Project Icon */}
          <span
            onClick={() => navigate({ name: 'project-detail', projectId: folder.id })}
            className="flex size-4 items-center justify-center rounded-xs text-xs shrink-0 text-muted-foreground cursor-pointer"
            title="Open project"
          >
            {folder.icon || '📁'}
          </span>

          {/* Folder Title */}
          <span
            onClick={() => navigate({ name: 'project-detail', projectId: folder.id })}
            className="truncate text-xs font-medium cursor-pointer flex-1 select-none hover:underline"
            title="Open project"
          >
            {folder.name}
          </span>

          {/* Boards count badge */}
          <span className="text-[10px] text-muted-foreground/60 font-normal shrink-0 px-1 rounded-sm bg-muted/30">
            {boards.length}
          </span>
        </div>

        {/* Hover Actions: Quick Add Board & Folder Menu */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover/folder:opacity-100 transition-opacity">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onCreateBoardInFolder(folder.id)}
            className="size-5 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Create board in this project"
          >
            <PlusIcon className="size-3" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="size-5 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Project actions"
                >
                  <MoreVerticalIcon className="size-3" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-40 text-xs">
              <DropdownMenuItem onClick={() => navigate({ name: 'project-detail', projectId: folder.id })}>
                <FolderIcon className="mr-2 size-3.5 text-muted-foreground" />
                <span>Open Project</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditFolder(folder)}>
                <PencilIcon className="mr-2 size-3.5 text-muted-foreground" />
                <span>Edit Project</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleFolderCollapse(folder.id)}>
                {isCollapsed ? (
                  <>
                    <ChevronDownIcon className="mr-2 size-3.5 text-muted-foreground" />
                    <span>Expand Project</span>
                  </>
                ) : (
                  <>
                    <ChevronRightIcon className="mr-2 size-3.5 text-muted-foreground" />
                    <span>Collapse Project</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateBoardInFolder(folder.id)}>
                <PlusIcon className="mr-2 size-3.5 text-muted-foreground" />
                <span>New Board Here</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDeleteFolder(folder)}
              >
                <Trash2Icon className="mr-2 size-3.5" />
                <span>Delete Project</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Expanded Boards inside this folder */}
      {!isCollapsed && (
        <div className="pl-4 pr-1 py-0.5 space-y-0.5 max-h-[160px] folder-scroll category-scroll">
          <SidebarMenu className="space-y-0.5">
            {boards.map((item, bIndex) => (
              <SortableSidebarBoardItem
                key={item.id}
                item={item}
                index={bIndex}
                group={`folder_${folder.id}`}
                isCurrentPage={
                  currentView.name === 'board-detail' &&
                  String(currentView.boardId) === String(item.id)
                }
                isMobile={isMobile}
                copiedBoardId={null}
                onNavigate={() => item.id !== undefined && onNavigate(item.id)}
                onTogglePin={(e) => onTogglePin(e, item)}
                onEdit={() => onEditBoard(item)}
                onShare={(e) => onShareBoard(e, item)}
                onDelete={() => onDeleteBoard(item)}
                onLeave={() => onLeaveBoard && onLeaveBoard(item)}
                onCreateFolder={onCreateFolder}
              />
            ))}
            {boards.length === 0 && (
              <div className="flex h-7 items-center justify-center rounded-md border border-dashed border-sidebar-border px-2 text-[10px] text-muted-foreground/50">
                {isDropTarget ? 'Drop here' : 'Empty project'}
              </div>
            )}
          </SidebarMenu>
        </div>
      )}
    </div>
  )
}

// ── 3. Droppable Group for My Boards (/my boards) ──
function MyBoardsGroup({
  items,
  currentView,
  isMobile,
  copiedBoardId,
  onNavigate,
  onTogglePin,
  onEdit,
  onShare,
  onDelete,
  onLeave,
  onCreateFolder,
  onCreateBoard
}: {
  items: Board[]
  currentView: ReturnType<typeof useNavigationStore.getState>['currentView']
  isMobile: boolean
  copiedBoardId: number | string | null
  onNavigate: (id: number | string) => void
  onTogglePin: (e: React.MouseEvent, item: Board) => void
  onEdit: (item: Board) => void
  onShare: (e: React.MouseEvent, item: Board) => void
  onDelete: (item: Board) => void
  onLeave?: (item: Board) => void
  onCreateFolder?: () => void
  onCreateBoard?: () => void
}) {
  const { isDropTarget, ref } = useDroppable({
    id: 'my-boards',
    type: 'column',
    accept: 'board',
    collisionPriority: CollisionPriority.Low
  })

  return (
    <SidebarGroup className="group/category group-data-[collapsible=icon]:hidden">
      <div className="flex items-center justify-between pr-1">
        <SidebarGroupLabel>My Boards</SidebarGroupLabel>
        {onCreateBoard && (
          <SidebarGroupAction
            onClick={onCreateBoard}
            title="Create Board"
            className="cursor-pointer"
          >
            <PlusIcon className="size-3.5" />
          </SidebarGroupAction>
        )}
      </div>
      <div
        ref={ref}
        className={`min-h-[36px] max-h-[220px] category-scroll pr-1 rounded-md transition-colors ${
          isDropTarget ? 'bg-accent/40 ring-1 ring-accent-foreground/20' : ''
        }`}
      >
        <SidebarMenu className="space-y-1">
          {items.map((item, index) => (
            <SortableSidebarBoardItem
              key={item.id}
              item={item}
              index={index}
              group="my-boards"
              isCurrentPage={
                currentView.name === 'board-detail' &&
                String(currentView.boardId) === String(item.id)
              }
              isMobile={isMobile}
              copiedBoardId={copiedBoardId}
              onNavigate={() => item.id !== undefined && onNavigate(item.id)}
              onTogglePin={(e) => onTogglePin(e, item)}
              onEdit={() => onEdit(item)}
              onShare={(e) => onShare(e, item)}
              onDelete={() => onDelete(item)}
              onLeave={() => onLeave && onLeave(item)}
              onCreateFolder={onCreateFolder}
            />
          ))}
          {items.length === 0 && (
            <div
              onClick={onCreateBoard}
              className="flex h-8 items-center justify-center rounded-md border border-dashed border-sidebar-border px-2 text-[10px] text-muted-foreground/60 hover:text-foreground hover:bg-sidebar-accent/50 cursor-pointer transition-colors"
            >
              {isDropTarget ? 'Drop here to unfile' : '+ Create a board'}
            </div>
          )}
        </SidebarMenu>
      </div>
    </SidebarGroup>
  )
}

// ── 4. Droppable Group for Shared Boards (/shared boards) ──
function SharedBoardsGroup({
  items,
  currentView,
  isMobile,
  copiedBoardId,
  onNavigate,
  onTogglePin,
  onEdit,
  onShare,
  onDelete,
  onLeave,
  onCreateFolder,
  onJoinBoard
}: {
  items: Board[]
  currentView: ReturnType<typeof useNavigationStore.getState>['currentView']
  isMobile: boolean
  copiedBoardId: number | string | null
  onNavigate: (id: number | string) => void
  onTogglePin: (e: React.MouseEvent, item: Board) => void
  onEdit: (item: Board) => void
  onShare: (e: React.MouseEvent, item: Board) => void
  onDelete: (item: Board) => void
  onLeave?: (item: Board) => void
  onCreateFolder?: () => void
  onJoinBoard?: () => void
}) {
  const { isDropTarget, ref } = useDroppable({
    id: 'shared-boards',
    type: 'column',
    accept: 'board',
    collisionPriority: CollisionPriority.Low
  })

  return (
    <SidebarGroup className="group/category group-data-[collapsible=icon]:hidden">
      <div className="flex items-center justify-between pr-1">
        <SidebarGroupLabel className="flex items-center gap-1.5">
          <UsersIcon className="size-3 text-muted-foreground" />
          <span>Shared Boards</span>
        </SidebarGroupLabel>
        {onJoinBoard && (
          <SidebarGroupAction
            onClick={onJoinBoard}
            title="Join Board"
            className="cursor-pointer"
          >
            <LogIn className="size-3.5" />
          </SidebarGroupAction>
        )}
      </div>
      <div
        ref={ref}
        className={`min-h-[36px] max-h-[180px] category-scroll pr-1 rounded-md transition-colors ${
          isDropTarget ? 'bg-accent/40 ring-1 ring-accent-foreground/20' : ''
        }`}
      >
        <SidebarMenu className="space-y-1">
          {items.map((item, index) => (
            <SortableSidebarBoardItem
              key={item.id}
              item={item}
              index={index}
              group="shared-boards"
              isCurrentPage={
                currentView.name === 'board-detail' &&
                String(currentView.boardId) === String(item.id)
              }
              isMobile={isMobile}
              copiedBoardId={copiedBoardId}
              onNavigate={() => item.id !== undefined && onNavigate(item.id)}
              onTogglePin={(e) => onTogglePin(e, item)}
              onEdit={() => onEdit(item)}
              onShare={(e) => onShare(e, item)}
              onDelete={() => onDelete(item)}
              onLeave={() => onLeave && onLeave(item)}
              onCreateFolder={onCreateFolder}
            />
          ))}
          {items.length === 0 && (
            <div
              onClick={onJoinBoard}
              className="flex h-8 items-center justify-center rounded-md border border-dashed border-sidebar-border px-2 text-[10px] text-muted-foreground/60 hover:text-foreground hover:bg-sidebar-accent/50 cursor-pointer transition-colors"
            >
              {isDropTarget ? 'Drop here to move' : '+ Join a board'}
            </div>
          )}
        </SidebarMenu>
      </div>
    </SidebarGroup>
  )
}

// ── Individual Sortable Board Item ──
function SortableSidebarBoardItem({
  item,
  index,
  group,
  isCurrentPage,
  onNavigate,
  onTogglePin,
  onEdit,
  onShare,
  onDelete,
  onLeave,
  onCreateFolder
}: {
  item: Board
  index: number
  group: string
  isCurrentPage: boolean
  isMobile: boolean
  copiedBoardId: number | string | null
  onNavigate: () => void
  onTogglePin: (e: React.MouseEvent) => void
  onEdit: () => void
  onShare: (e: React.MouseEvent) => void
  onDelete: () => void
  onLeave?: () => void
  onCreateFolder?: () => void
}) {
  const { ref, handleRef, isDragSource } = useSortable({
    id: item.id!,
    index,
    type: 'board',
    accept: 'board',
    group
  })

  const buttonRef = useRef<HTMLButtonElement | null>(null)

  // Auto-scroll this board item into view when it is the active board
  useEffect(() => {
    if (!isCurrentPage) return

    const scrollToItem = () => {
      buttonRef.current?.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: 'smooth'
      })
    }

    const t1 = setTimeout(scrollToItem, 100)
    const t2 = setTimeout(scrollToItem, 350)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [isCurrentPage])

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={<SidebarMenuItem ref={ref} className={isDragSource ? 'opacity-40' : ''} />}
      >
        <SidebarMenuButton
          ref={buttonRef}
          className="cursor-pointer flex items-center justify-start gap-1.5 w-full group/item h-7.5"
          isActive={isCurrentPage}
          onClick={onNavigate}
        >
          <span
            ref={handleRef}
            className="hidden group-hover/item:inline-flex items-center cursor-grab touch-none active:cursor-grabbing text-muted-foreground/40 hover:text-foreground shrink-0"
            onClick={(e) => e.stopPropagation()}
            title="Drag to reorder or move"
          >
            <GripVerticalIcon className="size-3.5" />
          </span>

          <span className="shrink-0 text-xs">{item.icon || '📋'}</span>

          <TruncatedText
            text={item.title || 'Untitled Board'}
            className="text-xs font-medium min-w-0 flex-1"
          />

          {item.role && item.role !== 'owner' && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-muted text-muted-foreground font-medium capitalize shrink-0 ml-auto">
              {item.role}
            </span>
          )}
        </SidebarMenuButton>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <BoardMenuContent
          board={item}
          variant="context"
          onEdit={onEdit}
          onDelete={onDelete}
          onLeave={onLeave}
          onTogglePin={onTogglePin}
          onCreateFolder={onCreateFolder}
        />
      </ContextMenuContent>
    </ContextMenu>
  )
}

// ── Drag Preview for Boards ──
export function BoardDragPreview({ item }: { item: Board }) {
  return (
    <div className="w-56 pointer-events-none select-none list-none">
      <SidebarMenuButton
        className="flex w-full items-center justify-start gap-1.5 border border-primary/40 bg-sidebar-accent text-sidebar-accent-foreground shadow-xl ring-1 ring-primary/30 rounded-md"
      >
        <span className="text-primary cursor-grabbing shrink-0">
          <GripVerticalIcon className="size-3.5" />
        </span>
        <span className="shrink-0 text-xs">{item.icon || '📋'}</span>
        <span className="truncate text-xs font-medium flex-1 min-w-0">{item.title}</span>
      </SidebarMenuButton>
    </div>
  )
}

// ── Drag Preview for Folders ──
export function FolderDragPreview({ folder }: { folder: BoardFolder }) {
  return (
    <div className="w-56 pointer-events-none select-none list-none">
      <div className="flex w-full items-center gap-1.5 px-2 py-1.5 border border-primary/40 bg-sidebar-accent text-sidebar-accent-foreground shadow-xl ring-1 ring-primary/30 rounded-md text-xs font-medium">
        <span className="text-primary cursor-grabbing shrink-0">
          <GripVerticalIcon className="size-3.5" />
        </span>
        <span className="flex size-4 items-center justify-center rounded-xs text-xs shrink-0 text-muted-foreground">
          {folder.icon || '📁'}
        </span>
        <span className="truncate flex-1 min-w-0">{folder.name}</span>
      </div>
    </div>
  )
}
