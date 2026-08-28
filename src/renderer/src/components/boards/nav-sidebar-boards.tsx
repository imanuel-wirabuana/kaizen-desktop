import { useState, useRef, useEffect } from 'react'
import { DragDropProvider, useDroppable } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { move } from '@dnd-kit/helpers'
import { CollisionPriority } from '@dnd-kit/abstract'
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar'
import {
  FolderIcon,
  PencilIcon,
  ShareIcon,
  Trash2Icon,
  CheckIcon,
  PinIcon,
  PinOffIcon,
  GripVerticalIcon
} from 'lucide-react'
import { EditBoardDrawer } from './edit-board-drawer'
import { DeleteBoardDrawer } from './delete-board-drawer'
import { useBoardsStore } from '@/stores/boards'
import { useNavigationStore } from '@/stores/navigation'
import { usePinnedBoards, useUnpinnedBoards } from '@/hooks/use-boards'

export function NavSidebarBoards({
  pinnedBoards: propsPinnedBoards,
  unpinnedBoards: propsUnpinnedBoards
}: {
  pinnedBoards?: Board[]
  unpinnedBoards?: Board[]
} = {}) {
  const hookPinned = usePinnedBoards()
  const hookUnpinned = useUnpinnedBoards()

  const pinnedBoards = propsPinnedBoards ?? hookPinned
  const unpinnedBoards = propsUnpinnedBoards ?? hookUnpinned

  const [items, setItems] = useState<{ pinned: Board[]; unpinned: Board[] }>({
    pinned: pinnedBoards,
    unpinned: unpinnedBoards
  })

  const previousItems = useRef(items)
  const itemsRef = useRef(items)
  itemsRef.current = items

  // Sync external changes (e.g. from store) into local sortable state
  useEffect(() => {
    setItems({
      pinned: pinnedBoards,
      unpinned: unpinnedBoards
    })
  }, [pinnedBoards, unpinnedBoards])

  const { isMobile } = useSidebar()
  const { currentView, navigate } = useNavigationStore()

  const [activeBoardForEdit, setActiveBoardForEdit] = useState<Board | null>(null)
  const [activeBoardForDelete, setActiveBoardForDelete] = useState<Board | null>(null)
  const [copiedBoardId, setCopiedBoardId] = useState<number | string | null>(null)

  const handleTogglePin = async (e: React.MouseEvent, item: Board) => {
    e.preventDefault()
    e.stopPropagation()
    if (item.id === undefined) return
    await useBoardsStore.getState().updateBoard(item.id, { pinned: !item.pinned })
  }

  const handleShare = (e: React.MouseEvent, boardId?: number | string) => {
    e.preventDefault()
    e.stopPropagation()
    if (boardId === undefined) return

    navigator.clipboard.writeText(`kaizen://boards/${boardId}`)
    setCopiedBoardId(boardId)
    setTimeout(() => setCopiedBoardId(null), 2000)
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
          if (!source || source.type === 'column') return

          setItems((prev) => {
            const next = move(prev as any, event) as { pinned: Board[]; unpinned: Board[] }
            return {
              pinned: next.pinned.map((b) => ({ ...b, pinned: true })),
              unpinned: next.unpinned.map((b) => ({ ...b, pinned: false }))
            }
          })
        }}
        onDragEnd={(event) => {
          const { source } = event.operation
          if (event.canceled) {
            if (source?.type === 'board') {
              setItems(previousItems.current)
            }
            return
          }

          const currentPinned = itemsRef.current.pinned
          const currentUnpinned = itemsRef.current.unpinned
          const allReordered = [...currentPinned, ...currentUnpinned]
          useBoardsStore.getState().reorderBoards(allReordered)
        }}
      >
        {/* ── Pinned Boards Section ── */}
        <PinnedBoardsGroup
          items={items.pinned}
          currentView={currentView}
          isMobile={isMobile}
          copiedBoardId={copiedBoardId}
          onNavigate={(id) => navigate({ name: 'board-detail', boardId: id })}
          onTogglePin={handleTogglePin}
          onEdit={setActiveBoardForEdit}
          onShare={handleShare}
          onDelete={setActiveBoardForDelete}
        />

        {/* ── Unpinned Boards Section ── */}
        <UnpinnedBoardsGroup
          items={items.unpinned}
          currentView={currentView}
          isMobile={isMobile}
          copiedBoardId={copiedBoardId}
          onNavigate={(id) => navigate({ name: 'board-detail', boardId: id })}
          onTogglePin={handleTogglePin}
          onEdit={setActiveBoardForEdit}
          onShare={handleShare}
          onDelete={setActiveBoardForDelete}
        />
      </DragDropProvider>

      {/* Edit Drawer */}
      <EditBoardDrawer
        board={activeBoardForEdit}
        open={!!activeBoardForEdit}
        onOpenChange={(open) => !open && setActiveBoardForEdit(null)}
      />

      {/* Delete Drawer */}
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
    </>
  )
}

