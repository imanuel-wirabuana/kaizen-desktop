import { useMemo } from 'react'
import {
  Columns3,
  Calendar,
  Sparkles,
  AlertCircle,
  FileText,
  CheckCircle2,
  Layers,
  Inbox
} from 'lucide-react'
import { PRIORITY_CONFIG } from '@/components/items'
import { getBoardBackgroundStyleAndClass } from '@/lib/board-utils'
import { cn } from '@/lib/utils'
import type { ParsedImportData, ParsedImportLane, ParsedImportItem } from '@/lib/board-export-import'

export interface ImportKanbanPreviewProps {
  board: Board | null
  parsedData: ParsedImportData | null
  error?: string | null
  existingLanes?: Lane[]
  className?: string
}

export function ImportKanbanPreview({
  board,
  parsedData,
  error,
  existingLanes = [],
  className
}: ImportKanbanPreviewProps) {
  const bgProps = getBoardBackgroundStyleAndClass(board?.background)

  const totalTasks = useMemo(() => {
    if (!parsedData?.lanes) return 0
    return parsedData.lanes.reduce((acc, lane) => acc + lane.items.length, 0)
  }, [parsedData])

  const existingLaneTitles = useMemo(() => {
    return new Set(existingLanes.map((l) => (l.title || '').trim().toLowerCase()))
  }, [existingLanes])

  return (
    <div
      className={cn(
        'flex flex-col h-full w-full rounded-xl border bg-card/60 backdrop-blur-md overflow-hidden transition-all',
        className
      )}
    >
      {/* Preview Header Control Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b bg-muted/30 shrink-0 gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5 shrink-0">
            <Columns3 className="size-3.5 text-primary" />
            Live Kanban Preview
          </span>

          {parsedData && (
            <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
              ({parsedData.lanes.length} {parsedData.lanes.length === 1 ? 'column' : 'columns'},{' '}
              {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'})
            </span>
          )}
        </div>

        {/* Format Badge & Validation Indicator */}
        <div className="flex items-center gap-1.5 shrink-0">
          {parsedData && !error && (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-2xs',
                  parsedData.format === 'MARKDOWN' &&
                    'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
                  parsedData.format === 'JSON' &&
                    'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                  parsedData.format === 'CSV' &&
                    'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                )}
              >
                {parsedData.format} format
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                <CheckCircle2 className="size-3" /> Valid
              </span>
            </div>
          )}
          {error && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-destructive/10 text-destructive border border-destructive/20 text-[10px] font-semibold">
              <AlertCircle className="size-3" /> Invalid format
            </span>
          )}
        </div>
      </div>

      {/* Target or Detected Board Title Sub-Bar */}
      {parsedData?.boardTitle && (
        <div className="px-3.5 py-1.5 bg-muted/20 border-b text-[11px] text-muted-foreground flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <Layers className="size-3 text-primary/70 shrink-0" />
            <span>Target Board:</span>
            <span className="font-semibold text-foreground truncate">
              {parsedData.boardTitle}
            </span>
          </div>
          {board?.title && parsedData.boardTitle !== board.title && (
            <span className="text-[10px] text-muted-foreground/80 shrink-0">
              (Importing into "{board.title}")
            </span>
          )}
        </div>
      )}

      {/* Canvas Area with Board Background */}
      <div
        className={cn(
          'relative flex-1 min-h-0 w-full overflow-x-auto overflow-y-hidden p-3 transition-colors',
          bgProps.className
        )}
        style={bgProps.style}
      >
        {/* Soft overlay if background is an image */}
        {bgProps.isImage && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-xs pointer-events-none" />
        )}

        {/* Empty / Initial State (No input) */}
        {!parsedData && !error && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/70 border shadow-2xs">
              <FileText className="size-6 text-muted-foreground/60" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h4 className="text-xs font-semibold text-foreground">Waiting for content to preview</h4>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Paste Markdown checklists, JSON, or CSV on the left panel, or click one of the example
                templates above.
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl p-4 bg-destructive/10 text-destructive border border-destructive/25 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertCircle className="size-4 shrink-0" />
                <span>Parsing Error</span>
              </div>
              <p className="text-[11px] break-words leading-relaxed pl-6 opacity-90">{error}</p>
              <p className="text-[10px] text-muted-foreground pl-6 pt-1">
                Tip: Click "MD Example" or "JSON Example" to inspect a valid structure template.
              </p>
            </div>
          </div>
        )}

        {/* Real Kanban Columns Canvas */}
        {parsedData && !error && (
          <div className="relative z-10 flex h-full items-start gap-3 pb-1 min-w-max">
            {parsedData.lanes.map((lane, idx) => {
              const isExisting = existingLaneTitles.has((lane.title || '').trim().toLowerCase())
              return (
                <ImportKanbanPreviewLane
                  key={idx}
                  lane={lane}
                  laneIndex={idx}
                  isExistingOnBoard={isExisting}
                />
              )
            })}

            {parsedData.lanes.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 w-72 rounded-xl border border-dashed border-muted-foreground/25 bg-muted/10 text-center p-4">
                <Sparkles className="size-5 text-muted-foreground/40 mb-2" />
                <p className="text-xs font-semibold text-foreground">No columns found</p>
                <p className="text-[11px] text-muted-foreground">
                  The parsed content did not contain any valid columns.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Single Kanban Column component in the import preview
 */
interface ImportKanbanPreviewLaneProps {
  lane: ParsedImportLane
  laneIndex: number
  isExistingOnBoard?: boolean
}

export function ImportKanbanPreviewLane({
  lane,
  laneIndex,
  isExistingOnBoard
}: ImportKanbanPreviewLaneProps) {
  const bgProps = getBoardBackgroundStyleAndClass(lane.background)
  const hasCustomBackground = Boolean(lane.background && lane.background.trim())

  return (
    <div className="flex h-full max-h-full w-64 sm:w-72 shrink-0 flex-col rounded-xl border border-border/80 bg-card/95 backdrop-blur-md shadow-2xs overflow-hidden transition-all duration-200">
      {/* Lane Header */}
      <div
        className={cn(
          'flex h-12 shrink-0 items-center justify-between border-b px-3 py-2 gap-1.5 transition-all relative overflow-hidden',
          hasCustomBackground ? bgProps.className : 'bg-muted/30 backdrop-blur-md'
        )}
        style={hasCustomBackground ? bgProps.style : undefined}
      >
        {bgProps.isImage && (
          <div className="absolute inset-0 bg-background/60 dark:bg-background/75 pointer-events-none" />
        )}

        <div className="flex items-center gap-1.5 min-w-0 flex-1 relative z-10">
          {lane.icon && <span className="text-sm shrink-0 leading-tight">{lane.icon}</span>}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-foreground truncate">
                {lane.title || `Column ${laneIndex + 1}`}
              </span>
            </div>
            {lane.description && (
              <p className="text-[10px] text-muted-foreground truncate" title={lane.description}>
                {lane.description}
              </p>
            )}
          </div>
        </div>

        {/* Existing Column Badge & Count Pill */}
        <div className="flex items-center gap-1 shrink-0 relative z-10">
          {isExistingOnBoard && (
            <span
              className="inline-flex items-center px-1.5 py-0.2 rounded-md text-[9px] font-semibold bg-primary/10 text-primary border border-primary/20"
              title="This column already exists on the board. New tasks will be added to it."
            >
              Appends
            </span>
          )}

          <span className="flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-background/90 border text-[10px] font-bold text-muted-foreground shadow-2xs">
            {lane.items.length}
          </span>
        </div>
      </div>

      {/* Scrollable Tasks Body */}
      <div className="flex-1 min-h-0 p-2 space-y-2 overflow-y-auto custom-scrollbar">
        {lane.items.length > 0 ? (
          lane.items.map((item, itemIdx) => (
            <ImportKanbanPreviewCard key={itemIdx} item={item} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/5 gap-1">
            <Inbox className="size-3.5 text-muted-foreground/40" />
            <span className="text-[11px] font-medium text-muted-foreground/70">
              No tasks in this column
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Single Task Card component in the import preview
 */
interface ImportKanbanPreviewCardProps {
  item: ParsedImportItem
}

export function ImportKanbanPreviewCard({ item }: ImportKanbanPreviewCardProps) {
  const priorityInfo =
    item.priority !== null && item.priority !== undefined
      ? PRIORITY_CONFIG[item.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG[0]
      : null

  const bgProps = getBoardBackgroundStyleAndClass(item.background)
  const hasCustomBackground = Boolean(item.background && item.background.trim())

  return (
    <div
      className={cn(
        'group flex flex-col rounded-xl border border-border/70 bg-card p-2.5 shadow-2xs space-y-1.5 transition-all text-xs relative select-none hover:border-border hover:shadow-xs',
        hasCustomBackground ? bgProps.className : ''
      )}
      style={hasCustomBackground ? bgProps.style : undefined}
    >
      {bgProps.isImage && (
        <div className="absolute inset-0 bg-background/70 dark:bg-background/80 pointer-events-none rounded-xl" />
      )}

      <div className="space-y-1.5 relative z-10 w-full">
        {/* Top Header Row: Priority & Due Date */}
        {(priorityInfo || item.due_date) && (
          <div className="flex items-center justify-between gap-1 flex-wrap">
            {priorityInfo && (item.priority ?? 0) > 0 ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-1.5 py-0.2 text-[9px] font-semibold border shrink-0',
                  priorityInfo.badge
                )}
              >
                <span className={cn('size-1.5 rounded-full', priorityInfo.dot)} />
                {priorityInfo.label}
              </span>
            ) : (
              <span />
            )}

            {item.due_date && (
              <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.2 text-[9px] font-medium border bg-muted/60 text-muted-foreground border-border shrink-0 ml-auto">
                <Calendar className="size-2.5" />
                {new Date(item.due_date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            )}
          </div>
        )}

        {/* Task Title & Icon */}
        <div className="flex items-start gap-1.5 min-w-0">
          {item.icon && <span className="text-sm shrink-0 leading-tight">{item.icon}</span>}
          <span className="font-semibold text-xs leading-snug break-words flex-1 text-foreground">
            {item.title}
          </span>
        </div>

        {/* Description Snippet */}
        {item.description && (
          <p
            className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed pl-0.5 whitespace-pre-wrap break-words"
            title={item.description}
          >
            {item.description}
          </p>
        )}
      </div>
    </div>
  )
}
