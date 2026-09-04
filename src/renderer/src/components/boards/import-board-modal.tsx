import { useState, useMemo, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, Download, Loader2, FileText, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import { parseBoardImportText, importContentIntoBoard, ParsedImportData } from '@/lib/board-export-import'

type ImportBoardModalProps = {
  board: Board | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ImportBoardModal({
  board,
  open,
  onOpenChange,
  onSuccess
}: ImportBoardModalProps) {
  const [inputText, setInputText] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parsedData = useMemo<ParsedImportData | null>(() => {
    if (!inputText.trim()) return null
    try {
      setError(null)
      return parseBoardImportText(inputText)
    } catch (err: any) {
      setError(err?.message || 'Failed to parse import string.')
      return null
    }
  }, [inputText])

  const totalTasks = useMemo(() => {
    if (!parsedData) return 0
    return parsedData.lanes.reduce((acc, l) => acc + l.items.length, 0)
  }, [parsedData])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        setInputText(content)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleImport = async () => {
    if (!board?.id || !parsedData) return

    setIsImporting(true)
    setError(null)

    try {
      const ok = await importContentIntoBoard(board.id, parsedData)
      if (!ok) {
        setError('Failed to import content into board.')
        setIsImporting(false)
        return
      }

      setInputText('')
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      console.error('Error importing content:', err)
      setError(err?.message || 'An unexpected error occurred during import.')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-5 max-h-[85vh] flex flex-col overflow-hidden gap-0">
        <DialogHeader className="shrink-0 space-y-1.5 pb-3 border-b">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Download className="size-4" />
            </div>
            <DialogTitle>Import Content into Board</DialogTitle>
          </div>
          <DialogDescription className="text-xs leading-relaxed">
            Import columns and tasks directly into{' '}
            <span className="font-semibold text-foreground">{board?.title || 'this board'}</span> by pasting JSON or CSV text strings.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 py-3 pr-1 custom-scrollbar">
          {/* File Upload Hidden Input & Trigger */}
          <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
            <label className="text-xs font-semibold text-foreground">
              Paste JSON or CSV text string:
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-7 text-xs gap-1.5 cursor-pointer shrink-0"
            >
              <FileText className="size-3.5" /> Upload File (.json / .csv)
            </Button>
          </div>

          {/* Text Area Input */}
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`JSON format:\n{\n  "lanes": [\n    {\n      "lane": "Draft",\n      "items": []\n    },\n    {\n      "lane": "Done",\n      "items": [\n        { "item": "task 1" }\n      ]\n    }\n  ]\n}\n\nCSV format:\nDraft;Belum;Bagus;Done;\n;;;task 1;`}
            className="w-full h-32 sm:h-36 p-3 font-mono text-xs rounded-xl border bg-card text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 custom-scrollbar shrink-0"
            disabled={isImporting}
          />

          {/* Error Banner */}
          {error && (
            <div className="rounded-lg p-3 text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20 flex items-start gap-2 shrink-0">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span className="break-words flex-1">{error}</span>
            </div>
          )}

          {/* Validated Parsed Preview Card */}
          {parsedData && !error && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 shrink-0" /> Ready to import ({parsedData.format} format)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 font-bold uppercase shrink-0">
                  {parsedData.lanes.length} Columns · {totalTasks} Tasks
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-medium text-muted-foreground">Columns Preview:</div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                  {parsedData.lanes.map((lane, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-background border text-[11px] font-medium shrink-0"
                    >
                      <span className="truncate max-w-[120px]">{lane.title}</span>
                      <span className="ml-1 rounded bg-muted px-1.5 py-0.2 text-[9px] font-bold text-muted-foreground shrink-0">
                        {lane.items.length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 pt-3 border-t mt-1 flex flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={isImporting || !parsedData || parsedData.lanes.length === 0}
            className="gap-1.5 cursor-pointer"
          >
            {isImporting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Importing Content...
              </>
            ) : (
              <>
                <Sparkles className="size-4" /> Import Content
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ImportBoardModal
