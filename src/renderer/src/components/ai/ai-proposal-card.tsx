import { Button } from '@/components/ui/button'
import { Sparkles, Check, ChevronRight, PlusCircle, Pencil, Trash2 } from 'lucide-react'
import type { BoardMutationProposal } from '@/lib/ai/ai-tools'

interface AiProposalCardProps {
  proposal: BoardMutationProposal
  applied?: boolean
  onReview: () => void
}

export function AiProposalCard({ proposal, applied, onReview }: AiProposalCardProps) {
  const actions = proposal.actions || []

  let added = 0
  let updated = 0
  let deleted = 0

  for (const a of actions) {
    if (a.type.startsWith('add_')) added++
    else if (a.type.startsWith('update_')) updated++
    else if (a.type.startsWith('delete_')) deleted++
  }

  return (
    <div
      onClick={!applied ? onReview : undefined}
      className={`mt-2.5 rounded-xl border border-primary/30 bg-primary/8 p-3 space-y-2.5 shadow-xs transition-all ${
        !applied ? 'hover:border-primary/50 hover:bg-primary/10 cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          <Sparkles className="size-3.5 text-primary animate-pulse" />
          <span>Proposed Board Changes</span>
        </div>
        <div className="flex items-center gap-1 flex-wrap text-[10px] font-bold">
          {added > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              +{added} Add
            </span>
          )}
          {updated > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
              ~{updated} Update
            </span>
          )}
          {deleted > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400">
              -{deleted} Delete
            </span>
          )}
        </div>
      </div>

      {proposal.summary && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {proposal.summary}
        </p>
      )}

      {/* Action previews */}
      <div className="space-y-1 pt-0.5">
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar">
          {actions.slice(0, 8).map((act, idx) => {
            let icon = <PlusCircle className="size-3 text-emerald-500" />
            let label = ''

            if (act.type === 'add_lane') {
              label = `+ Column "${act.title}"`
            } else if (act.type === 'add_item') {
              label = `+ Task "${act.title}"`
            } else if (act.type === 'update_lane') {
              icon = <Pencil className="size-3 text-amber-500" />
              label = `~ Column "${act.title}"`
            } else if (act.type === 'update_item') {
              icon = <Pencil className="size-3 text-amber-500" />
              label = `~ Task "${act.title || '#' + act.item_id}"`
            } else if (act.type === 'delete_item') {
              icon = <Trash2 className="size-3 text-rose-500" />
              label = `- Task "${act.title || '#' + act.item_id}"`
            } else if (act.type === 'delete_lane') {
              icon = <Trash2 className="size-3 text-rose-500" />
              label = `- Column "${act.title || '#' + act.lane_id}"`
            }

            return (
              <div
                key={idx}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-card/90 border text-[10px] font-medium text-foreground shadow-2xs"
              >
                {icon}
                <span className="truncate max-w-[150px]">{label}</span>
              </div>
            )
          })}
          {actions.length > 8 && (
            <span className="text-[10px] text-muted-foreground self-center px-1 font-medium">
              +{actions.length - 8} more
            </span>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-1 flex items-center justify-end">
        {applied ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            <Check className="size-3.5" /> Changes Applied
          </div>
        ) : (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onReview()
            }}
            className="h-7 text-xs font-bold gap-1.5 cursor-pointer shadow-sm hover:shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Sparkles className="size-3.5" />
            Review & Apply Changes ({actions.length})
            <ChevronRight className="size-3 opacity-70" />
          </Button>
        )}
      </div>
    </div>
  )
}
