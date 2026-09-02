import { useSortable } from '@dnd-kit/react/sortable'
import { getBoardBackgroundStyleAndClass } from '@/lib/board-utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import {
  Pin,
  PinOff,
  MoreVertical,
  Pencil,
  Trash2,
  Share2,
  Check,
  FolderOpen,
  ArrowRight,
  GripVertical,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type SortableGridBoardCardProps = {
  board: Board
  index: number
  group: 'pinned' | 'unpinned'
  copiedId: number | string | null
  onNavigate: () => void
  onTogglePin: (e: React.MouseEvent) => void
  onEdit: () => void
  onShare: (e: React.MouseEvent) => void
  onDelete: () => void
}

export function SortableGridBoardCard({
  board,
  index,
  group,
  copiedId,
  onNavigate,
  onTogglePin,
  onEdit,
  onShare,
  onDelete
}: SortableGridBoardCardProps) {
  const { ref, handleRef, isDragSource } = useSortable({
    id: board.id!,
    index,
    type: 'board',
    accept: 'board',
    group
  })

  const bgProps = getBoardBackgroundStyleAndClass(board.background)
  const isPinned = Boolean(board.pinned)

  return (
    <ContextMenu key={board.id}>
      <ContextMenuTrigger
        render={
          <div
            ref={ref}
            role="button"
            tabIndex={0}
            onClick={onNavigate}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onNavigate()
              }
            }}
            className={cn(
              'group relative flex min-h-[105px] flex-col justify-between overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 cursor-pointer select-none',
              isDragSource ? 'opacity-40 ring-2 ring-primary/30' : ''
            )}
          />
        }
      >
        {/* Compact Wallpaper Strip */}
        <div
          className={cn(
            'relative h-6 w-full border-b bg-muted/40 overflow-hidden',
            bgProps.className
          )}
          style={bgProps.style}
        >
          {bgProps.isImage && (
            <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px]" />
          )}

          {/* Quick Action Top Right */}
          <div className="absolute right-1.5 top-1 z-10 flex items-center gap-1">
            <button
              type="button"
              onClick={onTogglePin}
              title={isPinned ? 'Unpin board' : 'Pin board'}
              className={cn(
                'flex size-5 items-center justify-center rounded-md border text-[10px] shadow-xs transition-all backdrop-blur-md cursor-pointer',
                isPinned
                  ? 'border-primary/40 bg-primary text-primary-foreground'
                  : 'border-background/40 bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground opacity-80 group-hover:opacity-100'
              )}
            >
              {isPinned ? <Pin className="size-2.5 fill-current" /> : <Pin className="size-2.5" />}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    title="Board options"
                    className="flex size-5 items-center justify-center rounded-md border border-background/40 bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground shadow-xs transition-all backdrop-blur-md opacity-80 group-hover:opacity-100 cursor-pointer"
                  >
                    <MoreVertical className="size-2.5" />
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={onNavigate}>
                  <FolderOpen className="size-3.5 text-muted-foreground" />
                  <span>Open Board</span>
                </DropdownMenuItem>

                {(!board.role || board.role === 'owner' || board.role === 'edit') && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="size-3.5 text-muted-foreground" />
                    <span>Edit Details</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={onTogglePin}>
                  {isPinned ? (
                    <>
                      <PinOff className="size-3.5 text-muted-foreground" />
                      <span>Unpin</span>
                    </>
                  ) : (
                    <>
                      <Pin className="size-3.5 text-muted-foreground" />
                      <span>Pin Board</span>
                    </>
                  )}
                </DropdownMenuItem>

                {(!board.role || board.role === 'owner') && (
                  <>
                    <DropdownMenuItem onClick={onShare}>
                      {copiedId === board.id ? (
                        <>
                          <Check className="size-3.5 text-emerald-500" />
                          <span className="text-emerald-500 font-medium">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="size-3.5 text-muted-foreground" />
                          <span>Share Board</span>
                        </>
                      )}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem variant="destructive" onClick={onDelete}>
                      <Trash2 className="size-3.5" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Card Main Body */}
        <div className="flex flex-1 items-start gap-2.5 p-2.5">
          {/* Emoji Badge */}
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border bg-background text-sm shadow-2xs">
            {board.icon || '📋'}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 justify-between">
              <h3 className="text-xs font-semibold tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
                {board.title || 'Untitled Board'}
              </h3>
              {board.role && (
                <span
                  className={cn(
                    'text-[9px] font-semibold px-1.5 py-0.5 rounded-full capitalize shrink-0',
                    board.role === 'owner'
                      ? 'bg-primary/10 text-primary'
                      : board.role === 'edit'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {board.role}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">
              {board.description || 'No description'}
            </p>
          </div>
        </div>

        {/* Card Footer / Metadata & Drag Handle */}
        <div className="flex items-center justify-between border-t bg-muted/10 px-2.5 py-1 text-[10px] text-muted-foreground">
          <span className="truncate">
            {board.updated_at
              ? `Updated ${new Date(board.updated_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric'
                })}`
              : 'Recent'}
          </span>
          <div className="flex items-center gap-1">
            <span
              ref={handleRef}
              className="cursor-grab touch-none active:cursor-grabbing text-muted-foreground/60 hover:text-foreground p-0.5"
              onClick={(e) => e.stopPropagation()}
              title="Drag to reorder"
            >
              <GripVertical className="size-3" />
            </span>
            <ArrowRight className="size-2.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-40">
        <ContextMenuItem onClick={onNavigate}>
          <FolderOpen className="size-3.5 text-muted-foreground" />
          <span>Open Board</span>
        </ContextMenuItem>

        {(!board.role || board.role === 'owner' || board.role === 'edit') && (
          <ContextMenuItem onClick={onEdit}>
            <Pencil className="size-3.5 text-muted-foreground" />
            <span>Edit Details</span>
          </ContextMenuItem>
        )}

        <ContextMenuItem onClick={onTogglePin}>
          {isPinned ? (
            <>
              <PinOff className="size-3.5 text-muted-foreground" />
              <span>Unpin Board</span>
            </>
          ) : (
            <>
              <Pin className="size-3.5 text-muted-foreground" />
              <span>Pin Board</span>
            </>
          )}
        </ContextMenuItem>

        {(!board.role || board.role === 'owner') && (
          <>
            <ContextMenuItem onClick={onShare}>
              {copiedId === board.id ? (
                <>
                  <Check className="size-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="size-3.5 text-muted-foreground" />
                  <span>Share Board</span>
                </>
              )}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="size-3.5" />
              <span>Delete Board</span>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}

// ── Drag Overlay Preview Component ──
export function BoardCardPreview({ board }: { board: Board }) {
  const bgProps = getBoardBackgroundStyleAndClass(board.background)

  return (
    <div className="flex min-h-[105px] w-full flex-col justify-between overflow-hidden rounded-2xl border border-primary/50 bg-card text-card-foreground shadow-2xl ring-2 ring-primary/30 opacity-95 pointer-events-none select-none">
      <div
        className={cn('h-6 w-full border-b bg-muted/40 overflow-hidden', bgProps.className)}
        style={bgProps.style}
      />
      <div className="flex items-start gap-2.5 p-3">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border bg-background text-sm shadow-2xs">
          {board.icon || '📋'}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-semibold text-foreground truncate">{board.title}</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">
            {board.description || 'No description'}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between border-t bg-muted/20 px-3 py-1.5 text-[10px] text-muted-foreground">
        <span>Moving board...</span>
        <GripVertical className="size-3 text-primary" />
      </div>
    </div>
  )
}

// ── Quick Create Board Tile Component ──
export function CreateBoardTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex min-h-[105px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 p-3 text-center transition-all duration-200 hover:border-primary/50 hover:bg-accent/30 cursor-pointer"
    >
      <div className="flex size-7 items-center justify-center rounded-full bg-background border shadow-xs transition-transform duration-200 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
        <Plus className="size-3.5" />
      </div>
      <span className="mt-1.5 text-xs font-medium text-foreground group-hover:text-primary">
        Create New Board
      </span>
    </button>
  )
}
