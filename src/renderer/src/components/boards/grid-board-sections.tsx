import { useDroppable } from '@dnd-kit/react'
import { CollisionPriority } from '@dnd-kit/abstract'
import { Pin, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SortableGridBoardCard, CreateBoardTile } from './grid-board-card'

export type BoardGridSectionProps = {
  items: Board[]
  copiedId: number | string | null
  onNavigate: (id: number | string) => void
  onTogglePin: (e: React.MouseEvent, board: Board) => void
  onEdit: (board: Board) => void
  onShare: (e: React.MouseEvent, id?: number | string) => void
  onDelete: (board: Board) => void
  onLeave?: (board: Board) => void
}

// ── Droppable Pinned Grid Section ──
export function PinnedGridSection({
  items,
  copiedId,
  onNavigate,
  onTogglePin,
  onEdit,
  onShare,
  onDelete,
  onLeave
}: BoardGridSectionProps) {
  const { isDropTarget, ref } = useDroppable({
    id: 'pinned',
    type: 'column',
    accept: 'board',
    collisionPriority: CollisionPriority.Low
  })

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
        <Pin className="size-3.5 text-primary fill-primary/20" />
        <span>Pinned</span>
        <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-normal text-muted-foreground">
          {items.length}
        </span>
      </div>

      <div
        ref={ref}
        className={cn(
          'min-h-[70px] rounded-xl p-1.5 transition-colors',
          isDropTarget ? 'bg-accent/40 ring-1 ring-accent-foreground/20' : ''
        )}
      >
        {items.length === 0 ? (
          <div className="flex h-16 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground/60 bg-muted/5">
            Drag a board here to pin
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((board, index) => (
              <SortableGridBoardCard
                key={board.id}
                board={board}
                index={index}
                group="pinned"
                copiedId={copiedId}
                onNavigate={() => board.id !== undefined && onNavigate(board.id)}
                onTogglePin={(e) => onTogglePin(e, board)}
                onEdit={() => onEdit(board)}
                onShare={(e) => onShare(e, board.id)}
                onDelete={() => onDelete(board)}
                onLeave={() => onLeave && onLeave(board)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Droppable Unpinned Grid Section ──
export function UnpinnedGridSection({
  items,
  copiedId,
  onNavigate,
  onTogglePin,
  onEdit,
  onShare,
  onDelete,
  onLeave,
  onCreateClick
}: BoardGridSectionProps & { onCreateClick: () => void }) {
  const { isDropTarget, ref } = useDroppable({
    id: 'unpinned',
    type: 'column',
    accept: 'board',
    collisionPriority: CollisionPriority.Low
  })

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
        <FolderOpen className="size-3.5 text-muted-foreground" />
        <span>All Boards</span>
        <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-normal text-muted-foreground">
          {items.length}
        </span>
      </div>

      <div
        ref={ref}
        className={cn(
          'min-h-[70px] rounded-xl p-1.5 transition-colors',
          isDropTarget ? 'bg-accent/40 ring-1 ring-accent-foreground/20' : ''
        )}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Quick Create Board Tile */}
          <CreateBoardTile onClick={onCreateClick} />

          {items.map((board, index) => (
            <SortableGridBoardCard
              key={board.id}
              board={board}
              index={index}
              group="unpinned"
              copiedId={copiedId}
              onNavigate={() => board.id !== undefined && onNavigate(board.id)}
              onTogglePin={(e) => onTogglePin(e, board)}
              onEdit={() => onEdit(board)}
              onShare={(e) => onShare(e, board.id)}
              onDelete={() => onDelete(board)}
              onLeave={() => onLeave && onLeave(board)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
