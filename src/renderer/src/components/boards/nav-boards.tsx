import { useState, useRef, useEffect } from 'react'
import { DragDropProvider } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { arrayMove } from '@dnd-kit/helpers'
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
import { useUnpinnedBoards } from '@/hooks/use-boards'

export function NavBoards({ boards }: { boards?: Board[] } = {}) {
  const hookUnpinnedBoards = useUnpinnedBoards()
  const unpinnedBoards = boards ?? hookUnpinnedBoards
  const [items, setItems] = useState(unpinnedBoards)
  const itemsRef = useRef(items)
  itemsRef.current = items

  // Sync external changes into local sortable state
  useEffect(() => {
    setItems(unpinnedBoards)
  }, [unpinnedBoards])

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

  const renderBoardItem = (item: Board, index: number) => {
    return (
      <SortableBoardItem
        key={item.id}
        item={item}
        index={index}
        isCurrentPage={
          currentView.name === 'board-detail' && String(currentView.boardId) === String(item.id)
        }
        isMobile={isMobile}
        copiedBoardId={copiedBoardId}
        onNavigate={() => {
          if (item.id !== undefined) navigate({ name: 'board-detail', boardId: item.id })
        }}
        onTogglePin={(e) => handleTogglePin(e, item)}
        onEdit={() => setActiveBoardForEdit(item)}
        onShare={(e) => handleShare(e, item.id)}
        onDelete={() => setActiveBoardForDelete(item)}
        pinned={!!item.pinned}
      />
    )
  }

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Boards</SidebarGroupLabel>
        <DragDropProvider
          modifiers={[RestrictToVerticalAxis]}
          onDragOver={(event) => {
            const { source, target } = event.operation
            if (!source || !target) return
            const fromIndex = items.findIndex((b) => b.id === source.id)
            const toIndex = items.findIndex((b) => b.id === target.id)
            if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
              setItems((prev) => arrayMove(prev, fromIndex, toIndex))
            }
          }}
          onDragEnd={() => {
            useBoardsStore.getState().reorderBoards(itemsRef.current)
          }}
        >
          <SidebarMenu className="space-y-1">{items.map(renderBoardItem)}</SidebarMenu>
        </DragDropProvider>
      </SidebarGroup>

      {/* Edit Drawer from Sidebar */}
      <EditBoardDrawer
        board={activeBoardForEdit}
        open={!!activeBoardForEdit}
        onOpenChange={(open) => !open && setActiveBoardForEdit(null)}
      />

      {/* Delete Drawer from Sidebar */}
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

// ── Sortable item extracted for useSortable hook ──
function SortableBoardItem({
  item,
  index,
  isCurrentPage,
  isMobile,
  copiedBoardId,
  pinned,
  onNavigate,
  onTogglePin,
  onEdit,
  onShare,
  onDelete
}: {
  item: Board
  index: number
  isCurrentPage: boolean
  isMobile: boolean
  copiedBoardId: number | string | null
  pinned: boolean
  onNavigate: () => void
  onTogglePin: (e: React.MouseEvent) => void
  onEdit: () => void
  onShare: (e: React.MouseEvent) => void
  onDelete: () => void
}) {
  const { ref, handleRef, isDragSource } = useSortable({ id: item.id!, index })

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
