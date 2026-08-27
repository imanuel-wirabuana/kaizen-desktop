import { useState } from 'react'
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

  const renderBoardItem = (item: Board) => {
    const isCurrentPage =
      currentView.name === 'board-detail' && String(currentView.boardId) === String(item.id)

    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          className="cursor-pointer"
          isActive={isCurrentPage}
          onClick={() => {
            if (item.id !== undefined) {
              navigate({ name: 'board-detail', boardId: item.id })
            }
          }}
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
            <DropdownMenuItem
              onClick={() => {
                if (item.id !== undefined) {
                  navigate({ name: 'board-detail', boardId: item.id })
                }
              }}
            >
              <FolderIcon className="text-muted-foreground" />
              <span>View Board</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={(e) => handleTogglePin(e, item)}>
              {item.pinned ? (
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

            <DropdownMenuItem onClick={() => setActiveBoardForEdit(item)}>
              <PencilIcon className="text-muted-foreground" />
              <span>Edit Board</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={(e) => handleShare(e, item.id)}>
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
              onClick={() => setActiveBoardForDelete(item)}
            >
              <Trash2Icon className="text-destructive" />
              <span>Delete Board</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    )
  }

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Boards</SidebarGroupLabel>
        <SidebarMenu className="space-y-1">{unpinnedBoards.map(renderBoardItem)}</SidebarMenu>
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
