import { ExportImportBoardModal } from './export-import-board-modal'
import { ParsedImportData } from '@/lib/board-export-import'

export type ImportBoardModalProps = {
  board: Board | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  initialData?: ParsedImportData | null
  initialText?: string
  title?: string
  description?: string
}

export function ImportBoardModal({
  board,
  open,
  onOpenChange,
  onSuccess,
  initialData,
  initialText,
  title,
  description
}: ImportBoardModalProps) {
  return (
    <ExportImportBoardModal
      board={board}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      initialTab="import"
      initialData={initialData}
      initialText={initialText}
      title={title}
      description={description}
    />
  )
}

export default ImportBoardModal
