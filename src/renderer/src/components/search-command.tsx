import * as React from 'react'
import {
  SearchIcon,
  LayoutGridIcon,
  HomeIcon,
  MoonIcon,
  SunIcon,
  PinIcon,
  ExternalLinkIcon
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

const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent)

export function SearchCommand() {
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigationStore((s) => s.navigate)
  const pinnedBoards = usePinnedBoards()
  const unpinnedBoards = useUnpinnedBoards()
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

  const renderBoard = (board: Board, isPinned = false) => {
    const id = board.id
    if (id === undefined) return null

    return (
      <CommandItem
        key={id}
        value={`${isPinned ? 'pinned ' : ''}${board.title ?? ''} ${board.description ?? ''}`}
        onSelect={() => run(() => navigate({ name: 'board-detail', boardId: id }))}
        className="flex cursor-pointer items-center justify-between gap-2 px-2 py-1.5 text-xs select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs">{board.icon || '📋'}</span>
          <span className="font-medium truncate">{board.title || 'Untitled Board'}</span>
          {board.description && (
            <span className="text-[10px] text-muted-foreground truncate max-w-50">
              · {board.description}
            </span>
          )}
        </div>
        {isPinned ? (
          <span className="flex shrink-0 items-center gap-0.5 text-[9px] text-amber-500 font-medium">
            <PinIcon className="size-2.5" /> Pinned
          </span>
        ) : (
          <ExternalLinkIcon className="size-3 text-muted-foreground/40 shrink-0" />
        )}
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
        <span className="truncate">Search boards...</span>
        <kbd className="pointer-events-none absolute top-1 right-1.5 hidden h-5 items-center gap-0.5 rounded border bg-muted px-1 font-mono text-[9px] font-medium opacity-100 select-none sm:flex">
          <span>{isMac ? '⌘' : 'Ctrl'}</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search boards or actions..." />
        <CommandList className="max-h-64">
          <CommandEmpty>No results found.</CommandEmpty>

          {pinnedBoards.length > 0 && (
            <CommandGroup heading="Pinned Boards">
              {pinnedBoards.map((b) => renderBoard(b, true))}
            </CommandGroup>
          )}

          {unpinnedBoards.length > 0 && (
            <CommandGroup heading={pinnedBoards.length > 0 ? 'Other Boards' : 'Boards'}>
              {unpinnedBoards.map((b) => renderBoard(b, false))}
            </CommandGroup>
          )}

          <CommandSeparator />

          <CommandGroup heading="Actions">
            <CommandItem
              value="all boards manage view"
              onSelect={() => run(() => navigate({ name: 'boards' }))}
              className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-xs"
            >
              <LayoutGridIcon className="size-3.5 text-primary" />
              <span>All Boards</span>
            </CommandItem>
            <CommandItem
              value="home landing page"
              onSelect={() => run(() => navigate({ name: 'landing' }))}
              className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-xs"
            >
              <HomeIcon className="size-3.5 text-muted-foreground" />
              <span>Home</span>
            </CommandItem>
            <CommandItem
              value="toggle switch dark light theme mode appearance"
              onSelect={() => run(() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'))}
              className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-xs"
            >
              {resolvedTheme === 'dark' ? (
                <SunIcon className="size-3.5 text-amber-400" />
              ) : (
                <MoonIcon className="size-3.5 text-indigo-400" />
              )}
              <span>Toggle {resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}

export default SearchCommand
