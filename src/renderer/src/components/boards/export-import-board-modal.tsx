import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  ArrowUpDown,
  Upload,
  Download,
  Copy,
  Check,
  FileJson,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  BookOpen,
  Columns,
  LayoutGrid
} from 'lucide-react'
import {
  exportBoardToJson,
  exportBoardToCsv,
  exportBoardToMarkdown,
  parseBoardImportText,
  importContentIntoBoard,
  ParsedImportData
} from '@/lib/board-export-import'
import { ImportKanbanPreview } from './import-kanban-preview'
import { useBoardAiStore } from '@/stores/board-ai'
import { cn } from '@/lib/utils'

export type ExportImportBoardModalProps = {
  board: Board | null
  lanes?: Lane[]
  items?: KanbanItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  initialTab?: 'export' | 'import'
  initialText?: string
  initialData?: ParsedImportData | null
  title?: string
  description?: string
}

type ExportFormat = 'markdown' | 'json' | 'csv'

const SAMPLE_MARKDOWN = `# Project Sprint

## Backlog
- [ ] User authentication flow
  Implement OAuth and JWT session handling
- [ ] Setup database migration scripts
- [ ] Write integration test suite

## In Progress
- [ ] Modernize Export/Import dialog
- [ ] Add Markdown format support

## Review & QA
- [ ] Cross-browser testing

## Done
- [x] Initial repository setup
`

const SAMPLE_JSON = `{
  "board": "Project Sprint",
  "lanes": [
    {
      "title": "To Do",
      "items": [
        { "title": "Setup project dependencies" },
        { "title": "Draft architecture diagram" }
      ]
    },
    {
      "title": "In Progress",
      "items": [
        { "title": "Implement core Kanban views" }
      ]
    },
    {
      "title": "Done",
      "items": [
        { "title": "Project kick-off" }
      ]
    }
  ]
}`

const SAMPLE_CSV = `Backlog;In Progress;Done;
Setup dependencies;Implement views;Project kick-off;
Draft architecture;;;
`

