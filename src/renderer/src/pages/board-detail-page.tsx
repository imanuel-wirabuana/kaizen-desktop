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
import { LeaveBoardDrawer } from '@/components/boards/leave-board-drawer'
import { ShareBoardModal } from '@/components/boards/share-board-modal'
import { ExportBoardModal } from '@/components/boards/export-board-modal'
import { ImportBoardModal } from '@/components/boards/import-board-modal'
import { LaneColumn, InlineCreateLane } from '@/components/lanes'
import { DraftSidebar } from '@/components/items'
import { getUserBoardPermission, subscribeBoardMembers } from '@/services/members'
import { useUser } from '@/providers/auth-provider'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent
} from '@/components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
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
  UserCheck,
  Copy,
  CopyPlus,
  Layers,
  Clock,
  Download,
  Upload
} from 'lucide-react'
import { BoardMenuContent } from '@/components/menus/board-menu-content'
import { useNavigationStore } from '@/stores/navigation'
import { onSyncEvent } from '@/lib/realtime'
import { supabase } from '@/lib/supabase'
import { getBoardBackgroundStyleAndClass } from '@/lib/board-utils'
import { cn } from '@/lib/utils'

function formatLastActivity(dateStr?: string | null): string {
  if (!dateStr) return 'No recent activity'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 'No recent activity'
  const diffMs = Date.now() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  if (diffSecs < 15) return 'Just now'
  if (diffSecs < 60) return `${diffSecs}s ago`
  const diffMins = Math.floor(diffSecs / 60)
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function BoardDetailPage({ boardId }: { boardId: number | string }) {
  const navigate = useNavigationStore((s) => s.navigate)
  const { user } = useUser()

  const [board, setBoard] = useState<Board | null>(null)
  const [permissionRole, setPermissionRole] = useState<'owner' | 'edit' | 'view' | null>('owner')
  const [loading, setLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isLeaveOpen, setIsLeaveOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
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
  const allLanes = useLanesStore(selectLanes)
  const lanesLoading = useLanesStore(selectLanesLoading)
  const allItems = useItemsStore(selectItems)

  // Strictly scope lanes and items to current boardId to prevent cross-board leaks
  const lanes = useMemo(
    () => allLanes.filter((l) => String(l.board_id) === String(boardId)),
    [allLanes, boardId]
  )
  const items = useMemo(
    () => allItems.filter((i) => String(i.board_id) === String(boardId)),
    [allItems, boardId]
  )

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
          setBoard((prev) => {
            if (!prev) return updated
            // Skip re-rendering parent page if only last_activity or updated_at changed
            if (
              prev.title !== updated.title ||
              prev.icon !== updated.icon ||
              prev.description !== updated.description ||
              prev.background !== updated.background ||
              prev.owner !== updated.owner ||
              prev.role !== updated.role
            ) {
              return updated
            }
            return prev
          })
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
      if (event === 'members') {
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
      <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between border-b pb-2 px-0.5">
          <div className="flex items-center gap-2">
            <Skeleton className="size-7 rounded-lg shrink-0" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-36 rounded-md" />
              <Skeleton className="h-3.5 w-14 rounded-full" />
              <Skeleton className="h-3 w-24 rounded-md hidden sm:block" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-7 w-16 rounded-lg" />
            <Skeleton className="h-7 size-7 rounded-lg" />
            <Skeleton className="h-7 w-20 rounded-lg" />
          </div>
        </div>

        {/* Kanban Board Canvas Area Skeleton */}
        <div className="relative flex-1 min-h-0 w-full overflow-hidden rounded-2xl border bg-muted/20 p-3">
          <div className="flex h-full gap-4 items-start overflow-x-auto pb-2">
            {[1, 2, 3, 4].map((col) => (
              <div
                key={col}
                className="flex h-fit max-h-full w-72 shrink-0 flex-col rounded-lg border bg-card/90 p-3 space-y-3 shadow-2xs"
              >
                {/* Column Header */}
                <div className="flex h-14 shrink-0 items-center justify-between pb-2 border-b">
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
    <div className="flex h-full pb-2 min-h-0 flex-col gap-2 overflow-hidden">
      {/* Board Header Bar with Right-click Context Menu */}
      <ContextMenu>
        <ContextMenuTrigger
          render={
            <div className="flex items-center justify-between gap-2.5 px-0.5 py-0 select-none">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex size-7 items-center justify-center rounded-lg border bg-background text-sm shadow-2xs shrink-0">
                  {board.icon || '📋'}
                </div>
                <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                  <h1 className="text-xs sm:text-sm font-bold tracking-tight text-foreground truncate shrink-0">
                    {board.title || 'Untitled Board'}
                  </h1>
                  {isReadOnly && (
                    <span className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                      <Eye className="size-2.5" /> View Only
                    </span>
                  )}
                  {permissionRole === 'edit' && (
                    <span className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                      <UserCheck className="size-2.5" /> Edit Access
                    </span>
                  )}
                  {board.description && (
                    <>
                      <span className="size-1 rounded-full bg-muted-foreground/30 shrink-0 hidden md:inline-block" />
                      <p className="text-[11px] text-muted-foreground truncate max-w-[240px] hidden md:inline-block">
                        {board.description}
                      </p>
                    </>
                  )}
                  <span className="size-1 rounded-full bg-muted-foreground/30 shrink-0 hidden sm:inline-block" />
                  <span
                    className="inline-flex items-center gap-1 text-[9.5px] font-medium text-muted-foreground/80 shrink-0 bg-muted/40 px-1.5 py-0.2 rounded-md border border-border/40"
                    title={board.last_activity ? `Last activity: ${new Date(board.last_activity).toLocaleString()}` : 'No activity recorded'}
                  >
                    <Clock className="size-2.5 text-muted-foreground/70" />
                    <span>{formatLastActivity(board.last_activity || board.updated_at)}</span>
                  </span>
                </div>
              </div>

              {/* Top Right Header Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Share Board Action (Owner only) */}
                {isOwner && (
                  <Button
                    size="sm"
                    onClick={() => setIsShareOpen(true)}
                    className="h-7 gap-1 px-2.5 rounded-lg text-xs font-semibold shadow-2xs cursor-pointer"
                  >
                    <Share2 className="size-3" />
                    <span>Share</span>
                  </Button>
                )}

                {/* Export Board Button */}
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsExportOpen(true)}
                    className="h-7 gap-1 px-2.5 rounded-lg text-xs font-semibold shadow-2xs cursor-pointer"
                    title="Export Board to JSON or CSV"
                  >
                    <Upload className="size-3 text-muted-foreground" />
                    <span>Export</span>
                  </Button>
                )}

                {/* Import Content Button */}
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsImportOpen(true)}
                    className="h-7 gap-1 px-2.5 rounded-lg text-xs font-semibold shadow-2xs cursor-pointer"
                    title="Import Content into Board"
                  >
                    <Download className="size-3 text-muted-foreground" />
                    <span>Import</span>
                  </Button>
                )}

                {/* Board Options Dropdown Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 size-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                        title="Board options"
                      >
                        <MoreHorizontal className="size-3.5" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-48 text-xs shadow-xl">
                    <BoardMenuContent
                      board={board}
                      variant="dropdown"
                      isOwner={isOwner}
                      canEdit={canEdit}
                      onEdit={() => setIsEditOpen(true)}
                      onDelete={() => setIsDeleteOpen(true)}
                      onLeave={() => setIsLeaveOpen(true)}
                      onExport={() => setIsExportOpen(true)}
                      onImport={() => setIsImportOpen(true)}
                    />
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Draft Sidebar Toggle Button */}
                <Button
                  variant={isDraftOpen ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={toggleDraftSidebar}
                  className="h-7 gap-1 px-2.5 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
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
                    <span className="flex h-3.5 min-w-[14px] px-1 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
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
          <BoardMenuContent
            board={board}
            variant="context"
            isOwner={isOwner}
            canEdit={canEdit}
            onEdit={() => setIsEditOpen(true)}
            onDelete={() => setIsDeleteOpen(true)}
            onLeave={() => setIsLeaveOpen(true)}
            onExport={() => setIsExportOpen(true)}
            onImport={() => setIsImportOpen(true)}
          />
        </ContextMenuContent>
      </ContextMenu>

      {/* Canvas & Right Draft Sidebar Area (Same level under Board Header) */}
      <div className="flex flex-1 min-h-0 w-full gap-3 overflow-hidden">
        {/* Main Kanban Canvas */}
        <div
          className={cn(
            'relative flex-1 min-h-0 w-full overflow-hidden rounded-2xl border bg-muted/20 p-2 transition-colors flex gap-3',
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
                  className="flex h-fit max-h-full w-72 shrink-0 flex-col rounded-lg border bg-card/90 p-3 space-y-3 shadow-2xs"
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

      {/* Leave Board Drawer */}
      <LeaveBoardDrawer
        board={board}
        open={isLeaveOpen}
        onOpenChange={setIsLeaveOpen}
        onSuccess={() => navigate({ name: 'boards' })}
      />

      {/* Export Board Modal */}
      <ExportBoardModal
        board={board}
        lanes={lanes}
        items={allItems}
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
      />

      {/* Import Content Modal */}
      <ImportBoardModal
        board={board}
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={() => {
          if (boardId) {
            useLanesStore.getState().refreshLanes(boardId)
            useItemsStore.getState().refreshItems(boardId)
          }
        }}
      />

      {/* Share Board Modal */}
      <ShareBoardModal board={board} open={isShareOpen} onOpenChange={setIsShareOpen} />
    </div>
  )
}

export default BoardDetailPage
