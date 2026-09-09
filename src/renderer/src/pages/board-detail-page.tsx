import { useEffect, useMemo } from 'react'
import { useBreadcrumbs, BreadcrumbItem } from '@/stores/dynamic-breadcrumb'
import { useBoardFoldersStore } from '@/stores/board-folders'
import { useDraftSidebarStore } from '@/stores/draft-sidebar'
import { useBoardAiStore } from '@/stores/board-ai'
import { useActiveBoardWithPreview } from '@/stores/board-preview'
import { DraftSidebar, BulkActionsToolbar } from '@/components/items'
import { BoardAiSidebar } from '@/components/ai'
import { useItemSelectionStore } from '@/stores/item-selection'
import {
  BoardDetailHeader,
  BoardDetailCanvas,
  BoardDetailModals,
  BoardDetailSkeleton,
  BoardNotFound,
  useBoardDetailData,
  useBoardDetailDialogs
} from './board-detail'

export function BoardDetailPage({ boardId }: { boardId: number | string }) {
  // Sidebar stores
  const isDraftOpen = useDraftSidebarStore((s) => s.isOpen)
  const toggleDraftSidebar = useDraftSidebarStore((s) => s.toggle)
  const closeDraftSidebar = useDraftSidebarStore((s) => s.close)

  const isAiOpen = useBoardAiStore((s) => s.isOpen)
  const toggleAiSidebar = useBoardAiStore((s) => s.toggleSidebar)
  const closeAiSidebar = useBoardAiStore((s) => s.closeSidebar)

  // Board folders store
  const boardFolderMap = useBoardFoldersStore((s) => s.boardFolderMap)
  const folders = useBoardFoldersStore((s) => s.folders)

  // Data fetching, realtime sync & permissions
  const {
    board,
    lanes,
    canvasLanes,
    items,
    draftItemsCount,
    loading,
    lanesLoading,
    permissions
  } = useBoardDetailData(boardId)

  // Live board preview when editing
  const activeBoard = useActiveBoardWithPreview(board)

  // Modal dialog states
  const dialogs = useBoardDetailDialogs()

  // Breadcrumb synchronization
  const breadcrumbItems = useMemo(() => {
    if (!activeBoard) return undefined
    const folderId = boardFolderMap[String(activeBoard.id)]
    const folder = folderId ? folders.find((f) => String(f.id) === String(folderId)) : null

    const items: BreadcrumbItem[] = [
      { label: 'Boards', view: { name: 'boards' as const } }
    ]
    if (folder) {
      items.push({
        label: `${folder.icon || '📁'} ${folder.name}`,
        view: { name: 'project-detail' as const, projectId: folder.id }
      })
    }
    items.push({ label: `${activeBoard.icon || '📋'} ${activeBoard.title || 'Untitled Board'}` })
    return items
  }, [activeBoard, boardFolderMap, folders])

  useBreadcrumbs(breadcrumbItems)

  // Cleanup sidebars on unmount
  useEffect(() => {
    return () => {
      closeDraftSidebar()
      closeAiSidebar()
    }
  }, [closeDraftSidebar, closeAiSidebar])

  // Reset item selection when changing boards or unmounting (constraint: only to its board)
  useEffect(() => {
    useItemSelectionStore.getState().setBoardId(boardId)
    return () => {
      useItemSelectionStore.getState().exitSelectionMode()
    }
  }, [boardId])

  // Initial loading skeleton
  if (loading) {
    return <BoardDetailSkeleton />
  }

  // Access revoked or board not found
  if (!board || permissions.permissionRole === null) {
    return <BoardNotFound />
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
      {/* Board Header Bar */}
      <BoardDetailHeader
        board={activeBoard || board}
        permissions={permissions}
        draftItemsCount={draftItemsCount}
        isDraftOpen={isDraftOpen}
        toggleDraftSidebar={toggleDraftSidebar}
        isAiOpen={isAiOpen}
        toggleAiSidebar={toggleAiSidebar}
        onOpenShare={dialogs.openShare}
        onOpenExportImport={dialogs.openExportImport}
        onOpenExport={dialogs.openExport}
        onOpenImport={dialogs.openImport}
        onOpenEdit={dialogs.openEdit}
        onOpenDelete={dialogs.openDelete}
        onOpenLeave={dialogs.openLeave}
      />

      {/* Canvas & Right Sidebars Area */}
      <div className="flex flex-1 min-h-0 w-full gap-3 overflow-hidden">
        <BoardDetailCanvas
          boardId={boardId}
          board={activeBoard || board}
          canvasLanes={canvasLanes}
          lanesLoading={lanesLoading}
          isReadOnly={permissions.isReadOnly}
          canEdit={permissions.canEdit}
        />

        {/* Draft Items Sidebar */}
        <DraftSidebar readOnly={permissions.isReadOnly} />

        {/* AI Assistant Sidebar */}
        <BoardAiSidebar
          board={activeBoard || board}
          lanes={lanes}
          items={items}
          permissionRole={permissions.permissionRole}
        />
      </div>

      {/* Floating Bulk Actions Toolbar (Active Board Only) */}
      {!permissions.isReadOnly && (
        <BulkActionsToolbar boardId={boardId} lanes={lanes} />
      )}

      {/* Drawers & Modals Container */}
      <BoardDetailModals
        boardId={boardId}
        board={board}
        lanes={lanes}
        items={items}
        dialogs={dialogs}
        permissions={permissions}
      />
    </div>
  )
}

export default BoardDetailPage
