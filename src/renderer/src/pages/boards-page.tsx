import { useState, useRef, useEffect, useMemo } from 'react'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { move } from '@dnd-kit/helpers'
import { useNavigationStore } from '@/stores/navigation'
import { useJoinModalStore } from '@/stores/join-modal'
import { useBoardsStore, selectLoading } from '@/stores/boards'
import { useBoardFoldersStore, BoardFolder, categorizeBoards } from '@/stores/board-folders'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BoardDrawer,
  EditBoardDrawer,
  DeleteBoardDrawer,
  LeaveBoardDrawer,
  PinnedGridSection,
  FolderGridSection,
  MyBoardsGridSection,
  SharedBoardsGridSection,
  BoardCardPreview,
  ShareBoardModal,
  FolderModal,
  DeleteFolderDialog
} from '@/components/boards'
import { Plus, Search, Sparkles, LogIn, FolderPlus } from 'lucide-react'

export function BoardsPage() {
  const navigate = useNavigationStore((s) => s.navigate)
  const openJoinModal = useJoinModalStore((s) => s.openModal)
  const loading = useBoardsStore(selectLoading)
  const boards = useBoardsStore((s) => s.boards)
  const currentUserId = useBoardsStore((s) => s.owner)

  const folders = useBoardFoldersStore((s) => s.folders)
  const boardFolderMap = useBoardFoldersStore((s) => s.boardFolderMap)
  const boardOrderMap = useBoardFoldersStore((s) => s.boardOrderMap)
  const moveBoardToFolder = useBoardFoldersStore((s) => s.moveBoardToFolder)
  const reorderCategoryBoards = useBoardFoldersStore((s) => s.reorderCategoryBoards)
  const setFolderCollapse = useBoardFoldersStore((s) => s.setFolderCollapse)

  const [searchQuery, setSearchQuery] = useState('')
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [createBoardFolderId, setCreateBoardFolderId] = useState<string | null>(null)
  const [editingBoard, setEditingBoard] = useState<Board | null>(null)
  const [deletingBoard, setDeletingBoard] = useState<Board | null>(null)
  const [leavingBoard, setLeavingBoard] = useState<Board | null>(null)
  const [sharingBoard, setSharingBoard] = useState<Board | null>(null)
  const [copiedId] = useState<number | string | null>(null)

  // Folder modals state
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<BoardFolder | null>(null)
  const [deletingFolder, setDeletingFolder] = useState<BoardFolder | null>(null)

  // Categorized boards
  const categorized = useMemo(() => {
    return categorizeBoards(boards, folders, boardFolderMap, boardOrderMap, currentUserId)
  }, [boards, folders, boardFolderMap, boardOrderMap, currentUserId])

  // Build the multi-container dictionary for @dnd-kit
  const buildContainers = (): Record<string, Board[]> => {
    const containers: Record<string, Board[]> = {
      pinned: categorized.pinned,
      'my-boards': categorized.myBoards,
      'shared-boards': categorized.sharedBoards
    }
    for (const cf of categorized.customFolders) {
      containers[`folder_${cf.folder.id}`] = cf.boards
    }
    return containers
  }

  // Local DnD items state synced with store
  const [items, setItems] = useState<Record<string, Board[]>>(buildContainers)
  const previousItems = useRef(items)
  const itemsRef = useRef(items)
  itemsRef.current = items

  useEffect(() => {
    setItems(buildContainers())
  }, [categorized])

  // Auto-expand any collapsed folder that contains matching search results
  useEffect(() => {
    if (!searchQuery.trim()) return
    const q = searchQuery.toLowerCase().trim()
    for (const cf of categorized.customFolders) {
      const hasMatch = cf.boards.some(
        (b) => b.title?.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q)
      )
      if (hasMatch && cf.folder.isCollapsed) {
        setFolderCollapse(cf.folder.id, false)
      }
    }
  }, [searchQuery, categorized.customFolders, setFolderCollapse])

  // Filtered views when searching
  const filterBoards = (boardList: Board[]) => {
    if (!searchQuery.trim()) return boardList
    const q = searchQuery.toLowerCase().trim()
    return boardList.filter(
      (b) => b.title?.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q)
    )
  }

  const filteredPinned = useMemo(() => filterBoards(items['pinned'] || []), [items, searchQuery])
  const filteredMyBoards = useMemo(() => filterBoards(items['my-boards'] || []), [items, searchQuery])
  const filteredSharedBoards = useMemo(() => filterBoards(items['shared-boards'] || []), [items, searchQuery])

  const filteredCustomFolders = useMemo(() => {
    return folders.map((folder) => {
      const folderBoards = items[`folder_${folder.id}`] || []
      return {
        folder,
        boards: filterBoards(folderBoards)
      }
    })
  }, [folders, items, searchQuery])

  const totalBoardsCount = boards.length
  const hasBoards = totalBoardsCount > 0
  const hasSearchResults =
    filteredPinned.length > 0 ||
    filteredMyBoards.length > 0 ||
    filteredSharedBoards.length > 0 ||
    filteredCustomFolders.some((cf) => cf.boards.length > 0)

  const handleTogglePin = async (e: any, board: Board) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault()
      e.stopPropagation()
    }
    if (board.id === undefined) return
    const nextPinned = !board.pinned
    await useBoardsStore.getState().updateBoard(board.id, { pinned: nextPinned })
    if (nextPinned) {
      moveBoardToFolder(board.id, null)
    }
  }

  const handleShare = (e: React.MouseEvent, boardId?: number | string) => {
    e.preventDefault()
    e.stopPropagation()
    if (boardId === undefined) return
    const targetBoard = boards.find((b) => b.id === boardId)
    if (targetBoard) {
      setSharingBoard(targetBoard)
    }
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Top Bar Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">My Boards</h1>
          <p className="text-xs text-muted-foreground">Manage owned, shared, and project kanban boards.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateFolderModalOpen(true)}
            className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <FolderPlus className="size-3.5" /> New Project
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openJoinModal()}
            className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <LogIn className="size-3.5" /> Join Board
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setCreateBoardFolderId(null)
              setCreateDrawerOpen(true)
            }}
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
                  className="flex min-h-[160px] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xs"
                >
                  <Skeleton className="h-20 w-full rounded-none shrink-0" />
                  <div className="p-2.5 -mt-3 relative z-[1] flex items-start gap-2.5 flex-1">
                    <Skeleton className="size-8 rounded-xl shrink-0 border-2 border-card" />
                    <div className="space-y-1.5 flex-1 min-w-0 pt-0.5">
                      <Skeleton className="h-3.5 w-3/4 rounded-md" />
                      <Skeleton className="h-3 w-full rounded-md" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/40 px-2.5 py-1 mt-auto">
                    <Skeleton className="h-3 w-16 rounded-full" />
                    <Skeleton className="h-3 w-8 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : !hasBoards && folders.length === 0 ? (
        /* Empty State */
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted p-8 text-center bg-muted/5">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs mb-3">
            <Sparkles className="size-6" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">No boards created yet</h3>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Create a board, set up a project, or join a shared board to get started.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCreateFolderModalOpen(true)}
              className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
            >
              <FolderPlus className="size-3.5" /> New Project
            </Button>
            <Button
              variant="outline"
              onClick={() => openJoinModal()}
              className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
            >
              <LogIn className="size-3.5" /> Join Board
            </Button>
            <Button
              onClick={() => {
                setCreateBoardFolderId(null)
                setCreateDrawerOpen(true)
              }}
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
              const next = move(prev as any, event) as Record<string, Board[]>
              return next
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

            if (source?.type === 'board') {
              const currentContainers = itemsRef.current
              const sourceBoardId = source.id

              let destContainerKey: string | null = null
              for (const [cKey, cBoards] of Object.entries(currentContainers)) {
                if (cBoards.some((b) => String(b.id) === String(sourceBoardId))) {
                  destContainerKey = cKey
                  break
                }
              }

              if (!destContainerKey) return

              // Persist category-specific board order
              const destBoards = currentContainers[destContainerKey] || []
              const destIds = destBoards.map((b) => b.id!).filter(Boolean)
              reorderCategoryBoards(destContainerKey, destIds)

              // Update board pin and folder assignment
              if (destContainerKey === 'pinned') {
                useBoardsStore.getState().updateBoard(sourceBoardId, { pinned: true })
                moveBoardToFolder(sourceBoardId, null)
              } else if (destContainerKey.startsWith('folder_')) {
                const folderId = destContainerKey.replace('folder_', '')
                useBoardsStore.getState().updateBoard(sourceBoardId, { pinned: false })
                moveBoardToFolder(sourceBoardId, folderId)
              } else if (destContainerKey === 'my-boards' || destContainerKey === 'shared-boards') {
                useBoardsStore.getState().updateBoard(sourceBoardId, { pinned: false })
                moveBoardToFolder(sourceBoardId, null)
              }

              // Sync global boards store order
              const allReordered: Board[] = []
              for (const cBoards of Object.values(currentContainers)) {
                allReordered.push(...cBoards)
              }
              if (allReordered.length > 0) {
                useBoardsStore.getState().reorderBoards(allReordered)
              }
            }
          }}
        >
          <div className="space-y-8">
            {/* ── 1. Projects Section (/custom-folderX) ── */}
            {filteredCustomFolders.map(({ folder, boards: folderBoards }) => (
              <FolderGridSection
                key={folder.id}
                folder={folder}
                items={folderBoards}
                copiedId={copiedId}
                onNavigate={(id) => navigate({ name: 'board-detail', boardId: id })}
                onTogglePin={handleTogglePin}
                onEdit={setEditingBoard}
                onShare={handleShare}
                onDelete={setDeletingBoard}
                onLeave={setLeavingBoard}
                onCreateFolder={() => setCreateFolderModalOpen(true)}
                onEditFolder={(f) => setEditingFolder(f)}
                onDeleteFolder={(f) => setDeletingFolder(f)}
                onCreateBoardInFolder={(folderId) => {
                  setCreateBoardFolderId(folderId)
                  setCreateDrawerOpen(true)
                }}
              />
            ))}

            {/* ── 2. Pinned Section (/pinned) ── */}
            {(filteredPinned.length > 0 || !searchQuery) && (
              <PinnedGridSection
                items={filteredPinned}
                copiedId={copiedId}
                onNavigate={(id) => navigate({ name: 'board-detail', boardId: id })}
                onTogglePin={handleTogglePin}
                onEdit={setEditingBoard}
                onShare={handleShare}
                onDelete={setDeletingBoard}
                onLeave={setLeavingBoard}
                onCreateFolder={() => setCreateFolderModalOpen(true)}
              />
            )}

            {/* ── 3. My Boards Section (/my boards) ── */}
            <MyBoardsGridSection
              items={filteredMyBoards}
              copiedId={copiedId}
              onNavigate={(id) => navigate({ name: 'board-detail', boardId: id })}
              onTogglePin={handleTogglePin}
              onEdit={setEditingBoard}
              onShare={handleShare}
              onDelete={setDeletingBoard}
              onLeave={setLeavingBoard}
              onCreateFolder={() => setCreateFolderModalOpen(true)}
              onCreateClick={() => {
                setCreateBoardFolderId(null)
                setCreateDrawerOpen(true)
              }}
            />

            {/* ── 4. Shared Boards Section (/shared boards) ── */}
            {filteredSharedBoards.length > 0 && (
              <SharedBoardsGridSection
                items={filteredSharedBoards}
                copiedId={copiedId}
                onNavigate={(id) => navigate({ name: 'board-detail', boardId: id })}
                onTogglePin={handleTogglePin}
                onEdit={setEditingBoard}
                onShare={handleShare}
                onDelete={setDeletingBoard}
                onLeave={setLeavingBoard}
                onCreateFolder={() => setCreateFolderModalOpen(true)}
              />
            )}
          </div>

          <DragOverlay dropAnimation={null}>
            {(source) => {
              if (!source) return null
              const allBoards = boards
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
      <BoardDrawer
        mode="create"
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
        onSuccess={(created) => {
          if (created && created.id && createBoardFolderId) {
            moveBoardToFolder(created.id, createBoardFolderId)
          }
          setCreateBoardFolderId(null)
        }}
      />

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

      <LeaveBoardDrawer
        board={leavingBoard}
        open={!!leavingBoard}
        onOpenChange={(open) => !open && setLeavingBoard(null)}
      />

      <ShareBoardModal
        board={sharingBoard}
        open={!!sharingBoard}
        onOpenChange={(open) => !open && setSharingBoard(null)}
      />

      {/* Folder Modals */}
      <FolderModal
        open={createFolderModalOpen}
        onOpenChange={setCreateFolderModalOpen}
      />

      <FolderModal
        open={!!editingFolder}
        folderToEdit={editingFolder}
        onOpenChange={(open) => !open && setEditingFolder(null)}
      />

      <DeleteFolderDialog
        folder={deletingFolder}
        open={!!deletingFolder}
        onOpenChange={(open) => !open && setDeletingFolder(null)}
      />
    </div>
  )
}

export default BoardsPage
