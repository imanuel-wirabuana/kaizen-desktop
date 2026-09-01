import * as React from 'react'
import {
  SearchIcon,
  LayoutGridIcon,
  HomeIcon,
  MoonIcon,
  SunIcon,
  PinIcon,
  ExternalLinkIcon,
  PlusIcon,
  CalendarIcon,
  CheckSquareIcon,
  SparklesIcon
} from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command'
import { useEventListener } from '@/hooks/use-event-listener'
import { usePinnedBoards, useUnpinnedBoards } from '@/hooks/use-boards'
import { useNavigationStore } from '@/stores/navigation'
import { useBoardsStore, selectLoading } from '@/stores/boards'
import { useItemsStore } from '@/stores/items'
import { useLanesStore } from '@/stores/lanes'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent)

const PRIORITY_CONFIG: Record<number, { label: string; badge: string; dot: string }> = {
  0: { label: 'Low', badge: 'bg-muted text-muted-foreground border-border', dot: 'bg-slate-400' },
  1: {
    label: 'Medium',
    badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    dot: 'bg-amber-500'
  },
  2: {
    label: 'High',
    badge: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
    dot: 'bg-orange-500'
  },
  3: {
    label: 'Urgent',
    badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-semibold',
    dot: 'bg-rose-500'
  }
}

function formatDueDate(dueDateStr: string | null | undefined) {
  if (!dueDateStr) return null
  try {
    const d = new Date(dueDateStr)
    if (isNaN(d.getTime())) return null
    const formatted = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const isOverdue = d < now
    return { formatted, isOverdue }
  } catch {
    return null
  }
}