export function ExportImportBoardModal({
  board,
  lanes = [],
  items = [],
  open,
  onOpenChange,
  onSuccess,
  initialTab = 'export',
  initialText,
  initialData,
  title,
  description
}: ExportImportBoardModalProps) {
  // Main mode state: 'export' vs 'import' - defaults strictly to 'export'
  const [activeMode, setActiveMode] = useState<'export' | 'import'>('export')

  // Export state
  const [exportFormat, setExportFormat] = useState<ExportFormat>('markdown')
  const [copied, setCopied] = useState(false)

  // Import state
  const [inputText, setInputText] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [importViewMode, setImportViewMode] = useState<'split' | 'board' | 'editor'>('split')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync mode when initialTab changes or when dialog opens
  useEffect(() => {
    if (open) {
      setActiveMode(initialTab === 'import' ? 'import' : 'export')
      if (initialData) {
        setInputText(
          JSON.stringify(
            {
              board: initialData.boardTitle,
              lanes: initialData.lanes.map((l) => ({
                title: l.title,
                icon: l.icon,
                description: l.description,
                background: l.background,
                items: l.items.map((i) => ({
                  title: i.title,
                  icon: i.icon,
                  description: i.description,
                  priority: i.priority,
                  due_date: i.due_date,
                  background: i.background
                }))
              }))
            },
            null,
            2
          )
        )
      } else if (initialText) {
        setInputText(initialText)
      }
    } else {
      if (initialData || initialText) {
        setInputText('')
      }
      setActiveMode('export')
      setError(null)
    }
  }, [open, initialTab, initialData, initialText])

  // Safe board fallback so export is never blank if board metadata is loading
  const safeBoard = useMemo(() => board || ({ title: 'Board' } as Board), [board])

  // Generated export contents
  const jsonContent = useMemo(() => {
    return exportBoardToJson(safeBoard, lanes, items)
  }, [safeBoard, lanes, items])

  const csvContent = useMemo(() => {
    return exportBoardToCsv(safeBoard, lanes, items)
  }, [safeBoard, lanes, items])

  const markdownContent = useMemo(() => {
    return exportBoardToMarkdown(safeBoard, lanes, items)
  }, [safeBoard, lanes, items])

  const activeExportContent = useMemo(() => {
    switch (exportFormat) {
      case 'json':
        return jsonContent
      case 'csv':
        return csvContent
      case 'markdown':
      default:
        return markdownContent
    }
  }, [exportFormat, jsonContent, csvContent, markdownContent])

  // Parse import content dynamically
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

  const totalImportTasks = useMemo(() => {
    if (!parsedData) return 0
    return parsedData.lanes.reduce((acc, l) => acc + l.items.length, 0)
  }, [parsedData])

  // Export handlers
  const handleCopy = () => {
    if (!activeExportContent) return
    navigator.clipboard.writeText(activeExportContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!activeExportContent) return
    const fileExtension = exportFormat === 'json' ? 'json' : exportFormat === 'csv' ? 'csv' : 'md'
    const mimeType =
      exportFormat === 'json'
        ? 'application/json'
        : exportFormat === 'csv'
          ? 'text/csv'
          : 'text/markdown'

    const safeTitle = (safeBoard.title || 'board').toLowerCase().replace(/[^a-z0-9]/g, '_')
    const fileName = `${safeTitle}_export.${fileExtension}`

    const blob = new Blob([activeExportContent], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Import file handler
  const handleFileSelected = (file: File) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        setInputText(content)
      }
    }
    reader.readAsText(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelected(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelected(file)
    }
  }

  // Run import execution
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

      const pendingMsgId = sessionStorage.getItem('pending_ai_message_id')
      if (pendingMsgId && board.id) {
        useBoardAiStore.getState().markProposalApplied(board.id, pendingMsgId)
        sessionStorage.removeItem('pending_ai_message_id')
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
      <DialogContent
        className="w-[95vw] sm:max-w-4xl md:max-w-5xl lg:max-w-5xl xl:max-w-6xl h-[680px] max-h-[92vh] p-6 flex flex-col overflow-hidden gap-0 rounded-2xl shadow-2xl"
        style={{ width: 'min(95vw, 1100px)', maxWidth: '1100px', height: 'min(90vh, 680px)' }}
      >
        {/* Modal Header */}
        <DialogHeader className="shrink-0 space-y-2 pb-3.5 border-b">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <ArrowUpDown className="size-4.5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold tracking-tight">
                  {title || 'Export / Import Board'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {description || (
                    <>
                      Manage columns and tasks for{' '}
                      <span className="font-semibold text-foreground">
                        {safeBoard.title || 'this board'}
                      </span>
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>

            {/* Primary Mode Switcher (Export vs Import) */}
            <div className="flex items-center rounded-xl bg-muted p-1 shrink-0 border shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveMode('export')}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                  activeMode === 'export'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Upload className="size-3.5" />
                <span>Export</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('import')}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                  activeMode === 'import'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Download className="size-3.5" />
                <span>Import</span>
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* ─── EXPORT VIEW ─── */}
        {activeMode === 'export' && (
          <div className="flex-1 min-h-0 flex flex-col pt-3.5 pb-1 gap-3 overflow-hidden">
            {/* Format Bar & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 shrink-0">
              {/* Format selection buttons */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground mr-1">Format:</span>
                <div className="flex items-center gap-1 rounded-xl bg-muted p-1 border">
                  <button
                    type="button"
                    onClick={() => {
                      setExportFormat('markdown')
                      setCopied(false)
                    }}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                      exportFormat === 'markdown'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <FileText className="size-3.5" /> Markdown (.md)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExportFormat('json')
                      setCopied(false)
                    }}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                      exportFormat === 'json'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <FileJson className="size-3.5" /> JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExportFormat('csv')
                      setCopied(false)
                    }}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                      exportFormat === 'csv'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <FileSpreadsheet className="size-3.5" /> CSV
                  </button>
                </div>

                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium text-muted-foreground ml-2">
                  {lanes.length} Columns · {items.length} Tasks
                </span>
              </div>

              {/* Copy & Download Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="h-8 text-xs gap-1.5 cursor-pointer rounded-lg shadow-2xs"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-emerald-500" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 text-muted-foreground" /> Copy{' '}
                      {exportFormat.toUpperCase()}
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleDownload}
                  className="h-8 text-xs gap-1.5 cursor-pointer rounded-lg shadow-2xs"
                >
                  <Download className="size-3.5" /> Download .
                  {exportFormat === 'markdown' ? 'md' : exportFormat}
                </Button>
              </div>
            </div>

            {/* Code / Content Preview Area */}
            <div className="flex-1 min-h-0 flex flex-col rounded-xl border bg-muted/20 overflow-hidden">
              <div className="flex items-center justify-between px-3.5 py-2 border-b bg-muted/40 text-[11px] text-muted-foreground font-mono shrink-0">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500/70" />
                  {exportFormat.toUpperCase()} Preview (read-only)
                </span>
                <span>
                  {activeExportContent.length} characters ·{' '}
                  {activeExportContent ? activeExportContent.split('\n').length : 0} lines
                </span>
              </div>
              <textarea
                readOnly
                value={activeExportContent}
                placeholder="No content to export."
                className="w-full flex-1 p-3.5 font-mono text-xs text-foreground bg-transparent resize-none focus:outline-none custom-scrollbar leading-relaxed"
              />
            </div>

            <div className="text-[11px] text-muted-foreground shrink-0 flex items-center justify-between">
              <span>
                {exportFormat === 'markdown' &&
                  '💡 Markdown format uses standard headings (##) and checklists (- [ ]). Perfect for Obsidian, GitHub, or Notion.'}
                {exportFormat === 'json' &&
                  '💡 JSON format includes all board attributes, columns, and task details.'}
                {exportFormat === 'csv' &&
                  '💡 Semicolon-delimited CSV format compatible with Excel and spreadsheet tools.'}
              </span>
            </div>
          </div>
        )}

        {/* ─── IMPORT VIEW ─── */}
        {activeMode === 'import' && (
          <div className="flex-1 min-h-0 flex flex-col pt-3.5 pb-1 gap-3 overflow-hidden">
            {/* Import Controls Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-foreground">Source:</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                  Auto-Detect: Markdown · JSON · CSV
                </span>

                {/* View Mode Switcher (Split vs Board vs Editor) */}
                <div className="inline-flex rounded-lg border bg-muted/60 p-0.5 text-xs shrink-0 ml-1">
                  <button
                    type="button"
                    onClick={() => setImportViewMode('split')}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                      importViewMode === 'split'
                        ? 'bg-background text-foreground shadow-2xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    title="Side-by-side view (Editor and Kanban preview)"
                  >
                    <Columns className="size-3.5" />
                    <span className="hidden sm:inline">Split View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportViewMode('board')}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                      importViewMode === 'board'
                        ? 'bg-background text-foreground shadow-2xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    title="Full width Kanban board preview"
                  >
                    <LayoutGrid className="size-3.5" />
                    <span className="hidden sm:inline">Board Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportViewMode('editor')}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                      importViewMode === 'editor'
                        ? 'bg-background text-foreground shadow-2xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    title="Full width text input editor"
                  >
                    <FileText className="size-3.5" />
                    <span className="hidden sm:inline">Editor Only</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {/* Sample templates */}
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setInputText(SAMPLE_MARKDOWN)}
                    className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Load sample Markdown content"
                  >
                    <BookOpen className="size-3 mr-1" /> MD Example
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setInputText(SAMPLE_JSON)}
                    className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Load sample JSON content"
                  >
                    JSON Example
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setInputText(SAMPLE_CSV)}
                    className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Load sample CSV content"
                  >
                    CSV Example
                  </Button>
                </div>

                {inputText && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setInputText('')}
                    className="h-7 px-2 text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
                    title="Clear input"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                )}

                {/* File Upload Trigger */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,.markdown,.json,.csv,.txt"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-7.5 text-xs gap-1.5 cursor-pointer rounded-lg shadow-2xs"
                >
                  <FileText className="size-3.5" /> Upload File (.md / .json / .csv)
                </Button>
              </div>
            </div>

            {/* Layout Body based on importViewMode */}
            {importViewMode === 'split' && (
              <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-3.5 overflow-hidden">
                {/* Left Column: Text Input / File Drop */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDraggingOver(true)
                  }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={handleDrop}
                  className={cn(
                    'flex flex-col h-full rounded-xl border transition-all overflow-hidden relative',
                    isDraggingOver
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                      : 'bg-card border-border'
                  )}
                >
                  <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/40 text-[11px] text-muted-foreground shrink-0 font-medium">
                    <span>Input / Paste Text</span>
                    <span>{inputText.length > 0 ? `${inputText.length} chars` : 'Drop file here'}</span>
                  </div>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Paste Markdown, JSON, or CSV text here...\n\nExample Markdown:\n# Sprint Board\n## Backlog\n- [ ] Task 1\n  Optional description\n- [ ] Task 2\n## Done\n- [x] Task 3`}
                    className="w-full flex-1 p-3 font-mono text-xs text-foreground bg-transparent resize-none focus:outline-none custom-scrollbar leading-relaxed"
                    disabled={isImporting}
                  />
                  {isDraggingOver && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 pointer-events-none">
                      <Download className="size-8 text-primary animate-bounce" />
                      <span className="text-xs font-semibold text-foreground">
                        Drop file to import
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Column: Real Kanban Preview */}
                <ImportKanbanPreview
                  board={safeBoard}
                  parsedData={parsedData}
                  error={error}
                  existingLanes={lanes}
                />
              </div>
            )}

            {importViewMode === 'board' && (
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <ImportKanbanPreview
                  board={safeBoard}
                  parsedData={parsedData}
                  error={error}
                  existingLanes={lanes}
                />
              </div>
            )}

            {importViewMode === 'editor' && (
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDraggingOver(true)
                  }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={handleDrop}
                  className={cn(
                    'flex flex-col h-full rounded-xl border transition-all overflow-hidden relative',
                    isDraggingOver
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                      : 'bg-card border-border'
                  )}
                >
                  <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/40 text-[11px] text-muted-foreground shrink-0 font-medium">
                    <span>Input / Paste Text</span>
                    <span>{inputText.length > 0 ? `${inputText.length} chars` : 'Drop file here'}</span>
                  </div>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Paste Markdown, JSON, or CSV text here...\n\nExample Markdown:\n# Sprint Board\n## Backlog\n- [ ] Task 1\n  Optional description\n- [ ] Task 2\n## Done\n- [x] Task 3`}
                    className="w-full flex-1 p-3 font-mono text-xs text-foreground bg-transparent resize-none focus:outline-none custom-scrollbar leading-relaxed"
                    disabled={isImporting}
                  />
                  {isDraggingOver && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 pointer-events-none">
                      <Download className="size-8 text-primary animate-bounce" />
                      <span className="text-xs font-semibold text-foreground">
                        Drop file to import
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Import Footer Actions */}
            <DialogFooter className="shrink-0 pt-3 border-t mt-auto flex flex-row items-center justify-between gap-2">
              <div className="text-[11px] text-muted-foreground">
                {parsedData && !error ? (
                  <span>
                    Ready to append {totalImportTasks} tasks to{' '}
                    <strong className="text-foreground">{safeBoard.title}</strong>
                  </span>
                ) : (
                  <span>Import adds new columns & tasks directly into the board.</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={isImporting}
                  className="rounded-lg h-8 text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleImport}
                  disabled={isImporting || !parsedData || parsedData.lanes.length === 0}
                  className="rounded-lg h-8 text-xs gap-1.5 cursor-pointer shadow-2xs font-semibold"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" /> Importing...
                    </>
                  ) : (
                    <>
                      <Download className="size-3.5" /> Import{' '}
                      {totalImportTasks > 0 ? `${totalImportTasks} Tasks` : 'Content'}
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ExportImportBoardModal
