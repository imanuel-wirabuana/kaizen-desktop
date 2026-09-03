import { useDroppable } from '@dnd-kit/react'
import { Button } from '@/components/ui/button'
import { Inbox, X, Sparkles } from 'lucide-react'
import { useItemsStore } from '@/stores/items'
import { useDraftSidebarStore } from '@/stores/draft-sidebar'
import { useNavigationStore } from '@/stores/navigation'
import { useBoardsStore } from '@/stores/boards'
import { TaskCard } from './task-card'
import { InlineCreateTask } from './inline-create-task'
import { cn } from '@/lib/utils'

export function DraftSidebar() {
  const isOpen = useDraftSidebarStore((s) => s.isOpen)
  const close = useDraftSidebarStore((s) => s.close)
  const currentView = useNavigationStore((s) => s.currentView)
  const allItems = useItemsStore((s) => s.items)

  const boardId = currentView.name === 'board-detail' ? currentView.boardId : undefined
  const currentBoard = useBoardsStore((s) => s.boards.find((b) => String(b.id) === String(boardId)))
  const boardTitle = currentBoard?.title || 'Board'

  // Attach droppable target for Draft Sidebar
  const { ref: dropRef, isDropTarget } = useDroppable({
    id: 'draft-sidebar-drop-target',
    type: 'item',
    accept: 'item',
    data: { type: 'lane', laneId: null }
  })

  // Only render when accessing board detail view
  if (currentView.name !== 'board-detail') return null

  // Filter items belonging to Draft (lane_id === null)
  const draftItems = allItems
    .filter((i) => i.lane_id === null)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  return (
    <aside
      className={cn(
        'flex h-full flex-col rounded-2xl bg-card/95 backdrop-blur-md text-card-foreground shadow-md transition-all duration-300 ease-in-out overflow-hidden relative select-none z-10 shrink-0 border border-border/80',
        isOpen
          ? 'w-80 opacity-100 translate-x-0'
          : 'w-0 opacity-0 translate-x-6 border-0 shadow-none pointer-events-none -ml-3'
      )}
    >
      <div className="w-80 flex h-full flex-col min-w-[320px]">
        {/* Sidebar Top Header */}
        <div className="flex h-11 shrink-0 items-center justify-between border-b px-3.5 bg-muted/30">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
              <Inbox className="size-3.5" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="text-xs font-bold tracking-tight text-foreground truncate">Drafts</h3>
              <span
                className="rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-semibold text-primary truncate max-w-[120px]"
                title={boardTitle}
              >
                {currentBoard?.icon ? `${currentBoard.icon} ${boardTitle}` : boardTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Count Badge */}
            <span className="flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-background border text-[10px] font-bold text-muted-foreground shadow-2xs">
              {draftItems.length}
            </span>

            {/* Close Sidebar Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={close}
              className="size-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
              title="Close Draft Sidebar"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Sidebar Task List Body (Droppable Target for items) */}
        <div
          ref={dropRef}
          className={cn(
            'flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5 transition-all rounded-xl',
            isDropTarget ? 'bg-primary/10 ring-2 ring-primary/40 border-2 border-dashed border-primary/50' : ''
          )}
        >
          {draftItems.length > 0 ? (
            draftItems.map((item, idx) => (
              <TaskCard key={item.id} item={item} index={idx} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/20 bg-muted/10 p-6 text-center transition-all">
              <div className="flex size-9 items-center justify-center rounded-xl bg-background border shadow-2xs text-muted-foreground">
                <Sparkles className="size-4 text-primary/70" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground/80">No draft tasks</p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  Drag cards here or add one below to save draft tasks
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer Inline Task Creator */}
        <div className="p-2.5 border-t border-border/50 bg-sidebar/50">
          <InlineCreateTask laneId={null} />
        </div>
      </div>
    </aside>
  )
}
