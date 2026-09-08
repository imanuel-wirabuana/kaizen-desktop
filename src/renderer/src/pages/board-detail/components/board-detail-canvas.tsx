import { Skeleton } from '@/components/ui/skeleton'
import { LaneColumn, InlineCreateLane } from '@/components/lanes'
import { getBoardBackgroundStyleAndClass } from '@/lib/board-utils'
import { cn } from '@/lib/utils'

export interface BoardDetailCanvasProps {
  boardId: number | string
  board: Board
  canvasLanes: Lane[]
  lanesLoading: boolean
  isReadOnly: boolean
  canEdit: boolean
}

export function BoardDetailCanvas({
  boardId,
  board,
  canvasLanes,
  lanesLoading,
  isReadOnly,
  canEdit
}: BoardDetailCanvasProps) {
  const bgProps = getBoardBackgroundStyleAndClass(board.background)

  return (
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
  )
}
