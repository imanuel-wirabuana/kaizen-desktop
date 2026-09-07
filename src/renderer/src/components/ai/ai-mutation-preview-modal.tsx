import { useState, useEffect, useMemo } from 'react'
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
  Sparkles,
  PlusCircle,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckSquare,
  Square,
  Columns,
  LayoutGrid,
  ListChecks,
  Filter
} from 'lucide-react'
import { PRIORITY_CONFIG } from '@/components/items'
import { executeBoardMutations } from '@/lib/ai/board-mutations'
import { useBoardAiStore } from '@/stores/board-ai'
import { useLanesStore } from '@/stores/lanes'
import { useItemsStore } from '@/stores/items'
import { AiKanbanPreviewBoard } from './ai-kanban-preview'
import { cn } from '@/lib/utils'
import type { BoardMutationProposal, BoardMutationAction } from '@/lib/ai/ai-tools'

interface AiMutationPreviewModalProps {
  board: Board | null
  proposal: BoardMutationProposal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

type ViewMode = 'split' | 'board' | 'list'

export function AiMutationPreviewModal({
  board,
  proposal,
  open,
  onOpenChange,
  onSuccess
}: AiMutationPreviewModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [hoveredActionId, setHoveredActionId] = useState<string | null>(null)
  const [filterMode, setFilterMode] = useState<'all' | 'changes_only'>('all')

  const allItems = useItemsStore((s) => s.items)
  const allLanes = useLanesStore((s) => s.lanes)

  // Initialize all actions as selected by default when modal opens
  useEffect(() => {
    if (open && proposal) {
      setSelectedIds(new Set(proposal.actions.map((a) => a.id)))
      setError(null)
      setHoveredActionId(null)
    }
  }, [open, proposal])

  const actions = proposal?.actions || []

  // Count actions by category
  const counts = useMemo(() => {
    let added = 0
    let updated = 0
    let deleted = 0
    for (const a of actions) {
      if (a.type.startsWith('add_')) added++
      else if (a.type.startsWith('update_')) updated++
      else if (a.type.startsWith('delete_')) deleted++
    }
    return { added, updated, deleted, total: actions.length }
  }, [actions])

  const selectedActions = useMemo(() => {
    return actions.filter((a) => selectedIds.has(a.id))
  }, [actions, selectedIds])

  const hasDeletions = useMemo(() => {
    return selectedActions.some((a) => a.type.startsWith('delete_'))
  }, [selectedActions])

  const toggleAction = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === actions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(actions.map((a) => a.id)))
    }
  }

  const handleApply = async () => {
    if (!board?.id || selectedActions.length === 0) return

    setIsApplying(true)
    setError(null)

    try {
      const res = await executeBoardMutations(board.id, selectedActions)

      if (res.errors.length > 0 && res.appliedCount === 0) {
        setError(res.errors.join('; '))
        setIsApplying(false)
        return
      }

      // Mark applied in chat
      const pendingMsgId = sessionStorage.getItem('pending_ai_message_id')
      if (pendingMsgId) {
        useBoardAiStore.getState().markProposalApplied(board.id, pendingMsgId)
        sessionStorage.removeItem('pending_ai_message_id')
      }

      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      console.error('Error applying mutations:', err)
      setError(err?.message || 'Failed to apply changes to board.')
    } finally {
      setIsApplying(false)
    }
  }

  const renderActionRow = (action: BoardMutationAction) => {
    const isSelected = selectedIds.has(action.id)
    const isHovered = hoveredActionId === action.id

    let badgeClass = 'bg-primary/10 text-primary border-primary/20'
    let icon = <PlusCircle className="size-3.5 text-emerald-500" />
    let title = ''
    let details = ''

    if (action.type === 'add_lane') {
      badgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
      icon = <PlusCircle className="size-3.5 text-emerald-500" />
      title = `Create Column: "${action.icon ? `${action.icon} ` : ''}${action.title}"`
      const detailsList: string[] = []
      if (action.description) detailsList.push(action.description)
      if (action.background) detailsList.push(`background: ${action.background}`)
      if (detailsList.length > 0) details = detailsList.join(' · ')
    } else if (action.type === 'add_item') {
      badgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
      icon = <PlusCircle className="size-3.5 text-emerald-500" />
      title = `Add Task: "${action.icon ? `${action.icon} ` : ''}${action.title}"`
      const detailsList: string[] = []
      if (action.lane_title) detailsList.push(`in column [${action.lane_title}]`)
      if (action.priority !== undefined && action.priority !== null && action.priority > 0) {
        const pLabel = PRIORITY_CONFIG[action.priority as keyof typeof PRIORITY_CONFIG]?.label
        if (pLabel) detailsList.push(`priority: ${pLabel}`)
      }
      if (action.due_date) {
        detailsList.push(
          `due: ${new Date(action.due_date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric'
          })}`
        )
      }
      if (action.background) detailsList.push(`background: ${action.background}`)
      if (action.description) detailsList.push(action.description)
      if (detailsList.length > 0) details = detailsList.join(' · ')
    } else if (action.type === 'update_lane') {
      badgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
      icon = <Pencil className="size-3.5 text-amber-500" />
      const existingLane = allLanes.find((l) => l.id === action.lane_id)
      const oldLaneTitle = action.old_title || existingLane?.title || 'Untitled Column'
      if (action.title && action.title.trim() !== oldLaneTitle.trim()) {
        title = `Rename Column: "${oldLaneTitle}" → "${action.icon ? `${action.icon} ` : ''}${action.title}"`
      } else {
        title = `Update Column: "${action.icon ? `${action.icon} ` : ''}${action.title || oldLaneTitle}"`
      }
      const detailsList: string[] = []
      if (action.description) detailsList.push(action.description)
      if (action.background) detailsList.push(`background: ${action.background}`)
      if (detailsList.length > 0) details = detailsList.join(' · ')
    } else if (action.type === 'update_item') {
      badgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
      icon = <Pencil className="size-3.5 text-amber-500" />
      const existingItem = allItems.find((i) => i.id === action.item_id)
      const currentTitle = action.old_title || existingItem?.title || 'Untitled Task'
      if (action.title && action.title.trim() !== currentTitle.trim()) {
        title = `Rename Task: "${currentTitle}" → "${action.icon ? `${action.icon} ` : ''}${action.title}"`
      } else {
        title = `Update Task: "${action.icon ? `${action.icon} ` : ''}${action.title || currentTitle}"`
      }
      const detailsList: string[] = []
      if (action.target_lane_title) detailsList.push(`move to [${action.target_lane_title}]`)
      if (action.priority !== undefined && action.priority !== null) {
        const pLabel = PRIORITY_CONFIG[action.priority as keyof typeof PRIORITY_CONFIG]?.label || 'None'
        detailsList.push(`priority: ${pLabel}`)
      }
      if (action.due_date !== undefined) {
        detailsList.push(
          action.due_date
            ? `due: ${new Date(action.due_date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric'
              })}`
            : 'due date cleared'
        )
      }
      if (action.background !== undefined) {
        detailsList.push(action.background ? `background: ${action.background}` : 'background cleared')
      }
      if (action.description !== undefined) {
        detailsList.push(action.description ? `desc: "${action.description}"` : 'description cleared')
      }
      if (detailsList.length > 0) details = detailsList.join(' · ')
    } else if (action.type === 'delete_item') {
      badgeClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
      icon = <Trash2 className="size-3.5 text-rose-500" />
      const existingItem = allItems.find((i) => i.id === action.item_id)
      const taskTitle = action.title || existingItem?.title || 'Untitled Task'
      title = `Delete Task: "${taskTitle}"`
    } else if (action.type === 'delete_lane') {
      badgeClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
      icon = <Trash2 className="size-3.5 text-rose-500" />
      const existingLane = allLanes.find((l) => l.id === action.lane_id)
      const laneTitle = action.title || existingLane?.title || 'Untitled Column'
      title = `Delete Column: "${laneTitle}"`
      details = 'All tasks in this column will also be deleted'
    }

    return (
      <div
        key={action.id}
        onClick={() => toggleAction(action.id)}
        onMouseEnter={() => setHoveredActionId(action.id)}
        onMouseLeave={() => setHoveredActionId(null)}
        className={cn(
          'flex items-start gap-2.5 p-2.5 rounded-xl border text-xs transition-all cursor-pointer select-none',
          isSelected
            ? 'bg-card border-border shadow-2xs'
            : 'bg-muted/30 border-transparent opacity-60',
          isHovered && 'ring-2 ring-primary border-primary bg-primary/5'
        )}
      >
        <button
          type="button"
          className="mt-0.5 text-primary shrink-0 focus:outline-none cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            toggleAction(action.id)
          }}
        >
          {isSelected ? (
            <CheckSquare className="size-4 fill-primary/10 text-primary" />
          ) : (
            <Square className="size-4 text-muted-foreground" />
          )}
        </button>

        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold',
                badgeClass
              )}
            >
              {icon}
              {action.type.replace('_', ' ').toUpperCase()}
            </span>
            <span className="font-semibold text-foreground truncate">{title}</span>
          </div>
          {details && <p className="text-[11px] text-muted-foreground pl-0.5">{details}</p>}
        </div>
      </div>
    )
  }

  // Action checklist panel component
  const renderActionChecklistPanel = (isFullWidth: boolean = false) => (
    <div
      className={cn(
        'flex flex-col min-h-0 overflow-hidden',
        isFullWidth ? 'w-full flex-1' : 'w-full md:w-80 lg:w-96 shrink-0 md:border-r'
      )}
    >
      {/* Counters & Select All */}
      <div className="flex items-center justify-between gap-2 py-2.5 px-3 border-b bg-muted/10 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          {counts.added > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
              +{counts.added} Add
            </span>
          )}
          {counts.updated > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
              ~{counts.updated} Update
            </span>
          )}
          {counts.deleted > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[10px]">
              -{counts.deleted} Delete
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={toggleAll}
          className="text-xs font-semibold text-primary hover:underline cursor-pointer shrink-0"
        >
          {selectedIds.size === actions.length ? 'Deselect All' : 'Select All'} ({selectedIds.size}/
          {actions.length})
        </button>
      </div>

      {/* Action List Scroll View */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 p-3 custom-scrollbar">
        {proposal?.summary && (
          <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground font-medium">
            ✨ {proposal.summary}
          </div>
        )}

        {error && (
          <div className="rounded-lg p-2.5 text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20 flex items-start gap-2">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <span className="break-words flex-1">{error}</span>
          </div>
        )}

        {hasDeletions && (
          <div className="rounded-lg p-2.5 text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-start gap-2">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <span>Deletions will permanently remove items/columns from the board.</span>
          </div>
        )}

        <div className="space-y-1.5">{actions.map(renderActionRow)}</div>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl lg:max-w-6xl xl:max-w-7xl w-[95vw] h-[88vh] max-h-[90vh] p-4 sm:p-5 flex flex-col overflow-hidden gap-0">
        {/* Header with Title & View Mode Switcher */}
        <DialogHeader className="shrink-0 space-y-1.5 pb-3 border-b">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Sparkles className="size-4" />
              </div>
              <div>
                <DialogTitle>Review AI Board Changes</DialogTitle>
                <DialogDescription className="text-xs leading-relaxed mt-0.5">
                  Inspect the proposed additions, updates, and deletions for{' '}
                  <span className="font-semibold text-foreground">
                    {board?.title || 'this board'}
                  </span>
                  .
                </DialogDescription>
              </div>
            </div>

            {/* View Mode Switcher (Split | Board | List) */}
            <div className="flex items-center gap-1.5 rounded-lg border bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                  viewMode === 'split'
                    ? 'bg-background text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Side-by-side view with checklist and board preview"
              >
                <Columns className="size-3.5" />
                <span className="hidden sm:inline">Split View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('board')}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                  viewMode === 'board'
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
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                  viewMode === 'list'
                    ? 'bg-background text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Checklist of changes only"
              >
                <ListChecks className="size-3.5" />
                <span className="hidden sm:inline">Changes List</span>
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Main Content Body */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {viewMode === 'split' && (
            <>
              {renderActionChecklistPanel(false)}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden p-2 md:p-3">
                <AiKanbanPreviewBoard
                  board={board}
                  proposal={proposal}
                  selectedIds={selectedIds}
                  onToggleAction={toggleAction}
                  hoveredActionId={hoveredActionId}
                  onHoverAction={setHoveredActionId}
                  filterMode={filterMode}
                  onFilterModeChange={setFilterMode}
                />
              </div>
            </>
          )}

          {viewMode === 'board' && (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden p-2 md:p-3">
              {/* Board top bar summary with Quick Select */}
              <div className="flex items-center justify-between pb-2 mb-1 border-b text-xs shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Selected:</span>
                  <span className="font-bold text-foreground">
                    {selectedIds.size} of {actions.length} changes
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  {selectedIds.size === actions.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <AiKanbanPreviewBoard
                board={board}
                proposal={proposal}
                selectedIds={selectedIds}
                onToggleAction={toggleAction}
                hoveredActionId={hoveredActionId}
                onHoverAction={setHoveredActionId}
                filterMode={filterMode}
                onFilterModeChange={setFilterMode}
              />
            </div>
          )}

          {viewMode === 'list' && renderActionChecklistPanel(true)}
        </div>

        {/* Footer */}
        <DialogFooter className="shrink-0 pt-3 border-t mt-1 flex flex-row items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground hidden sm:block">
            {selectedActions.length} change{selectedActions.length !== 1 ? 's' : ''} selected
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isApplying}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              disabled={isApplying || selectedActions.length === 0}
              className="gap-1.5 cursor-pointer font-bold"
            >
              {isApplying ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Applying Changes...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" /> Apply Changes ({selectedActions.length})
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
