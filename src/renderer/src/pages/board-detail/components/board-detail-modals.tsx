import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/queries/query-keys'
import { useNavigationStore } from '@/stores/navigation'
import { useLanesStore } from '@/stores/lanes'
import { useItemsStore } from '@/stores/items'
import { useBoardAiStore } from '@/stores/board-ai'
import { EditBoardDrawer } from '@/components/boards/edit-board-drawer'
import { DeleteBoardDrawer } from '@/components/boards/delete-board-drawer'
import { LeaveBoardDrawer } from '@/components/boards/leave-board-drawer'
import { ExportBoardModal } from '@/components/boards/export-board-modal'
import { ImportBoardModal } from '@/components/boards/import-board-modal'
import { ShareBoardModal } from '@/components/boards/share-board-modal'
import { AiMutationPreviewModal } from '@/components/ai'
import { BoardDetailDialogs } from '../hooks/use-board-detail-dialogs'

export interface BoardDetailModalsProps {
  boardId: number | string
  board: Board
  lanes: Lane[]
  items: KanbanItem[]
  dialogs: BoardDetailDialogs
}

export function BoardDetailModals({
  boardId,
  board,
  lanes,
  items,
  dialogs
}: BoardDetailModalsProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigationStore((s) => s.navigate)

  // AI Assistant proposal preview state from store
  const isAiPreviewOpen = useBoardAiStore((s) => s.isPreviewOpen)
  const closeAiPreview = useBoardAiStore((s) => s.closePreviewModal)
  const activeAiProposal = useBoardAiStore((s) => s.activeProposal)

  const {
    isEditOpen,
    setIsEditOpen,
    isDeleteOpen,
    setIsDeleteOpen,
    isLeaveOpen,
    setIsLeaveOpen,
    isExportOpen,
    setIsExportOpen,
    isImportOpen,
    setIsImportOpen,
    isShareOpen,
    setIsShareOpen
  } = dialogs

  return (
    <>
      {/* Edit Board Drawer */}
      <EditBoardDrawer
        board={board}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={(updated) => {
          queryClient.setQueryData(queryKeys.boards.detail(boardId), updated)
          queryClient.invalidateQueries({ queryKey: queryKeys.boards.all })
        }}
      />

      {/* Delete Board Drawer */}
      <DeleteBoardDrawer
        board={board}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onSuccess={() => navigate({ name: 'boards' })}
      />

      {/* Leave Board Drawer */}
      <LeaveBoardDrawer
        board={board}
        open={isLeaveOpen}
        onOpenChange={setIsLeaveOpen}
        onSuccess={() => navigate({ name: 'boards' })}
      />

      {/* Export Board Modal */}
      <ExportBoardModal
        board={board}
        lanes={lanes}
        items={items}
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
      />

      {/* Import Content Modal */}
      <ImportBoardModal
        board={board}
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={() => {
          if (boardId) {
            queryClient.invalidateQueries({ queryKey: queryKeys.lanes.list(boardId) })
            queryClient.invalidateQueries({ queryKey: queryKeys.items.list(boardId) })
            useLanesStore.getState().refreshLanes(boardId)
            useItemsStore.getState().refreshItems(boardId)
          }
        }}
      />

      {/* Share Board Modal */}
      <ShareBoardModal board={board} open={isShareOpen} onOpenChange={setIsShareOpen} />

      {/* AI Mutation Review & Bulk CRUD Modal (Add, Update, Delete) */}
      <AiMutationPreviewModal
        board={board}
        proposal={activeAiProposal}
        open={isAiPreviewOpen}
        onOpenChange={(open) => {
          if (!open) closeAiPreview()
        }}
        onSuccess={() => {
          if (boardId) {
            useLanesStore.getState().refreshLanes(boardId)
            useItemsStore.getState().refreshItems(boardId)
          }
        }}
      />
    </>
  )
}
