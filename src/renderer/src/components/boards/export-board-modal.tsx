import { ExportImportBoardModal } from './export-import-board-modal'

export type ExportBoardModalProps = {
  board: Board | null
  lanes: Lane[]
  items: KanbanItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportBoardModal({
  board,
  lanes,
  items,
  open,
  onOpenChange
}: ExportBoardModalProps) {
  return (
    <ExportImportBoardModal
      board={board}
      lanes={lanes}
      items={items}
      open={open}
      onOpenChange={onOpenChange}
      initialTab="export"
    />
  )
}

export default ExportBoardModal

