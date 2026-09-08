import { Button } from '@/components/ui/button'
import { InlineEmojiPicker } from '@/components/ui/emoji-picker'
import { useBoardsStore } from '@/stores/boards'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Eye,
  UserCheck,
  Clock,
  Share2,
  Upload,
  Download,
  MoreHorizontal,
  Sparkles,
  Inbox
} from 'lucide-react'
import { BoardMenuContent } from '@/components/menus/board-menu-content'
import { cn } from '@/lib/utils'
import { formatLastActivity } from '../utils/format-activity'
import { BoardPermissions } from '../hooks/use-board-permissions'

export interface BoardDetailHeaderProps {
  board: Board
  permissions: BoardPermissions
  draftItemsCount: number
  isDraftOpen: boolean
  toggleDraftSidebar: () => void
  isAiOpen: boolean
  toggleAiSidebar: () => void
  onOpenShare: () => void
  onOpenExport: () => void
  onOpenImport: () => void
  onOpenEdit: () => void
  onOpenDelete: () => void
  onOpenLeave: () => void
}

export function BoardDetailHeader({
  board,
  permissions,
  draftItemsCount,
  isDraftOpen,
  toggleDraftSidebar,
  isAiOpen,
  toggleAiSidebar,
  onOpenShare,
  onOpenExport,
  onOpenImport,
  onOpenEdit,
  onOpenDelete,
  onOpenLeave
}: BoardDetailHeaderProps) {
  const { permissionRole, isOwner, isReadOnly, canEdit } = permissions
  const updateBoard = useBoardsStore((s) => s.updateBoard)

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <div className="flex items-center justify-between gap-2.5 px-0.5 py-0 select-none">
            <div className="flex items-center gap-2 min-w-0">
              {canEdit && board.id !== undefined ? (
                <InlineEmojiPicker
                  value={board.icon || '📋'}
                  onChange={async (emoji) => {
                    await updateBoard(board.id!, { icon: emoji })
                  }}
                  align="start"
                  side="bottom"
                  title="Click to change board icon"
                  trigger={
                    <button
                      type="button"
                      className="flex size-8 items-center justify-center rounded-lg border bg-background text-lg shadow-2xs shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer hover:border-primary/50"
                      title="Click to change board icon"
                    >
                      {board.icon || '📋'}
                    </button>
                  }
                />
              ) : (
                <div className="flex size-8 items-center justify-center rounded-lg border bg-background text-lg shadow-2xs shrink-0">
                  {board.icon || '📋'}
                </div>
              )}
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
                  onClick={onOpenShare}
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
                  onClick={onOpenExport}
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
                  onClick={onOpenImport}
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
                    onEdit={onOpenEdit}
                    onDelete={onOpenDelete}
                    onLeave={onOpenLeave}
                    onExport={onOpenExport}
                    onImport={onOpenImport}
                  />
                </DropdownMenuContent>
              </DropdownMenu>

              {/* AI Assistant Toggle Button */}
              <Button
                variant={isAiOpen ? 'secondary' : 'outline'}
                size="sm"
                onClick={toggleAiSidebar}
                className={cn(
                  'h-7 gap-1 px-2.5 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer',
                  isAiOpen && 'bg-primary/15 text-primary border-primary/30'
                )}
                title={isAiOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
              >
                <Sparkles
                  className={cn(
                    'size-3.5',
                    isAiOpen ? 'text-primary animate-pulse' : 'text-primary/70'
                  )}
                />
                <span>Assistant</span>
              </Button>

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
          onEdit={onOpenEdit}
          onDelete={onOpenDelete}
          onLeave={onOpenLeave}
          onExport={onOpenExport}
          onImport={onOpenImport}
        />
      </ContextMenuContent>
    </ContextMenu>
  )
}
