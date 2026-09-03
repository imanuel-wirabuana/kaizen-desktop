import { useEffect, useState, useMemo } from 'react'
import { useBreadcrumbs } from '@/stores/dynamic-breadcrumb'
import { useBoardsStore } from '@/stores/boards'
import { useLanesStore, selectLanes, selectLanesLoading } from '@/stores/lanes'
import { useItemsStore, selectItems } from '@/stores/items'
import { useDraftSidebarStore } from '@/stores/draft-sidebar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EditBoardDrawer } from '@/components/boards/edit-board-drawer'
import { DeleteBoardDrawer } from '@/components/boards/delete-board-drawer'
import { ShareBoardModal } from '@/components/boards/share-board-modal'
import { LaneColumn, InlineCreateLane } from '@/components/lanes'
import { DraftSidebar } from '@/components/items'
import { getUserBoardPermission, subscribeBoardMembers } from '@/services/members'
import { useUser } from '@/providers/auth-provider'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
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
  AlertCircle,
  Inbox,
  Pencil,
  Trash2,
  MoreHorizontal,
  Pin,
  PinOff,
  Share2,
  Check,
  Eye,
  UserCheck
} from 'lucide-react'
import { useNavigationStore } from '@/stores/navigation'
import { onSyncEvent } from '@/lib/realtime'
import { supabase } from '@/lib/supabase'
import { getBoardBackgroundStyleAndClass } from '@/lib/board-utils'
import { cn } from '@/lib/utils'

