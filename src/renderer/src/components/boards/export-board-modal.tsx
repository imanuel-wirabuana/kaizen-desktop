import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Copy, Check, Download, Upload, FileJson, FileSpreadsheet } from 'lucide-react'
import { exportBoardToJson, exportBoardToCsv } from '@/lib/board-export-import'

type ExportBoardModalProps = {
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
  const [activeTab, setActiveTab] = useState<'json' | 'csv'>('json')
  const [copied, setCopied] = useState(false)

  const jsonContent = useMemo(() => {
    if (!board) return ''
    return exportBoardToJson(board, lanes, items)
  }, [board, lanes, items])

  const csvContent = useMemo(() => {
    if (!board) return ''
    return exportBoardToCsv(board, lanes, items)
  }, [board, lanes, items])

  const activeContent = activeTab === 'json' ? jsonContent : csvContent

  const handleCopy = () => {
    if (!activeContent) return
    navigator.clipboard.writeText(activeContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!activeContent || !board) return
    const fileExtension = activeTab === 'json' ? 'json' : 'csv'
    const mimeType = activeTab === 'json' ? 'application/json' : 'text/csv'
    const safeTitle = (board.title || 'board').toLowerCase().replace(/[^a-z0-9]/g, '_')
    const fileName = `${safeTitle}_export.${fileExtension}`

    const blob = new Blob([activeContent], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-5 max-h-[85vh] flex flex-col overflow-hidden gap-0">
        <DialogHeader className="shrink-0 space-y-1.5 pb-3 border-b">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Upload className="size-4" />
            </div>
            <DialogTitle>Export Board</DialogTitle>
          </div>
          <DialogDescription className="text-xs leading-relaxed">
            Export columns and tasks for{' '}
            <span className="font-semibold text-foreground">{board?.title || 'this board'}</span> as a JSON or CSV text string.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Format Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-2.5 border-b shrink-0">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab('json')
                setCopied(false)
              }}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'json'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileJson className="size-3.5" /> JSON
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('csv')
                setCopied(false)
              }}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'csv'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileSpreadsheet className="size-3.5" /> CSV
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="h-7 text-xs gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-500" /> Copied
                </>
              ) : (
                <>
                  <Copy className="size-3.5" /> Copy {activeTab.toUpperCase()}
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={handleDownload}
              className="h-7 text-xs gap-1.5 cursor-pointer"
            >
              <Download className="size-3.5" /> Download .{activeTab}
            </Button>
          </div>
        </div>

        {/* Exported Content Textarea Preview */}
        <div className="flex-1 min-h-0 py-3 relative flex flex-col">
          <textarea
            readOnly
            value={activeContent}
            className="w-full h-full min-h-[220px] p-3 font-mono text-xs rounded-xl border bg-muted/20 text-foreground resize-none focus:outline-none custom-scrollbar"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ExportBoardModal
