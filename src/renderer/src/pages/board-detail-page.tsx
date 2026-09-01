import { useEffect, useState, useMemo } from 'react'
import { useBreadcrumbs } from '@/stores/dynamic-breadcrumb'
import { useBoardsStore } from '@/stores/boards'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EditBoardDrawer } from '@/components/boards/edit-board-drawer'
import { DeleteBoardDrawer } from '@/components/boards/delete-board-drawer'
import { AlertCircle, Pencil, Trash2, Pin, PinOff } from 'lucide-react'
import { useNavigationStore } from '@/stores/navigation'
import { getBoardBackgroundStyleAndClass } from '@/lib/board-utils'
import { cn } from '@/lib/utils'

export function BoardDetailPage({ boardId }: { boardId: number | string }) {
  const navigate = useNavigationStore((s) => s.navigate)

  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

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
      setLoading(false)
    } else {
      import('@/services/boards').then(({ getBoardById }) =>
        getBoardById(boardId).then((data) => {
          if (!isCancelled) {
            setBoard(data)
            setLoading(false)
          }
        })
      )
    }

    // Stay in sync with store (optimistic updates from sidebar, etc.)
    const unsub = useBoardsStore.subscribe(
      (s) => s.boards,
      (boards) => {
        const updated = boards.find((b) => String(b.id) === String(boardId))
        if (updated) setBoard(updated)
      }
    )

    return () => {
      isCancelled = true
      unsub()
    }
  }, [boardId])

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between border-b pb-2.5">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-60" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>

        {/* Kanban Board Columns Skeleton */}
        <div className="relative flex-1 min-h-0 w-full overflow-hidden rounded-xl border bg-muted/10 p-4">
          <div className="grid h-full grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((col) => (
              <div key={col} className="flex flex-col rounded-xl border bg-card/60 p-3 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="size-5 rounded-full" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="rounded-lg border bg-background p-3 space-y-2">
                    <Skeleton className="h-3.5 w-3/4 rounded" />
                    <Skeleton className="h-2.5 w-1/2 rounded" />
                  </div>
                  <div className="rounded-lg border bg-background p-3 space-y-2">
                    <Skeleton className="h-3.5 w-4/5 rounded" />
                    <Skeleton className="h-2.5 w-2/3 rounded" />
                  </div>
                  {col !== 3 && (
                    <div className="rounded-lg border bg-background p-3 space-y-2">
                      <Skeleton className="h-3.5 w-2/3 rounded" />
                      <Skeleton className="h-2.5 w-1/3 rounded" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="size-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Board Not Found</h2>
        <p className="text-xs text-muted-foreground">
          The board you are looking for does not exist or has been deleted.
        </p>
        <Button size="sm" onClick={() => navigate({ name: 'boards' })} className="mt-2">
          Back to Boards
        </Button>
      </div>
    )
  }

  const bgProps = getBoardBackgroundStyleAndClass(board.background)

  const handleTogglePin = async () => {
    if (board.id === undefined) return
    const updated = await useBoardsStore.getState().updateBoard(board.id, { pinned: !board.pinned })
    if (updated) setBoard(updated)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      {/* Board Header & Controls */}
      <div className="flex items-center justify-between border-b pb-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-xl shadow-xs">
            {board.icon || '📋'}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight">{board.title}</h1>
            {board.description && (
              <p className="truncate text-xs text-muted-foreground">{board.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={handleTogglePin}
          >
            {board.pinned ? (
              <>
                <PinOff className="size-3.5" />
                <span>Unpin</span>
              </>
            ) : (
              <>
                <Pin className="size-3.5" />
                <span>Pin</span>
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setIsEditOpen(true)}
          >
            <Pencil className="size-3.5" />
            <span>Edit</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 className="size-3.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Board Content Area / Kanban with Custom Background */}
      <div
        className={cn(
          'relative flex-1 min-h-0 w-full overflow-hidden rounded-xl border bg-muted/20 p-4 transition-all',
          bgProps.className
        )}
        style={bgProps.style}
      >
        {/* Subtle overlay for legibility if background image is present */}
        {bgProps.isImage && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] pointer-events-none rounded-xl" />
        )}

        <div className="relative z-10 h-full w-full">
          {/* Kanban items container placeholder / future items */}
        </div>
      </div>

      {/* Edit Drawer */}
      <EditBoardDrawer
        board={board}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={(updated) => setBoard(updated)}
      />

      {/* Delete Drawer */}
      <DeleteBoardDrawer
        board={board}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onSuccess={() => navigate({ name: 'boards' })}
      />
    </div>
  )
}

export default BoardDetailPage
