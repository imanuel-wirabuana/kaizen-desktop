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
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  CheckSquare,
  Square
} from 'lucide-react'
import { executeBoardMutations } from '@/lib/ai/board-mutations'
import { useBoardAiStore } from '@/stores/board-ai'
import type { BoardMutationProposal, BoardMutationAction } from '@/lib/ai/ai-tools'

interface AiMutationPreviewModalProps {
  board: Board | null
  proposal: BoardMutationProposal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

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

  // Initialize all actions as selected by default when modal opens
  useEffect(() => {
    if (open && proposal) {
      setSelectedIds(new Set(proposal.actions.map((a) => a.id)))
      setError(null)
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

    let badgeClass = 'bg-primary/10 text-primary border-primary/20'
    let icon = <PlusCircle className="size-3.5 text-emerald-500" />
    let title = ''
    let details = ''

    if (action.type === 'add_lane') {
      badgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
      icon = <PlusCircle className="size-3.5 text-emerald-500" />
      title = `Create Column: "${action.title}"`
    } else if (action.type === 'add_item') {
      badgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
      icon = <PlusCircle className="size-3.5 text-emerald-500" />
      title = `Add Task: "${action.title}"`
      if (action.lane_title) details = `in column [${action.lane_title}]`
    } else if (action.type === 'update_lane') {
      badgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
      icon = <Pencil className="size-3.5 text-amber-500" />
      title = `Rename Column: "${action.old_title || '#' + action.lane_id}" → "${action.title}"`
    } else if (action.type === 'update_item') {
      badgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
      icon = <Pencil className="size-3.5 text-amber-500" />
      title = `Update Task #${action.item_id}: "${action.title || action.old_title || ''}"`
      if (action.target_lane_title) details = `move to [${action.target_lane_title}]`
    } else if (action.type === 'delete_item') {
      badgeClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
      icon = <Trash2 className="size-3.5 text-rose-500" />
      title = `Delete Task #${action.item_id}: "${action.title || ''}"`
    } else if (action.type === 'delete_lane') {
      badgeClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
      icon = <Trash2 className="size-3.5 text-rose-500" />
      title = `Delete Column #${action.lane_id}: "${action.title || ''}"`
      details = 'All tasks in this column will also be deleted'
    }

    return (
      <div
        key={action.id}
        onClick={() => toggleAction(action.id)}
        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs transition-all cursor-pointer select-none ${
          isSelected
            ? 'bg-card border-border shadow-2xs'
            : 'bg-muted/30 border-transparent opacity-60'
        }`}
      >
        <button
          type="button"
          className="mt-0.5 text-primary shrink-0 focus:outline-none"
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
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${badgeClass}`}>
              {icon}
              {action.type.replace('_', ' ').toUpperCase()}
            </span>
            <span className="font-semibold text-foreground truncate">{title}</span>
          </div>
          {details && (
            <p className="text-[11px] text-muted-foreground pl-0.5">{details}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-5 max-h-[85vh] flex flex-col overflow-hidden gap-0">
        <DialogHeader className="shrink-0 space-y-1.5 pb-3 border-b">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Sparkles className="size-4" />
            </div>
            <DialogTitle>Review AI Board Changes</DialogTitle>
          </div>
          <DialogDescription className="text-xs leading-relaxed">
            Inspect the proposed additions, updates, and deletions for{' '}
            <span className="font-semibold text-foreground">{board?.title || 'this board'}</span>.
          </DialogDescription>
        </DialogHeader>

        {/* Action Counters & Select All Switcher */}
        <div className="flex items-center justify-between gap-2 py-2.5 border-b shrink-0">
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
            className="text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            {selectedIds.size === actions.length ? 'Deselect All' : 'Select All'} ({selectedIds.size}/{actions.length})
          </button>
        </div>

        {/* Action List Scroll View */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 py-3 pr-1 custom-scrollbar">
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

          <div className="space-y-1.5">
            {actions.map(renderActionRow)}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="shrink-0 pt-3 border-t mt-1 flex flex-row items-center justify-end gap-2">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