export function BoardDetailPage({ boardId }: { boardId: number | string }) {
  const navigate = useNavigationStore((s) => s.navigate)
  const { user } = useUser()

  const [board, setBoard] = useState<Board | null>(null)
  const [permissionRole, setPermissionRole] = useState<'owner' | 'edit' | 'view' | null>('owner')
  const [loading, setLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const updateBoard = useBoardsStore((s) => s.updateBoard)
  const [copiedLink, setCopiedLink] = useState(false)

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  // Draft Sidebar store state
  const isDraftOpen = useDraftSidebarStore((s) => s.isOpen)
  const toggleDraftSidebar = useDraftSidebarStore((s) => s.toggle)
  const closeDraftSidebar = useDraftSidebarStore((s) => s.close)

  // Lanes and Items stores
  const lanes = useLanesStore(selectLanes)
  const lanesLoading = useLanesStore(selectLanesLoading)
  const items = useItemsStore(selectItems)

  // Filter canvas lanes (real user lanes with non-null id)
  const canvasLanes = useMemo(() => lanes.filter((l) => l.id !== null), [lanes])

  // Count items in Draft (lane_id === null)
  const draftItemsCount = useMemo(() => items.filter((i) => i.lane_id === null).length, [items])

  // Declarative breadcrumb synchronization
  const breadcrumbItems = useMemo(() => {
    if (!board) return undefined
    return [
      { label: 'Boards', view: { name: 'boards' as const } },
      { label: `${board.icon || '📋'} ${board.title || 'Untitled Board'}` }
    ]
  }, [board])

  useBreadcrumbs(breadcrumbItems)

  useEffect(() => {
    let isCancelled = false
    setLoading(true)

    // Try store first (optimistic), fall back to service
    const fromStore = useBoardsStore.getState().boards.find((b) => String(b.id) === String(boardId))
    if (fromStore) {
      setBoard(fromStore)
      if (fromStore.role) {
        setPermissionRole(fromStore.role)
      } else if (user?.id && fromStore.owner === user.id) {
        setPermissionRole('owner')
      }
      setLoading(false)
    } else {
      import('@/services/boards').then(({ getBoardById }) =>
        getBoardById(boardId).then((data) => {
          if (!isCancelled) {
            setBoard(data)
            if (data?.role) {
              setPermissionRole(data.role)
            } else if (user?.id && data?.owner === user.id) {
              setPermissionRole('owner')
            }
            setLoading(false)
          }
        })
      )
    }

    const checkPermission = () => {
      if (user?.id) {
        getUserBoardPermission(boardId, user.id).then((role) => {
          if (!isCancelled) {
            setPermissionRole(role)
          }
        })
      }
    }

    // Also fetch exact user permission from DB if user present
    checkPermission()

    // Initialize lanes and items stores for this board
    useLanesStore.getState().init(boardId)
    useItemsStore.getState().init(boardId)

    // Stay in sync with boards store
    const unsub = useBoardsStore.subscribe(
      (s) => s.boards,
      (boards) => {
        const updated = boards.find((b) => String(b.id) === String(boardId))
        if (updated) {
          setBoard(updated)
          if (updated.role) setPermissionRole(updated.role)
        }
      }
    )

    // Real-time member table Postgres subscription
    const memChannel = subscribeBoardMembers(boardId, () => {
      checkPermission()
    })

    // Real-time broadcast sync event listener (<50ms delivery)
    const unsubBroadcast = onSyncEvent((event) => {
      if (event === 'members' || event === 'boards') {
        checkPermission()
      }
    })

    return () => {
      isCancelled = true
      unsub()
      supabase.removeChannel(memChannel)
      unsubBroadcast()
      closeDraftSidebar()
      useLanesStore.getState().cleanup()
      useItemsStore.getState().cleanup()
    }
  }, [boardId, user?.id, closeDraftSidebar])

  const isOwner = permissionRole === 'owner'
  const isReadOnly = permissionRole === 'view'
  const canEdit = permissionRole === 'owner' || permissionRole === 'edit'

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-xl shrink-0" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-44 rounded-lg" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-64 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-xl" />
            <Skeleton className="h-8 size-8 rounded-xl" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
        </div>

        {/* Kanban Board Canvas Area Skeleton */}
        <div className="relative flex-1 min-h-0 w-full overflow-hidden rounded-2xl border bg-muted/20 p-3">
          <div className="flex h-full gap-4 items-start overflow-x-auto pb-2">
            {[1, 2, 3, 4].map((col) => (
              <div
                key={col}
                className="flex h-fit max-h-full w-72 shrink-0 flex-col rounded-2xl border bg-card/90 p-3 space-y-3 shadow-2xs"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-3.5 rounded-full shrink-0" />
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-4 w-6 rounded-full" />
                  </div>
                  <Skeleton className="size-5 rounded-md" />
                </div>
                {/* Cards List */}
                <div className="space-y-2.5 flex-1 min-h-[140px]">
                  <div className="rounded-xl border bg-background p-3 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3.5 w-14 rounded-full" />
                      <Skeleton className="size-4 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-4/5 rounded-md" />
                    <Skeleton className="h-3 w-3/5 rounded-md" />
                    <div className="flex items-center justify-between pt-1">
                      <Skeleton className="h-3 w-16 rounded-md" />
                      <Skeleton className="size-5 rounded-full" />
                    </div>
                  </div>
                  <div className="rounded-xl border bg-background p-3 space-y-2.5 shadow-2xs">
                    <Skeleton className="h-4 w-3/4 rounded-md" />
                    <div className="flex items-center justify-between pt-1">
                      <Skeleton className="h-3 w-12 rounded-md" />
                      <Skeleton className="size-5 rounded-full" />
                    </div>
                  </div>
                </div>
                {/* Footer Button Skeleton */}
                <div className="pt-1 border-t">
                  <Skeleton className="h-8 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!board || permissionRole === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="size-10 text-destructive/80" />
        <h2 className="text-lg font-semibold">Access Revoked or Board Not Found</h2>
        <p className="text-xs text-muted-foreground max-w-sm">
          You no longer have permission to access this board, or the board has been deleted by its owner.
        </p>
        <Button size="sm" onClick={() => navigate({ name: 'boards' })} className="mt-2">
          Back to Boards
        </Button>
      </div>
    )
  }

  const bgProps = getBoardBackgroundStyleAndClass(board.background)

  return (
    <div className="flex h-full pb-2 min-h-0 flex-col gap-3 overflow-hidden">
      {/* Board Header Bar with Right-click Context Menu */}
      <ContextMenu>
        <ContextMenuTrigger
          render={
            <div className="flex items-center justify-between gap-3 px-1 py-0.5 select-none">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-8 items-center justify-center rounded-xl border bg-background text-base shadow-2xs shrink-0">
                  {board.icon || '📋'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm font-bold tracking-tight text-foreground truncate">
                      {board.title || 'Untitled Board'}
                    </h1>
                    {isReadOnly && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <Eye className="size-3" /> View Only
                      </span>
                    )}
                    {permissionRole === 'edit' && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <UserCheck className="size-3" /> Edit Access
                      </span>
                    )}
                  </div>
                  {board.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {board.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Top Right Header Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Share Board Action (Owner only) */}
                {isOwner && (
                  <Button
                    size="sm"
                    onClick={() => setIsShareOpen(true)}
                    className="h-8 gap-1.5 rounded-xl text-xs font-semibold shadow-2xs cursor-pointer"
                  >
                    <Share2 className="size-3.5" />
                    <span>Share</span>
                  </Button>
                )}

                {/* Board Options Dropdown Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 size-8 p-0 rounded-xl text-muted-foreground hover:text-foreground"
                        title="Board options"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-48 text-xs shadow-xl">
                    <DropdownMenuItem
                      onClick={() => updateBoard(board.id!, { pinned: !board.pinned })}
                    >
                      {board.pinned ? (
                        <>
                          <PinOff className="mr-2 size-3.5 text-muted-foreground" />
                          <span>Unpin Board</span>
                        </>
                      ) : (
                        <>
                          <Pin className="mr-2 size-3.5 text-muted-foreground" />
                          <span>Pin Board</span>
                        </>
                      )}
                    </DropdownMenuItem>

                    {canEdit && (
                      <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                        <Pencil className="mr-2 size-3.5 text-muted-foreground" />
                        <span>Edit Board</span>
                      </DropdownMenuItem>
                    )}

                    {isOwner && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setIsDeleteOpen(true)}
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        >
                          <Trash2 className="mr-2 size-3.5" />
                          <span>Delete Board</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Draft Sidebar Toggle Button */}
                <Button
                  variant={isDraftOpen ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={toggleDraftSidebar}
                  className="h-8 gap-1.5 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  title={isDraftOpen ? 'Close Draft Sidebar' : 'Open Draft Sidebar'}
                >
                  <Inbox
                    className={cn(
                      'size-3.5',
                      isDraftOpen ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  <span>Drafts</span>
                  {draftItemsCount > 0 && (
                    <span className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                      {draftItemsCount}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          }
        />

        {/* Right-click Context Menu */}
        <ContextMenuContent className="w-48 text-xs shadow-xl">
          <ContextMenuItem onClick={() => updateBoard(board.id!, { pinned: !board.pinned })}>
            {board.pinned ? (
              <>
                <PinOff className="mr-2 size-3.5 text-muted-foreground" />
                <span>Unpin Board</span>
              </>
            ) : (
              <>
                <Pin className="mr-2 size-3.5 text-muted-foreground" />
                <span>Pin Board</span>
              </>
            )}
          </ContextMenuItem>

          {canEdit && (
            <ContextMenuItem onClick={() => setIsEditOpen(true)}>
              <Pencil className="mr-2 size-3.5 text-muted-foreground" />
              <span>Edit Board</span>
            </ContextMenuItem>
          )}

          <ContextMenuSeparator />

          {isOwner && (
            <ContextMenuItem
              onClick={() => setIsDeleteOpen(true)}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <Trash2 className="mr-2 size-3.5" />
              <span>Delete Board</span>
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Canvas & Right Draft Sidebar Area (Same level under Board Header) */}
      <div className="flex flex-1 min-h-0 w-full gap-3 overflow-hidden">
        {/* Main Kanban Canvas */}
        <div
          className={cn(
            'relative flex-1 min-h-0 w-full overflow-hidden rounded-2xl border bg-muted/20 p-2 transition-all flex gap-3',
            bgProps.className
          )}
          style={bgProps.style}
        >
          {/* Overlay for background images */}
          {bgProps.isImage && (
            <div className="absolute inset-0 bg-background/30 pointer-events-none rounded-2xl" />
          )}

          {lanesLoading ? (
            <div className="flex h-full gap-4 items-start pb-2">
              {[1, 2, 3].map((col) => (
                <div
                  key={col}
                  className="flex h-fit max-h-full w-72 shrink-0 flex-col rounded-2xl border bg-card/90 p-3 space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div className="flex items-center gap-2">
                      <Skeleton className="size-3.5 rounded-full shrink-0" />
                      <Skeleton className="h-4 w-28 rounded-md" />
                      <Skeleton className="h-4 w-6 rounded-full" />
                    </div>
                    <Skeleton className="size-5 rounded-md" />
                  </div>
                  <div className="space-y-2.5 flex-1 min-h-[140px]">
                    <div className="rounded-xl border bg-background p-3 space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-3.5 w-14 rounded-full" />
                        <Skeleton className="size-4 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-4/5 rounded-md" />
                      <Skeleton className="h-3 w-3/5 rounded-md" />
                      <div className="flex items-center justify-between pt-1">
                        <Skeleton className="h-3 w-16 rounded-md" />
                        <Skeleton className="size-5 rounded-full" />
                      </div>
                    </div>
                    <div className="rounded-xl border bg-background p-3 space-y-2.5 shadow-2xs">
                      <Skeleton className="h-4 w-3/4 rounded-md" />
                      <div className="flex items-center justify-between pt-1">
                        <Skeleton className="h-3 w-12 rounded-md" />
                        <Skeleton className="size-5 rounded-full" />
                      </div>
                    </div>
                  </div>
                  <div className="pt-1 border-t">
                    <Skeleton className="h-8 w-full rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative z-10 h-full flex-1 min-w-0 overflow-x-auto overflow-y-hidden">
              <div className="flex h-full items-start gap-4 pb-2 min-w-max">
                {canvasLanes.map((lane, index) => (
                  <LaneColumn
                    key={lane.id!}
                    lane={lane}
                    index={index}
                    totalLanes={canvasLanes.length}
                    readOnly={isReadOnly}
                  />
                ))}

                {/* Inline Create Lane Card (only for owners & editors) */}
                {canEdit && <InlineCreateLane boardId={boardId} />}
              </div>
            </div>
          )}
        </div>

        {/* Right Draft Sidebar (Same level as Canvas) */}
        <DraftSidebar />
      </div>

      {/* Edit Board Drawer */}
      <EditBoardDrawer
        board={board}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={(updated) => setBoard(updated)}
      />

      {/* Delete Board Drawer */}
      <DeleteBoardDrawer
        board={board}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onSuccess={() => navigate({ name: 'boards' })}
      />

      {/* Share Board Modal */}
      <ShareBoardModal board={board} open={isShareOpen} onOpenChange={setIsShareOpen} />
    </div>
  )
}

export default BoardDetailPage
