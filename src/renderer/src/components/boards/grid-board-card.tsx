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
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import {
  Pin,
  PinOff,
  MoreVertical,
  Pencil,
  Trash2,
  Share2,
  FolderOpen,
  ArrowRight,
  GripVertical,
  Plus,
  LogOut
} from 'lucide-react'
import { useUser } from '@/providers/auth-provider'
import { cn } from '@/lib/utils'
import { BoardMenuContent } from '@/components/menus/board-menu-content'

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
  onLeave?: () => void
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
  onDelete,
  onLeave
}: SortableGridBoardCardProps) {
  const { user } = useUser()
  const isOwner =
    board.role === 'owner' ||
    Boolean(user?.id && board.owner === user.id) ||
    (!board.role && !board.owner)
  const canEdit = isOwner || board.role === 'edit'
  const isPinned = !!board.pinned
  const bgProps = getBoardBackgroundStyleAndClass(board.background)
  const hasBackground = bgProps.isImage || bgProps.className

  const { ref, handleRef, isDragSource } = useSortable({
    id: board.id!,
    index,
    type: 'board',
    accept: 'board',
    group
  })

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <div
            ref={ref}
            className={cn(
              'group relative flex min-h-[160px] w-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card text-card-foreground shadow-2xs hover:shadow-md transition-all duration-200 hover:border-border cursor-pointer',
              isDragSource && 'opacity-50 ring-2 ring-primary/40'
            )}
            onClick={onNavigate}
          />
        }
      >
        {/* Banner Area */}
        <div
          className={cn(
            'relative h-20 w-full overflow-hidden shrink-0',
            hasBackground ? '' : 'bg-gradient-to-br from-muted/60 via-muted/30 to-muted/50'
          )}
          style={bgProps.style}
        >
          {/* Custom image or preset gradient background overlay */}
          <div className={cn('absolute inset-0', bgProps.className)} />

          {/* Quick Action Overlay Buttons (Top-Right) */}
          <div className="absolute right-1.5 top-1.5 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {/* Share Board button (owner only) */}
            {isOwner && (
              <button
                type="button"
                onClick={onShare}
                className="flex size-5 items-center justify-center rounded-md border border-white/30 bg-black/30 text-white hover:bg-black/50 shadow-xs transition-all backdrop-blur-md cursor-pointer"
                title="Share Board"
              >
                <Share2 className="size-2.5" />
              </button>
            )}

            {/* Quick Pin toggle button */}
            <button
              type="button"
              onClick={onTogglePin}
              className="flex size-5 items-center justify-center rounded-md border border-white/30 bg-black/30 text-white hover:bg-black/50 shadow-xs transition-all backdrop-blur-md cursor-pointer"
              title={isPinned ? 'Unpin' : 'Pin Board'}
            >
              {isPinned ? <PinOff className="size-2.5" /> : <Pin className="size-2.5" />}
            </button>

            {/* Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                    className="flex size-5 items-center justify-center rounded-md border border-white/30 bg-black/30 text-white hover:bg-black/50 shadow-xs transition-all backdrop-blur-md cursor-pointer"
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

                {canEdit && (
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

                {isOwner ? (
                  <>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem variant="destructive" onClick={onDelete}>
                      <Trash2 className="size-3.5" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </>
                ) : onLeave ? (
                  <>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem variant="destructive" onClick={onLeave}>
                      <LogOut className="size-3.5" />
                      <span>Leave Board</span>
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Pinned indicator always visible */}
          {isPinned && (
            <div className="absolute left-1.5 top-1.5 z-10 flex size-5 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs group-hover:opacity-0 transition-opacity duration-200">
              <Pin className="size-2.5 fill-current" />
            </div>
          )}
        </div>

        {/* Card Main Body */}
        <div className="flex items-start gap-2.5 p-2.5 -mt-3 relative z-[1]">
          {/* Emoji Badge - overlapping the banner */}
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border-2 border-card bg-background text-sm shadow-sm">
            {board.icon || '📋'}
          </div>

          <div className="flex flex-1 flex-col min-w-0 pt-0.5 space-y-1">
            <div className="flex items-center justify-between gap-1">
              <h3 className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                {board.title || 'Untitled Board'}
              </h3>
              {board.role && board.role !== 'owner' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium capitalize shrink-0">
                  {board.role}
                </span>
              )}
            </div>

            {board.description && (
              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                {board.description}
              </p>
            )}
          </div>
        </div>

        {/* Card Footer Row */}
        <div className="flex items-center justify-between border-t border-border/40 px-2.5 py-1.5 text-[10px] text-muted-foreground/70 bg-card/50 mt-auto">
          <span className="truncate">
            {board.last_activity
              ? `Active ${new Date(board.last_activity).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric'
                })}`
              : board.updated_at
              ? `Updated ${new Date(board.updated_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric'
                })}`
              : 'Recent'}
          </span>

          <div className="flex items-center gap-1.5">
            {/* Drag Handle Icon inside footer */}
            <span
              ref={handleRef}
              className="cursor-grab touch-none active:cursor-grabbing p-0.5 text-muted-foreground/40 hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
              title="Drag to reorder"
            >
              <GripVertical className="size-3" />
            </span>
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48 text-xs shadow-xl">
        <BoardMenuContent
          board={board}
          variant="context"
          onEdit={onEdit}
          onDelete={onDelete}
          onLeave={onLeave}
          onTogglePin={onTogglePin}
        />
      </ContextMenuContent>
    </ContextMenu>
  )
}

// ── Drag Overlay Preview Component ──
export function BoardCardPreview({ board }: { board: Board }) {
  const bgProps = getBoardBackgroundStyleAndClass(board.background)
  const hasBackground = bgProps.isImage || bgProps.className

  return (
    <div className="flex min-h-[160px] w-full flex-col overflow-hidden rounded-2xl border border-primary/50 bg-card text-card-foreground shadow-2xl ring-2 ring-primary/30 opacity-95 pointer-events-none select-none">
      <div
        className={cn(
          'relative h-20 w-full overflow-hidden shrink-0',
          hasBackground ? '' : 'bg-gradient-to-br from-muted/60 via-muted/30 to-muted/50',
          bgProps.className
        )}
        style={bgProps.style}
      >
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card/80 to-transparent" />
      </div>
      <div className="flex items-start gap-2.5 p-2.5 -mt-3 relative z-[1]">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border-2 border-card bg-background text-sm shadow-sm">
          {board.icon || '📋'}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="text-xs font-semibold text-foreground truncate">{board.title}</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">
            {board.description || 'No description'}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between border-t bg-muted/20 px-2.5 py-1 text-[10px] text-muted-foreground mt-auto">
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