export function SearchCommand() {
  const [open, setOpen] = React.useState(false)
  const loading = useBoardsStore(selectLoading)
  const navigate = useNavigationStore((s) => s.navigate)
  const pinnedBoards = usePinnedBoards()
  const unpinnedBoards = useUnpinnedBoards()
  const items = useItemsStore((s) => s.items)
  const lanes = useLanesStore((s) => s.lanes)
  const { setTheme, resolvedTheme } = useTheme()

  useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      setOpen((prev) => !prev)
    }
  })

  const run = (action: () => void) => {
    setOpen(false)
    action()
  }

  const laneMap = React.useMemo(() => {
    const map = new Map<number | null, string>()
    map.set(null, 'Draft')
    lanes.forEach((l) => {
      if (l.id !== null) map.set(l.id, l.title || 'Untitled Lane')
    })
    return map
  }, [lanes])

  const renderBoard = (board: Board, isPinned = false) => {
    const id = board.id
    if (id === undefined) return null

    return (
      <CommandItem
        key={`board-${id}`}
        value={`board ${isPinned ? 'pinned ' : ''}${board.title ?? ''} ${board.description ?? ''}`}
        onSelect={() => run(() => navigate({ name: 'board-detail', boardId: id }))}
        className="flex cursor-pointer items-center justify-between gap-3 px-2.5 py-2 text-xs select-none rounded-lg hover:bg-accent/80 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="flex size-7 items-center justify-center rounded-lg border bg-background text-sm shadow-2xs shrink-0">
            {board.icon || '📋'}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-semibold text-foreground truncate">{board.title || 'Untitled Board'}</span>
            {board.description && (
              <span className="text-[11px] text-muted-foreground/80 truncate">
                {board.description}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isPinned ? (
            <span className="flex shrink-0 items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
              <PinIcon className="size-3" /> Pinned
            </span>
          ) : (
            <ExternalLinkIcon className="size-3.5 text-muted-foreground/50 shrink-0" />
          )}
        </div>
      </CommandItem>
    )
  }

  const renderTask = (item: KanbanItem) => {
    const priorityInfo = PRIORITY_CONFIG[item.priority ?? 0] || PRIORITY_CONFIG[0]
    const dueInfo = formatDueDate(item.due_date)
    const laneName = laneMap.get(item.lane_id ?? null) || 'Draft'

    const searchKeywords = [
      item.title ?? '',
      item.description ?? '',
      priorityInfo.label,
      laneName
    ].join(' ')

    return (
      <CommandItem
        key={`task-${item.id}`}
        value={`task ${searchKeywords}`}
        onSelect={() =>
          run(() => {
            if (item.board_id) {
              navigate({ name: 'board-detail', boardId: item.board_id })
            }
          })
        }
        className="flex cursor-pointer items-center justify-between gap-3 px-2.5 py-2 text-xs select-none rounded-lg hover:bg-accent/80 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="text-sm shrink-0">{item.icon || '📝'}</span>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-semibold text-foreground truncate">{item.title || 'Untitled Task'}</span>
              <span className="rounded-md bg-muted/80 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground shrink-0 border">
                {laneName}
              </span>
            </div>
            {item.description && (
              <span className="text-[11px] text-muted-foreground/80 truncate mt-0.5">
                {item.description}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {dueInfo && (
            <span
              className={cn(
                'flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium border',
                dueInfo.isOverdue
                  ? 'bg-destructive/10 text-destructive border-destructive/20'
                  : 'bg-muted text-muted-foreground border-border'
              )}
            >
              <CalendarIcon className="size-3" />
              <span>{dueInfo.formatted}</span>
            </span>
          )}

          <span
            className={cn(
              'flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] border',
              priorityInfo.badge
            )}
          >
            <span className={cn('size-1.5 rounded-full', priorityInfo.dot)} />
            <span>{priorityInfo.label}</span>
          </span>
        </div>
      </CommandItem>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        className="relative h-8 w-full justify-start rounded-md bg-muted/20 px-2.5 text-xs font-normal text-muted-foreground shadow-none hover:bg-muted/40 sm:w-56"
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="mr-2 size-3.5 opacity-60" />
        <span className="truncate">Search tasks, boards...</span>
        <kbd className="pointer-events-none absolute top-1 right-1.5 hidden h-5 items-center gap-0.5 rounded border bg-muted px-1 font-mono text-[9px] font-medium opacity-100 select-none sm:flex">
          <span>{isMac ? '⌘' : 'Ctrl'}</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search tasks, boards or quick actions..." />
        <CommandList className="max-h-80">
          <CommandEmpty>
            <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-muted-foreground">
              <SparklesIcon className="size-8 text-muted-foreground/30 mb-2" />
              <p className="font-semibold text-foreground/80">No results found</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Try searching for task titles, boards, or actions.</p>
            </div>
          </CommandEmpty>

          {loading ? (
            <CommandGroup heading="Loading Boards & Tasks...">
              <div className="space-y-1.5 p-1.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border bg-muted/20">
                    <Skeleton className="size-5 rounded-md shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3.5 w-40 rounded-md" />
                      <Skeleton className="h-2.5 w-24 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </CommandGroup>
          ) : (
            <>
              {/* Tasks Group */}
              {items.length > 0 && (
                <CommandGroup heading={`Tasks (${items.length})`}>
                  {items.map((item) => renderTask(item))}
                </CommandGroup>
              )}

              {/* Pinned Boards */}
              {pinnedBoards.length > 0 && (
                <CommandGroup heading="Pinned Boards">
                  {pinnedBoards.map((b) => renderBoard(b, true))}
                </CommandGroup>
              )}

              {/* Other Boards */}
              {unpinnedBoards.length > 0 && (
                <CommandGroup heading={pinnedBoards.length > 0 ? 'Other Boards' : 'Boards'}>
                  {unpinnedBoards.map((b) => renderBoard(b, false))}
                </CommandGroup>
              )}
            </>
          )}

          <CommandSeparator />

          {/* Quick Actions */}
          <CommandGroup heading="Actions">
            <CommandItem
              value="all boards manage view workspace"
              onSelect={() => run(() => navigate({ name: 'boards' }))}
              className="flex cursor-pointer items-center justify-between px-2.5 py-2 text-xs select-none rounded-lg hover:bg-accent/80 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <LayoutGridIcon className="size-4 text-primary" />
                <span className="font-semibold text-foreground">All Boards</span>
              </div>
              <span className="text-[10px] text-muted-foreground/60 font-mono">View all</span>
            </CommandItem>

            <CommandItem
              value="create new board add"
              onSelect={() => run(() => navigate({ name: 'boards' }))}
              className="flex cursor-pointer items-center justify-between px-2.5 py-2 text-xs select-none rounded-lg hover:bg-accent/80 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <PlusIcon className="size-4 text-emerald-500" />
                <span className="font-semibold text-foreground">Create New Board</span>
              </div>
              <span className="text-[10px] text-muted-foreground/60 font-mono">Action</span>
            </CommandItem>

            <CommandItem
              value="home landing page welcome"
              onSelect={() => run(() => navigate({ name: 'landing' }))}
              className="flex cursor-pointer items-center justify-between px-2.5 py-2 text-xs select-none rounded-lg hover:bg-accent/80 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <HomeIcon className="size-4 text-muted-foreground" />
                <span className="font-semibold text-foreground">Home</span>
              </div>
            </CommandItem>

            <CommandItem
              value="toggle switch dark light theme mode appearance"
              onSelect={() => run(() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'))}
              className="flex cursor-pointer items-center justify-between px-2.5 py-2 text-xs select-none rounded-lg hover:bg-accent/80 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                {resolvedTheme === 'dark' ? (
                  <SunIcon className="size-4 text-amber-400" />
                ) : (
                  <MoonIcon className="size-4 text-indigo-400" />
                )}
                <span className="font-semibold text-foreground">
                  Toggle {resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground/60 font-mono capitalize">
                {resolvedTheme}
              </span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}

export default SearchCommand