// ── Droppable Group for Pinned Boards ──
function PinnedBoardsGroup({
  items,
  currentView,
  isMobile,
  copiedBoardId,
  onNavigate,
  onTogglePin,
  onEdit,
  onShare,
  onDelete
}: {
  items: Board[]
  currentView: ReturnType<typeof useNavigationStore.getState>['currentView']
  isMobile: boolean
  copiedBoardId: number | string | null
  onNavigate: (id: number | string) => void
  onTogglePin: (e: React.MouseEvent, item: Board) => void
  onEdit: (item: Board) => void
  onShare: (e: React.MouseEvent, id?: number | string) => void
  onDelete: (item: Board) => void
}) {
  const { isDropTarget, ref } = useDroppable({
    id: 'pinned',
    type: 'column',
    accept: 'board',
    collisionPriority: CollisionPriority.Low
  })

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="flex items-center gap-1.5">Pinned</SidebarGroupLabel>
      <div
        ref={ref}
        className={`min-h-[36px] rounded-md transition-colors ${
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
              onShare={(e) => onShare(e, item.id)}
              onDelete={() => onDelete(item)}
            />
          ))}
          {items.length === 0 && (
            <div className="flex h-9 items-center justify-center rounded-md border border-dashed border-sidebar-border px-2 text-[11px] text-muted-foreground/60">
              {isDropTarget ? 'Drop here to pin' : 'Drag a board here to pin'}
            </div>
          )}
        </SidebarMenu>
      </div>
    </SidebarGroup>
  )
}

// ── Droppable Group for Unpinned Boards ──
function UnpinnedBoardsGroup({
  items,
  currentView,
  isMobile,
  copiedBoardId,
  onNavigate,
  onTogglePin,
  onEdit,
  onShare,
  onDelete
}: {
  items: Board[]
  currentView: ReturnType<typeof useNavigationStore.getState>['currentView']
  isMobile: boolean
  copiedBoardId: number | string | null
  onNavigate: (id: number | string) => void
  onTogglePin: (e: React.MouseEvent, item: Board) => void
  onEdit: (item: Board) => void
  onShare: (e: React.MouseEvent, id?: number | string) => void
  onDelete: (item: Board) => void
}) {
  const { isDropTarget, ref } = useDroppable({
    id: 'unpinned',
    type: 'column',
    accept: 'board',
    collisionPriority: CollisionPriority.Low
  })

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Boards</SidebarGroupLabel>
      <div
        ref={ref}
        className={`min-h-[36px] rounded-md transition-colors ${
          isDropTarget ? 'bg-accent/40 ring-1 ring-accent-foreground/20' : ''
        }`}
      >
        <SidebarMenu className="space-y-1">
          {items.map((item, index) => (
            <SortableSidebarBoardItem
              key={item.id}
              item={item}
              index={index}
              group="unpinned"
              isCurrentPage={
                currentView.name === 'board-detail' &&
                String(currentView.boardId) === String(item.id)
              }
              isMobile={isMobile}
              copiedBoardId={copiedBoardId}
              onNavigate={() => item.id !== undefined && onNavigate(item.id)}
              onTogglePin={(e) => onTogglePin(e, item)}
              onEdit={() => onEdit(item)}
              onShare={(e) => onShare(e, item.id)}
              onDelete={() => onDelete(item)}
            />
          ))}
          {items.length === 0 && (
            <div className="flex h-9 items-center justify-center rounded-md border border-dashed border-sidebar-border px-2 text-[11px] text-muted-foreground/60">
              {isDropTarget ? 'Drop here to unpin' : 'No boards'}
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
  copiedBoardId,
  onNavigate,
  onTogglePin,
  onEdit,
  onShare,
  onDelete
}: {
  item: Board
  index: number
  group: 'pinned' | 'unpinned'
  isCurrentPage: boolean
  isMobile: boolean
  copiedBoardId: number | string | null
  onNavigate: () => void
  onTogglePin: (e: React.MouseEvent) => void
  onEdit: () => void
  onShare: (e: React.MouseEvent) => void
  onDelete: () => void
}) {
  const { ref, handleRef, isDragSource } = useSortable({
    id: item.id!,
    index,
    type: 'board',
    accept: 'board',
    group
  })

  const pinned = !!item.pinned

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={<SidebarMenuItem ref={ref} className={isDragSource ? 'opacity-50' : ''} />}
      >
        <SidebarMenuButton
          className="cursor-pointer flex justify-between"
          isActive={isCurrentPage}
          onClick={onNavigate}
        >
          <div className="flex items-center gap-2 truncate">
            <span>{item.icon}</span>
            <span className="truncate">{item.title}</span>
          </div>
          <span
            ref={handleRef}
            className="cursor-grab touch-none active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVerticalIcon />
          </span>
        </SidebarMenuButton>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={onNavigate}>
          <FolderIcon className="text-muted-foreground" />
          <span>View Board</span>
        </ContextMenuItem>

        <ContextMenuItem onClick={onTogglePin}>
          {pinned ? (
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
        </ContextMenuItem>

        <ContextMenuItem onClick={onEdit}>
          <PencilIcon className="text-muted-foreground" />
          <span>Edit Board</span>
        </ContextMenuItem>

        <ContextMenuItem onClick={onShare}>
          {copiedBoardId === item.id ? (
            <>
              <CheckIcon className="text-emerald-500" />
              <span className="text-emerald-500">Link Copied!</span>
            </>
          ) : (
            <>
              <ShareIcon className="text-muted-foreground" />
              <span>Share Link</span>
            </>
          )}
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem variant="destructive" onClick={onDelete}>
          <Trash2Icon />
          <span>Delete Board</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
