import { useState, useRef, useEffect, useMemo } from 'react'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { move } from '@dnd-kit/helpers'
import { useNavigationStore } from '@/stores/navigation'
import { useBoardsStore, selectLoading } from '@/stores/boards'
import { usePinnedBoards, useUnpinnedBoards } from '@/hooks/use-boards'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BoardDrawer,
  EditBoardDrawer,
  DeleteBoardDrawer,
  PinnedGridSection,
  UnpinnedGridSection,
  BoardCardPreview,
  ShareBoardModal,
  JoinBoardModal
} from '@/components/boards'
import { Plus, Search, Sparkles, LogIn } from 'lucide-react'

export function BoardsPage() {
  const navigate = useNavigationStore((s) => s.navigate)
  const loading = useBoardsStore(selectLoading)

  const pinnedBoardsStore = usePinnedBoards()
  const unpinnedBoardsStore = useUnpinnedBoards()

  // Local DnD items state synced with store
  const [items, setItems] = useState<{ pinned: Board[]; unpinned: Board[] }>({
    pinned: pinnedBoardsStore,
    unpinned: unpinnedBoardsStore
  })

  const previousItems = useRef(items)
  const itemsRef = useRef(items)
  itemsRef.current = items

  useEffect(() => {
    setItems({
      pinned: pinnedBoardsStore,
      unpinned: unpinnedBoardsStore
    })
  }, [pinnedBoardsStore, unpinnedBoardsStore])

  const [searchQuery, setSearchQuery] = useState('')
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [editingBoard, setEditingBoard] = useState<Board | null>(null)
  const [deletingBoard, setDeletingBoard] = useState<Board | null>(null)
  const [sharingBoard, setSharingBoard] = useState<Board | null>(null)
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<number | string | null>(null)

  // Filtered views when searching
  const filteredPinned = useMemo(() => {
    if (!searchQuery.trim()) return items.pinned
    const q = searchQuery.toLowerCase().trim()
    return items.pinned.filter(
      (b) => b.title?.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q)
    )
  }, [items.pinned, searchQuery])

  const filteredUnpinned = useMemo(() => {
    if (!searchQuery.trim()) return items.unpinned
    const q = searchQuery.toLowerCase().trim()
    return items.unpinned.filter(
      (b) => b.title?.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q)
    )
  }, [items.unpinned, searchQuery])

  const totalBoardsCount = items.pinned.length + items.unpinned.length
  const hasBoards = totalBoardsCount > 0
  const hasSearchResults = filteredPinned.length > 0 || filteredUnpinned.length > 0

  const handleTogglePin = async (e: any, board: Board) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault()
      e.stopPropagation()
    }
    if (board.id === undefined) return
    await useBoardsStore.getState().updateBoard(board.id, { pinned: !board.pinned })
  }

  const handleShare = (e: React.MouseEvent, boardId?: number | string) => {
    e.preventDefault()
    e.stopPropagation()
    if (boardId === undefined) return

    const targetBoard = [...items.pinned, ...items.unpinned].find((b) => b.id === boardId)
    if (targetBoard) {
      setSharingBoard(targetBoard)
    }
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Top Bar Header Actions */}
      <div className="flex items-center justify-between gap-3 border-b pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">My Boards</h1>
          <p className="text-xs text-muted-foreground">Manage owned and shared kanban boards.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setJoinModalOpen(true)}
            className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <LogIn className="size-3.5" /> Join Board
          </Button>
          <Button
            size="sm"
            onClick={() => setCreateDrawerOpen(true)}
            className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <Plus className="size-3.5" /> Create Board
          </Button>
        </div>
      </div>

      {/* ── Main Board Content Area ── */}
      {loading ? (
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32 rounded-lg" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex min-h-[140px] flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xs"
                >
                  {/* Top Strip Skeleton */}
                  <div className="h-6 w-full border-b bg-muted/30 p-1 flex items-center justify-between px-2">
                    <Skeleton className="h-2.5 w-12 rounded-full" />
                    <div className="flex gap-1">
                      <Skeleton className="size-4 rounded-md" />
                      <Skeleton className="size-4 rounded-md" />
                    </div>
                  </div>

                  {/* Body Content Skeleton */}
                  <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="flex items-start gap-2.5">
                      <Skeleton className="size-8 rounded-xl shrink-0" />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <Skeleton className="h-4 w-3/4 rounded-md" />
                        <Skeleton className="h-3 w-full rounded-md" />
                      </div>
                    </div>

                    {/* Footer Row Skeleton */}
                    <div className="flex items-center justify-between border-t border-border/40 pt-2.5">
                      <Skeleton className="h-4 w-16 rounded-full" />
                      <Skeleton className="h-3 w-12 rounded-md" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : !hasBoards ? (
        /* Empty State */
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted p-8 text-center bg-muted/5">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs mb-3">
            <Sparkles className="size-6" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">No boards created yet</h3>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Create a board or join a shared board to start tracking tasks.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setJoinModalOpen(true)}
              className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
            >
              <LogIn className="size-3.5" /> Join Board
            </Button>
            <Button
              onClick={() => setCreateDrawerOpen(true)}
              className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
            >
              <Plus className="size-3.5" /> Create Board
            </Button>
          </div>
        </div>
      ) : !hasSearchResults ? (
        /* Search Empty State */
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border p-6 text-center bg-muted/5">
          <Search className="size-7 text-muted-foreground/60 mb-2" />
          <h3 className="text-xs font-semibold">No matching boards</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">
            No boards match &quot;{searchQuery}&quot;
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 h-7 text-xs cursor-pointer"
            onClick={() => setSearchQuery('')}
          >
            Clear search
          </Button>
        </div>
      ) : (
        <DragDropProvider
          onDragStart={() => {
            previousItems.current = itemsRef.current
          }}
          onDragOver={(event) => {
            const { source } = event.operation
            if (!source || source.type === 'column') return

            setItems((prev) => {
              const next = move(prev as any, event) as { pinned: Board[]; unpinned: Board[] }
              return {
                pinned: next.pinned.map((b) => ({ ...b, pinned: true })),
                unpinned: next.unpinned.map((b) => ({ ...b, pinned: false }))
              }
            })
          }}
          onDragEnd={(event) => {
            const { source } = event.operation
            if (event.canceled) {
              if (source?.type === 'board') {
                setItems(previousItems.current)
              }
              return
            }

            const currentPinned = itemsRef.current.pinned
            const currentUnpinned = itemsRef.current.unpinned
            const allReordered = [...currentPinned, ...currentUnpinned]
            useBoardsStore.getState().reorderBoards(allReordered)
          }}
        >
          <div className="space-y-6">
            {/* ── Pinned Section ── */}
            {(filteredPinned.length > 0 || !searchQuery) && (
              <PinnedGridSection
                items={filteredPinned}
                copiedId={copiedId}
                onNavigate={(id) => navigate({ name: 'board-detail', boardId: id })}
                onTogglePin={handleTogglePin}
                onEdit={setEditingBoard}
                onShare={handleShare}
                onDelete={setDeletingBoard}
              />
            )}

            {/* ── All Boards Section ── */}
            <UnpinnedGridSection
              items={filteredUnpinned}
              copiedId={copiedId}
              onNavigate={(id) => navigate({ name: 'board-detail', boardId: id })}
              onTogglePin={handleTogglePin}
              onEdit={setEditingBoard}
              onShare={handleShare}
              onDelete={setDeletingBoard}
              onCreateClick={() => setCreateDrawerOpen(true)}
            />
          </div>

          <DragOverlay dropAnimation={null}>
            {(source) => {
              if (!source) return null
              const allBoards = [...items.pinned, ...items.unpinned]
              const activeBoard = allBoards.find((b) => String(b.id) === String(source.id))
              if (!activeBoard) return null
              const width = source.element ? source.element.getBoundingClientRect().width : undefined
              return (
                <div style={{ width: width ? `${width}px` : undefined }}>
                  <BoardCardPreview board={activeBoard} />
                </div>
              )
            }}
          </DragOverlay>
        </DragDropProvider>
      )}

      {/* ── Drawers & Modals ── */}
      <BoardDrawer mode="create" open={createDrawerOpen} onOpenChange={setCreateDrawerOpen} />

      <EditBoardDrawer
        board={editingBoard}
        open={!!editingBoard}
        onOpenChange={(open) => !open && setEditingBoard(null)}
      />

      <DeleteBoardDrawer
        board={deletingBoard}
        open={!!deletingBoard}
        onOpenChange={(open) => !open && setDeletingBoard(null)}
      />

      <ShareBoardModal
        board={sharingBoard}
        open={!!sharingBoard}
        onOpenChange={(open) => !open && setSharingBoard(null)}
      />

      <JoinBoardModal open={joinModalOpen} onOpenChange={setJoinModalOpen} />
    </div>
  )
}

export default BoardsPage

