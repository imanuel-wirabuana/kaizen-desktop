import { useEffect, useState, useMemo } from 'react'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { RestrictToHorizontalAxis } from '@dnd-kit/abstract/modifiers'
import { useBreadcrumbs } from '@/stores/dynamic-breadcrumb'
import { useBoardsStore } from '@/stores/boards'
import { useLanesStore, selectLanes, selectLanesLoading } from '@/stores/lanes'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EditBoardDrawer } from '@/components/boards/edit-board-drawer'
import { DeleteBoardDrawer } from '@/components/boards/delete-board-drawer'
import { LaneColumn, LaneColumnPreview, InlineCreateLane } from '@/components/lanes'
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

  // Lanes store state
  const lanes = useLanesStore(selectLanes)
  const lanesLoading = useLanesStore(selectLanesLoading)

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

    // Initialize lanes store for this board
    useLanesStore.getState().init(boardId)

    // Stay in sync with boards store
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
      useLanesStore.getState().cleanup()
    }
  }, [boardId])

  // Drag and drop column reordering handler
  const handleDragEnd = (event: any) => {
    const { source, target } = event.operation || {}
    if (!source || !target || source.id === target.id) return

    const currentLanes = [...lanes]
    const oldIndex = currentLanes.findIndex((l) => String(l.id) === String(source.id))
    const newIndex = currentLanes.findIndex((l) => String(l.id) === String(target.id))

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const reordered = [...currentLanes]
      const [moved] = reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, moved)
      useLanesStore.getState().reorderLanes(reordered)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-44 rounded-lg" />
              <Skeleton className="h-3.5 w-64 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-xl" />
            <Skeleton className="h-8 w-20 rounded-xl" />
            <Skeleton className="h-8 w-20 rounded-xl" />
          </div>
        </div>

        {/* Kanban Board Canvas Area Skeleton */}
        <div className="relative flex-1 min-h-0 w-full overflow-hidden rounded-2xl border bg-muted/20 p-4">
          <div className="flex h-full gap-4 items-start overflow-x-auto pb-2">
            {[1, 2, 3].map((col) => (
              <div
                key={col}
                className="flex h-fit max-h-full w-72 shrink-0 flex-col rounded-2xl border bg-card/90 p-3.5 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between pb-2.5 border-b">
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-4 rounded" />
                    <Skeleton className="h-4 w-28 rounded-md" />
                  </div>
                  <Skeleton className="size-5 rounded-full" />
                </div>
                <div className="space-y-2.5 flex-1 min-h-[120px]">
                  <div className="rounded-xl border bg-background/80 p-3 space-y-2">
                    <Skeleton className="h-3.5 w-3/4 rounded-md" />
                    <Skeleton className="h-2.5 w-1/2 rounded-md" />
                  </div>
                  <div className="rounded-xl border bg-background/80 p-3 space-y-2">
                    <Skeleton className="h-3.5 w-4/5 rounded-md" />
                    <Skeleton className="h-2.5 w-2/3 rounded-md" />
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <Skeleton className="h-8 w-full rounded-xl" />
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
    <div className="flex h-full pb-2 min-h-0 flex-col gap-3 overflow-hidden">
      {/* Board Content Area / Kanban Lanes Canvas */}
      <div
        className={cn(
          'relative flex-1 min-h-0 w-full overflow-hidden rounded-2xl border bg-muted/20 p-2 transition-all',
          bgProps.className
        )}
        style={bgProps.style}
      >
        {/* Overlay for background images */}
        {bgProps.isImage && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] pointer-events-none rounded-2xl" />
        )}

        <div className="relative z-10 h-full w-full overflow-x-auto overflow-y-hidden">
          {lanesLoading ? (
            <div className="flex h-full gap-4 items-start pb-2">
              {[1, 2, 3].map((col) => (
                <div
                  key={col}
                  className="flex h-fit max-h-full w-72 shrink-0 flex-col rounded-2xl border bg-card/90 p-3.5 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between pb-2.5 border-b">
                    <div className="flex items-center gap-2">
                      <Skeleton className="size-4 rounded" />
                      <Skeleton className="h-4 w-28 rounded-md" />
                    </div>
                    <Skeleton className="size-5 rounded-full" />
                  </div>
                  <div className="space-y-2.5 flex-1 min-h-[120px]">
                    <div className="rounded-xl border bg-background/80 p-3 space-y-2">
                      <Skeleton className="h-3.5 w-3/4 rounded-md" />
                      <Skeleton className="h-2.5 w-1/2 rounded-md" />
                    </div>
                    <div className="rounded-xl border bg-background/80 p-3 space-y-2">
                      <Skeleton className="h-3.5 w-4/5 rounded-md" />
                      <Skeleton className="h-2.5 w-2/3 rounded-md" />
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <Skeleton className="h-8 w-full rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <DragDropProvider modifiers={[RestrictToHorizontalAxis]} onDragEnd={handleDragEnd}>
              <div className="flex h-full items-start gap-4 pb-2 min-w-max">
                {lanes.map((lane, index) => (
                  <LaneColumn key={lane.id} lane={lane} index={index} totalLanes={lanes.length} />
                ))}

                {/* Inline Create Lane Card */}
                <InlineCreateLane boardId={boardId} />
              </div>

              <DragOverlay>
                {(source) => {
                  if (!source || source.type !== 'lane') return null
                  const activeLane = lanes.find((l) => String(l.id) === String(source.id))
                  if (!activeLane) return null
                  const width = source.element
                    ? source.element.getBoundingClientRect().width
                    : undefined
                  return (
                    <div style={{ width: width ? `${width}px` : undefined }}>
                      <LaneColumnPreview lane={activeLane} />
                    </div>
                  )
                }}
              </DragOverlay>
            </DragDropProvider>
          )}
        </div>
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
    </div>
  )
}

export default BoardDetailPage
