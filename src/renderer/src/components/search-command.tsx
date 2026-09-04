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
  SparklesIcon,
  LayersIcon
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
import { getAllLanes } from '@/services/lanes'
import { getAllItems } from '@/services/items'
import { CreateBoardDrawer } from '@/components/boards'
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
  const [createDrawerOpen, setCreateDrawerOpen] = React.useState(false)
  const loadingBoards = useBoardsStore(selectLoading)
  const boards = useBoardsStore((s) => s.boards)
  const navigate = useNavigationStore((s) => s.navigate)
  const pinnedBoards = usePinnedBoards()
  const unpinnedBoards = useUnpinnedBoards()
  const storeItems = useItemsStore((s) => s.items)
  const storeLanes = useLanesStore((s) => s.lanes)
  const { setTheme, setPreset, presets, preset, resolvedTheme } = useTheme()

  const [dbLanes, setDbLanes] = React.useState<Lane[]>([])
  const [dbItems, setDbItems] = React.useState<KanbanItem[]>([])
  const [fetchingDetails, setFetchingDetails] = React.useState(false)

  useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      setOpen((prev) => !prev)
    }
  })

  React.useEffect(() => {
    if (!open) return
    let isCancelled = false
    setFetchingDetails(true)

    Promise.all([getAllLanes(), getAllItems()]).then(([fetchedLanes, fetchedItems]) => {
      if (!isCancelled) {
        setDbLanes(fetchedLanes)
        setDbItems(fetchedItems)
        setFetchingDetails(false)
      }
    })

    return () => {
      isCancelled = true
    }
  }, [open])

  const accessibleBoardIds = React.useMemo(() => {
    return new Set(boards.map((b) => String(b.id)).filter(Boolean))
  }, [boards])

  // Merge store items/lanes with DB fetched items/lanes, strictly filtered by accessible board IDs (owned & shared)
  const lanes = React.useMemo(() => {
    const map = new Map<string, Lane>()
    dbLanes.forEach((l) => {
      if (
        l.id !== null &&
        l.board_id !== undefined &&
        l.board_id !== null &&
        accessibleBoardIds.has(String(l.board_id))
      ) {
        map.set(String(l.id), l)
      }
    })
    storeLanes.forEach((l) => {
      if (
        l.id !== null &&
        l.board_id !== undefined &&
        l.board_id !== null &&
        accessibleBoardIds.has(String(l.board_id))
      ) {
        map.set(String(l.id), l)
      }
    })
    return Array.from(map.values())
  }, [dbLanes, storeLanes, accessibleBoardIds])

  const items = React.useMemo(() => {
    const map = new Map<string, KanbanItem>()
    dbItems.forEach((i) => {
      if (
        i.id !== undefined &&
        i.board_id !== undefined &&
        i.board_id !== null &&
        accessibleBoardIds.has(String(i.board_id))
      ) {
        map.set(String(i.id), i)
      }
    })
    storeItems.forEach((i) => {
      if (
        i.id !== undefined &&
        i.board_id !== undefined &&
        i.board_id !== null &&
        accessibleBoardIds.has(String(i.board_id))
      ) {
        map.set(String(i.id), i)
      }
    })
    return Array.from(map.values())
  }, [dbItems, storeItems, accessibleBoardIds])

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

  const canvasLanes = React.useMemo(() => lanes.filter((l) => l.id !== null), [lanes])

  const renderBoard = (board: Board, isPinned = false) => {
    const id = board.id
    if (id === undefined) return null

    return (
      <CommandItem
        key={`board-${id}`}
        value={`board ${isPinned ? 'pinned ' : ''}${board.title ?? ''} ${board.description ?? ''}`}
        onSelect={() => run(() => navigate({ name: 'board-detail', boardId: id }))}
        className="flex cursor-pointer items-center justify-between gap-2 px-2 py-1.5 text-xs select-none rounded-md"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="flex size-5 items-center justify-center rounded bg-muted/60 text-xs shrink-0">
            {board.icon || '📋'}
          </span>
          <span className="font-semibold text-foreground truncate">
            {board.title || 'Untitled Board'}
          </span>
          {board.description && (
            <span className="text-[10px] text-muted-foreground/70 truncate hidden sm:inline">
              – {board.description}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isPinned ? (
            <span className="flex shrink-0 items-center gap-0.5 rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0 text-[9px] text-amber-600 dark:text-amber-400 font-semibold">
              <PinIcon className="size-2.5" /> Pinned
            </span>
          ) : (
            <ExternalLinkIcon className="size-3 text-muted-foreground/40 shrink-0" />
          )}
        </div>
      </CommandItem>
    )
  }

  const renderLane = (lane: Lane) => {
    if (lane.id === null) return null
    const parentBoard = boards.find((b) => String(b.id) === String(lane.board_id))
    const boardTitle = parentBoard?.title || 'Board'

    return (
      <CommandItem
        key={`lane-${lane.id}`}
        value={`lane column ${lane.icon ?? ''} ${lane.title ?? ''} ${boardTitle}`}
        onSelect={() =>
          run(() => {
            if (lane.board_id) {
              navigate({ name: 'board-detail', boardId: lane.board_id })
            }
          })
        }
        className="flex cursor-pointer items-center justify-between gap-2 px-2 py-1.5 text-xs select-none rounded-md"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {lane.icon ? (
            <span className="flex size-5 items-center justify-center text-xs shrink-0">
              {lane.icon}
            </span>
          ) : (
            <div className="flex size-5 items-center justify-center rounded bg-primary/10 text-primary shrink-0">
              <LayersIcon className="size-3" />
            </div>
          )}
          <span className="font-semibold text-foreground truncate">
            {lane.title || 'Untitled Lane'}
          </span>
        </div>

        <span className="rounded bg-muted/70 px-1.5 py-0 text-[9px] font-medium text-muted-foreground shrink-0 border border-border/60 truncate max-w-[120px]">
          {parentBoard?.icon ? `${parentBoard.icon} ${boardTitle}` : boardTitle}
        </span>
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
        className="flex cursor-pointer items-center justify-between gap-2 px-2 py-1.5 text-xs select-none rounded-md"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-xs shrink-0">{item.icon || '📝'}</span>
          <span className="font-semibold text-foreground truncate">
            {item.title || 'Untitled Task'}
          </span>
          <span className="rounded bg-muted/60 px-1.5 py-0 text-[9px] font-medium text-muted-foreground shrink-0 border border-border/50">
            {laneName}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {dueInfo && (
            <span
              className={cn(
                'flex items-center gap-0.5 rounded px-1.5 py-0 text-[9px] font-medium border',
                dueInfo.isOverdue
                  ? 'bg-destructive/10 text-destructive border-destructive/20'
                  : 'bg-muted text-muted-foreground border-border'
              )}
            >
              <CalendarIcon className="size-2.5" />
              <span>{dueInfo.formatted}</span>
            </span>
          )}

          <span
            className={cn(
              'flex items-center gap-1 rounded px-1.5 py-0 text-[9px] border',
              priorityInfo.badge
            )}
          >
            <span className={cn('size-1 rounded-full', priorityInfo.dot)} />
            <span>{priorityInfo.label}</span>
          </span>
        </div>
      </CommandItem>
    )
  }

  const actions = React.useMemo(
    () => [
      {
        id: 'all-boards',
        label: 'All Boards',
        value: 'action all boards manage view workspace',
        icon: <LayoutGridIcon className="size-3.5 text-primary" />,
        badge: 'View all',
        onSelect: () => navigate({ name: 'boards' })
      },
      {
        id: 'create-board',
        label: 'Create New Board',
        value: 'action create new board add',
        icon: <PlusIcon className="size-3.5 text-emerald-500" />,
        badge: 'Action',
        onSelect: () => setCreateDrawerOpen(true)
      },
      {
        id: 'toggle-theme',
        label: `Toggle ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`,
        value: 'action toggle switch dark light theme mode appearance',
        icon:
          resolvedTheme === 'dark' ? (
            <SunIcon className="size-3.5 text-amber-400" />
          ) : (
            <MoonIcon className="size-3.5 text-indigo-400" />
          ),
        badge: resolvedTheme,
        onSelect: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
      }
    ],
    [navigate, resolvedTheme, setTheme]
  )

  const isInitialLoading =
    loadingBoards && fetchingDetails && dbLanes.length === 0 && dbItems.length === 0

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
        <CommandInput placeholder="Search boards, lanes, tasks or quick actions..." />
        <CommandList className="max-h-80">
          <CommandEmpty>
            <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-muted-foreground">
              <SparklesIcon className="size-8 text-muted-foreground/30 mb-2" />
              <p className="font-semibold text-foreground/80">No results found</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Try searching for board titles, lanes, tasks, or actions.
              </p>
            </div>
          </CommandEmpty>

          {isInitialLoading ? (
            <CommandGroup heading="Loading Boards, Lanes & Tasks...">
              <div className="space-y-1.5 p-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-lg border border-border/40 bg-muted/10"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <Skeleton className="size-4 rounded shrink-0" />
                      <div className="flex-1 space-y-1 min-w-0">
                        <Skeleton className="h-3 w-36 rounded" />
                      </div>
                    </div>
                    <Skeleton className="h-3.5 w-10 rounded-full shrink-0" />
                  </div>
                ))}
              </div>
            </CommandGroup>
          ) : (
            <>
              {/* 1. Pinned Boards */}
              {pinnedBoards.length > 0 && (
                <CommandGroup heading="Pinned Boards">
                  {pinnedBoards.map((b) => renderBoard(b, true))}
                </CommandGroup>
              )}

              {/* 2. Other Boards */}
              {unpinnedBoards.length > 0 && (
                <CommandGroup heading={pinnedBoards.length > 0 ? 'Other Boards' : 'Boards'}>
                  {unpinnedBoards.map((b) => renderBoard(b, false))}
                </CommandGroup>
              )}

              {/* 3. Lanes */}
              {canvasLanes.length > 0 && (
                <CommandGroup heading={`Lanes (${canvasLanes.length})`}>
                  {canvasLanes.map((lane) => renderLane(lane))}
                </CommandGroup>
              )}

              {/* 4. Tasks Group */}
              {items.length > 0 && (
                <CommandGroup heading={`Tasks (${items.length})`}>
                  {items.map((item) => renderTask(item))}
                </CommandGroup>
              )}
            </>
          )}

          <CommandSeparator />

          {/* 5. Quick Actions */}
          <CommandGroup heading="Actions">
            {actions.map((action) => (
              <CommandItem
                key={action.id}
                value={action.value}
                onSelect={() => run(action.onSelect)}
                className="flex cursor-pointer items-center justify-between px-2 py-1.5 text-xs select-none rounded-md"
              >
                <div className="flex items-center gap-2">
                  {action.icon}
                  <span className="font-semibold text-foreground">{action.label}</span>
                </div>
                {action.badge && (
                  <span className="text-[9px] text-muted-foreground/60 font-mono capitalize">
                    {action.badge}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <CreateBoardDrawer open={createDrawerOpen} onOpenChange={setCreateDrawerOpen} />
    </>
  )
}

export default SearchCommand
