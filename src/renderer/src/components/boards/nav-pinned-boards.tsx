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
  PinOffIcon,
  PinIcon
} from 'lucide-react'
import { EditBoardDrawer } from './edit-board-drawer'
import { DeleteBoardDrawer } from './delete-board-drawer'
import { useBoardsStore } from '@/stores/boards'
import { useNavigationStore } from '@/stores/navigation'
import { usePinnedBoards } from '@/hooks/use-boards'

export function NavPinnedBoards({ boards }: { boards?: Board[] } = {}) {
  const hookPinnedBoards = usePinnedBoards()
  const pinnedBoards = boards ?? hookPinnedBoards

  const { isMobile } = useSidebar()
  const { currentView, navigate } = useNavigationStore()

  const [activeBoardForEdit, setActiveBoardForEdit] = useState<Board | null>(null)
  const [activeBoardForDelete, setActiveBoardForDelete] = useState<Board | null>(null)
  const [copiedBoardId, setCopiedBoardId] = useState<number | string | null>(null)

  if (pinnedBoards.length === 0) {
    return null
  }

  const handleUnpin = async (e: React.MouseEvent, item: Board) => {
    e.preventDefault()
    e.stopPropagation()
    if (item.id === undefined) return
    await useBoardsStore.getState().updateBoard(item.id, { pinned: false })
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
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="flex items-center gap-1.5">Pinned</SidebarGroupLabel>
        <SidebarMenu className="space-y-1">
          {pinnedBoards.map((item) => {
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

                    <DropdownMenuItem onClick={(e) => handleUnpin(e, item)}>
                      <PinOffIcon className="text-muted-foreground" />
                      <span>Unpin Board</span>
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
          })}
        </SidebarMenu>
      </SidebarGroup>

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
