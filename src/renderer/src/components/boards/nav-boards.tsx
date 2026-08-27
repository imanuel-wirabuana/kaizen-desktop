import { useState } from 'react'
import { DragDropProvider } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { arrayMove } from '@dnd-kit/helpers'
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
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar'
import {
  MoreHorizontalIcon,
  FolderIcon,
  PencilIcon,
  ShareIcon,
  Trash2Icon,
  CheckIcon,
  PinIcon,
  PinOffIcon
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

  // Sync external changes into local sortable state
  if (
    unpinnedBoards.length !== items.length ||
    unpinnedBoards.some((b, i) => b.id !== items[i]?.id || b.title !== items[i]?.title)
  ) {
    setItems(unpinnedBoards)
  }

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
            useBoardsStore.getState().reorderBoards(items)
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
  onDelete,
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
  const { ref, isDragSource } = useSortable({ id: item.id!, index })

  return (
    <SidebarMenuItem ref={ref} className={isDragSource ? 'opacity-50' : ''}>
      <SidebarMenuButton
        className="cursor-pointer"
        isActive={isCurrentPage}
        onClick={onNavigate}
      >
        <span>{item.icon || '📋'}</span>
        <span className="truncate">{item.title}</span>
      </SidebarMenuButton>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<SidebarMenuAction showOnHover className="aria-expanded:bg-muted" />}
        >
          <MoreHorizontalIcon />
          <span className="sr-only">More options for {item.title}</span>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-48"
          side={isMobile ? 'bottom' : 'right'}
          align={isMobile ? 'end' : 'start'}
        >
          <DropdownMenuItem onClick={onNavigate}>
            <FolderIcon className="text-muted-foreground" />
            <span>View Board</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={onTogglePin}>
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
          </DropdownMenuItem>

          <DropdownMenuItem onClick={onEdit}>
            <PencilIcon className="text-muted-foreground" />
            <span>Edit Board</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={onShare}>
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
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={onDelete}
          >
            <Trash2Icon className="text-destructive" />
            <span>Delete Board</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}
