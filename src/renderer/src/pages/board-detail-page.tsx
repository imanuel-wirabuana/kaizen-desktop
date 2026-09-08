import { useEffect, useMemo } from 'react'
import { useBreadcrumbs } from '@/stores/dynamic-breadcrumb'
import { useDraftSidebarStore } from '@/stores/draft-sidebar'
import { useBoardAiStore } from '@/stores/board-ai'
import { DraftSidebar } from '@/components/items'
import { BoardAiSidebar } from '@/components/ai'
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

  // Modal dialog states
  const dialogs = useBoardDetailDialogs()

  // Breadcrumb synchronization
  const breadcrumbItems = useMemo(() => {
    if (!board) return undefined
    return [
      { label: 'Boards', view: { name: 'boards' as const } },
      { label: `${board.icon || '📋'} ${board.title || 'Untitled Board'}` }
    ]
  }, [board])

  useBreadcrumbs(breadcrumbItems)

  // Cleanup sidebars on unmount
  useEffect(() => {
    return () => {
      closeDraftSidebar()
      closeAiSidebar()
    }
  }, [closeDraftSidebar, closeAiSidebar])

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
        board={board}
        permissions={permissions}
        draftItemsCount={draftItemsCount}
        isDraftOpen={isDraftOpen}
        toggleDraftSidebar={toggleDraftSidebar}
        isAiOpen={isAiOpen}
        toggleAiSidebar={toggleAiSidebar}
        onOpenShare={dialogs.openShare}
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
          board={board}
          canvasLanes={canvasLanes}
          lanesLoading={lanesLoading}
          isReadOnly={permissions.isReadOnly}
          canEdit={permissions.canEdit}
        />

        {/* Draft Items Sidebar */}
        <DraftSidebar />

        {/* AI Assistant Sidebar */}
        <BoardAiSidebar
          board={board}
          lanes={lanes}
          items={items}
          permissionRole={permissions.permissionRole}
        />
      </div>

      {/* Drawers & Modals Container */}
      <BoardDetailModals
        boardId={boardId}
        board={board}
        lanes={lanes}
        items={items}
        dialogs={dialogs}
      />
    </div>
  )
}

export default BoardDetailPage
