import { useState, useMemo } from 'react'
import {
  Sparkles,
  PlusCircle,
  Pencil,
  Trash2,
  ArrowRight,
  GripVertical,
  Calendar,
  CheckSquare,
  Square,
  Check,
  Filter,
  Eye,
  Columns3,
  Layers,
  Inbox
} from 'lucide-react'
import { PRIORITY_CONFIG } from '@/components/items'
import { useLanesStore } from '@/stores/lanes'
import { useItemsStore } from '@/stores/items'
import { getBoardBackgroundStyleAndClass } from '@/lib/board-utils'
import { cn } from '@/lib/utils'
import type { BoardMutationProposal, BoardMutationAction } from '@/lib/ai/ai-tools'

export type PreviewDiffStatus = 'added' | 'updated' | 'deleted' | 'unchanged'

export interface PreviewCardItem {
  id: string | number
  board_id: number
  lane_id?: number | string | null
  title: string
  description?: string | null
  priority?: number | null
  icon?: string | null
  due_date?: string | null
  background?: string | null
  diffStatus: PreviewDiffStatus
  actionId?: string
  isSelected?: boolean
  oldTitle?: string
  targetLaneTitle?: string
  movedFromLaneTitle?: string
  isDraft?: boolean
}

export interface PreviewLaneItem {
  id: string | number
  board_id: number
  title: string
  icon?: string | null
  description?: string | null
  order?: number | null
  background?: string | null
  isVirtual?: boolean
  diffStatus: PreviewDiffStatus
  actionId?: string
  isSelected?: boolean
  oldTitle?: string
  items: PreviewCardItem[]
}

interface AiKanbanPreviewBoardProps {
  board: Board | null
  proposal: BoardMutationProposal | null
  selectedIds: Set<string>
  onToggleAction: (actionId: string) => void
  hoveredActionId?: string | null
  onHoverAction?: (actionId: string | null) => void
  filterMode?: 'all' | 'changes_only'
  onFilterModeChange?: (mode: 'all' | 'changes_only') => void
}

export function AiKanbanPreviewBoard({
  board,
  proposal,
  selectedIds,
  onToggleAction,
  hoveredActionId,
  onHoverAction,
  filterMode = 'all',
  onFilterModeChange
}: AiKanbanPreviewBoardProps) {
  const [internalFilterMode, setInternalFilterMode] = useState<'all' | 'changes_only'>(filterMode)
  const activeFilter = onFilterModeChange ? filterMode : internalFilterMode
  const setActiveFilter = onFilterModeChange || setInternalFilterMode

  const boardId = board?.id
  const rawLanes = useLanesStore((s) => s.lanes)
  const rawItems = useItemsStore((s) => s.items)

  // Scope to current board
  const currentLanes = useMemo(() => {
    if (!boardId) return []
    return rawLanes
      .filter((l) => String(l.board_id) === String(boardId))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }, [rawLanes, boardId])

  const currentItems = useMemo(() => {
    if (!boardId) return []
    return rawItems
      .filter((i) => String(i.board_id) === String(boardId))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }, [rawItems, boardId])

  const actions = proposal?.actions || []

  // ── Compute Simulated Board State ──
  const simulatedLanes = useMemo(() => {
    if (!boardId) return []

    // Index proposal actions by target
    const addLaneActions: Extract<BoardMutationAction, { type: 'add_lane' }>[] = []
    const updateLaneMap = new Map<number, Extract<BoardMutationAction, { type: 'update_lane' }>>()
    const deleteLaneMap = new Map<number, Extract<BoardMutationAction, { type: 'delete_lane' }>>()
    const addItemActions: Extract<BoardMutationAction, { type: 'add_item' }>[] = []
    const updateItemMap = new Map<number, Extract<BoardMutationAction, { type: 'update_item' }>>()
    const deleteItemMap = new Map<number, Extract<BoardMutationAction, { type: 'delete_item' }>>()

    for (const act of actions) {
      if (act.type === 'add_lane') addLaneActions.push(act)
      else if (act.type === 'update_lane') updateLaneMap.set(act.lane_id, act)
      else if (act.type === 'delete_lane') deleteLaneMap.set(act.lane_id, act)
      else if (act.type === 'add_item') addItemActions.push(act)
      else if (act.type === 'update_item') updateItemMap.set(act.item_id, act)
      else if (act.type === 'delete_item') deleteItemMap.set(act.item_id, act)
    }

    // 1. Build simulated lanes list
    const resultLanes: PreviewLaneItem[] = []

    // Existing lanes
    for (const l of currentLanes) {
      if (l.id === null) continue
      const laneIdNum = Number(l.id)
      const deleteAct = deleteLaneMap.get(laneIdNum)
      const updateAct = updateLaneMap.get(laneIdNum)

      let diffStatus: PreviewDiffStatus = 'unchanged'
      let title = l.title || 'Untitled Lane'
      let icon = l.icon ?? null
      let description = l.description ?? null
      let background = l.background ?? null
      let oldTitle: string | undefined = undefined
      let actionId: string | undefined = undefined
      let isSelected = false

      if (deleteAct) {
        actionId = deleteAct.id
        isSelected = selectedIds.has(deleteAct.id)
        if (isSelected) {
          diffStatus = 'deleted'
        }
      } else if (updateAct) {
        actionId = updateAct.id
        isSelected = selectedIds.has(updateAct.id)
        if (isSelected) {
          diffStatus = 'updated'
          oldTitle = l.title || ''
          if (updateAct.title) title = updateAct.title
          if (updateAct.icon !== undefined) icon = updateAct.icon
          if (updateAct.description !== undefined) description = updateAct.description
          if (updateAct.background !== undefined) background = updateAct.background
        }
      }

      resultLanes.push({
        id: l.id,
        board_id: Number(boardId),
        title,
        icon,
        description,
        order: l.order,
        background,
        diffStatus,
        actionId,
        isSelected,
        oldTitle,
        items: []
      })
    }

    // Newly added lanes
    for (const act of addLaneActions) {
      const isSelected = selectedIds.has(act.id)
      resultLanes.push({
        id: `sim-lane-${act.id}`,
        board_id: Number(boardId),
        title: act.title || 'Untitled Lane',
        icon: act.icon ?? null,
        description: act.description ?? null,
        background: act.background ?? null,
        order: 9999,
        diffStatus: 'added',
        actionId: act.id,
        isSelected,
        items: []
      })
    }

    // Lookup helpers for destination lanes
    const laneById = new Map<string, PreviewLaneItem>()
    const laneByTitleLower = new Map<string, PreviewLaneItem>()

    for (const lane of resultLanes) {
      laneById.set(String(lane.id), lane)
      if (lane.title) {
        laneByTitleLower.set(lane.title.toLowerCase().trim(), lane)
      }
      if (lane.oldTitle) {
        laneByTitleLower.set(lane.oldTitle.toLowerCase().trim(), lane)
      }
    }

    // Virtual Drafts column if needed
    let draftLane: PreviewLaneItem | null = null
    const getOrCreateDraftLane = (): PreviewLaneItem => {
      if (!draftLane) {
        draftLane = {
          id: 'sim-lane-drafts',
          board_id: Number(boardId),
          title: 'Drafts / Unassigned',
          isVirtual: true,
          diffStatus: 'unchanged',
          items: []
        }
      }
      return draftLane
    }

    // Helper to find existing lane title
    const getLaneTitleById = (lId: number | null | undefined): string | undefined => {
      if (lId === null || lId === undefined) return 'Drafts'
      const found = currentLanes.find((l) => l.id === lId)
      return found?.title || undefined
    }

    // 2. Distribute existing items
    for (const item of currentItems) {
      const delAct = deleteItemMap.get(item.id)
      const updAct = updateItemMap.get(item.id)

      let diffStatus: PreviewDiffStatus = 'unchanged'
      let title = item.title || 'Untitled Task'
      let icon = item.icon
      let description = item.description
      let priority: number | null | undefined = item.priority ?? 0
      let due_date = item.due_date
      let background = item.background
      let laneId: number | string | null = item.lane_id ?? null
      let actionId: string | undefined = undefined
      let isSelected = false
      let movedFromLaneTitle: string | undefined = undefined

      if (delAct) {
        actionId = delAct.id
        isSelected = selectedIds.has(delAct.id)
        if (isSelected) {
          diffStatus = 'deleted'
        }
      } else if (updAct) {
        actionId = updAct.id
        isSelected = selectedIds.has(updAct.id)
        if (isSelected) {
          diffStatus = 'updated'
          if (updAct.title) title = updAct.title
          if (updAct.icon !== undefined) icon = updAct.icon
          if (updAct.description !== undefined) description = updAct.description
          if (updAct.priority !== undefined) priority = updAct.priority
          if (updAct.due_date !== undefined) due_date = updAct.due_date
          if (updAct.background !== undefined) background = updAct.background

          // Check if item moved to another lane
          if (updAct.target_lane_id !== undefined) {
            const oldLaneTitle = getLaneTitleById(item.lane_id)
            laneId = updAct.target_lane_id
            movedFromLaneTitle = oldLaneTitle
          } else if (updAct.target_lane_title) {
            const targetMatchedLane = laneByTitleLower.get(updAct.target_lane_title.toLowerCase().trim())
            if (targetMatchedLane) {
              const oldLaneTitle = getLaneTitleById(item.lane_id)
              laneId = targetMatchedLane.id
              movedFromLaneTitle = oldLaneTitle
            }
          }
        }
      }

      const cardItem: PreviewCardItem = {
        id: item.id,
        board_id: Number(boardId),
        lane_id: laneId,
        title,
        icon,
        description,
        priority,
        due_date,
        background,
        diffStatus,
        actionId,
        isSelected,
        movedFromLaneTitle
      }

      // Route to destination lane
      if (laneId !== null && laneId !== undefined) {
        const destLane = laneById.get(String(laneId))
        if (destLane) {
          destLane.items.push(cardItem)
        } else {
          getOrCreateDraftLane().items.push(cardItem)
        }
      } else {
        getOrCreateDraftLane().items.push(cardItem)
      }
    }

    // 3. Add newly proposed items
    for (const act of addItemActions) {
      const isSelected = selectedIds.has(act.id)
      let targetLane: PreviewLaneItem | undefined = undefined

      if (act.lane_id !== undefined && act.lane_id !== null) {
        targetLane = laneById.get(String(act.lane_id))
      } else if (act.lane_title) {
        targetLane = laneByTitleLower.get(act.lane_title.toLowerCase().trim())
      }

      if (!targetLane && resultLanes.length > 0) {
        targetLane = resultLanes[0] // fallback to first lane
      }

      const cardItem: PreviewCardItem = {
        id: `sim-item-${act.id}`,
        board_id: Number(boardId),
        lane_id: targetLane ? targetLane.id : null,
        title: act.title,
        icon: act.icon ?? null,
        description: act.description ?? null,
        priority: act.priority ?? 0,
        due_date: act.due_date ?? null,
        background: act.background ?? null,
        diffStatus: 'added',
        actionId: act.id,
        isSelected,
        targetLaneTitle: act.lane_title
      }

      if (targetLane) {
        targetLane.items.push(cardItem)
      } else {
        getOrCreateDraftLane().items.push(cardItem)
      }
    }

    // If draft lane was created and has items, prepend or append it
    if (draftLane && (draftLane as PreviewLaneItem).items.length > 0) {
      resultLanes.push(draftLane)
    }

    return resultLanes
  }, [boardId, currentLanes, currentItems, actions, selectedIds])

  const bgProps = getBoardBackgroundStyleAndClass(board?.background)

  // Total stats for header pills
  const stats = useMemo(() => {
    let totalCards = 0
    let addedCards = 0
    let updatedCards = 0
    let deletedCards = 0

    for (const lane of simulatedLanes) {
      for (const card of lane.items) {
        totalCards++
        if (card.diffStatus === 'added' && card.isSelected) addedCards++
        else if (card.diffStatus === 'updated' && card.isSelected) updatedCards++
        else if (card.diffStatus === 'deleted' && card.isSelected) deletedCards++
      }
    }

    return { totalCards, addedCards, updatedCards, deletedCards }
  }, [simulatedLanes])

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background/50 rounded-xl border">
      {/* Preview Top Control Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b bg-muted/20 shrink-0 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Columns3 className="size-3.5 text-primary" />
            Board Simulation Preview
          </span>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            ({simulatedLanes.length} columns, {stats.totalCards} cards)
          </span>
        </div>

        {/* Filter Toggle: All vs Changes Only */}
        <div className="flex items-center gap-1.5">
          <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={cn(
                'px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer',
                activeFilter === 'all'
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              All Tasks
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('changes_only')}
              className={cn(
                'px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1',
                activeFilter === 'changes_only'
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Filter className="size-2.5" />
              Changes Only
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Kanban Columns Canvas */}
      <div
        className={cn(
          'relative flex-1 min-h-0 w-full overflow-x-auto overflow-y-hidden p-3.5 transition-colors',
          bgProps.className
        )}
        style={bgProps.style}
      >
        {bgProps.isImage && (
          <div className="absolute inset-0 bg-background/40 backdrop-blur-xs pointer-events-none" />
        )}

        <div className="relative z-10 flex h-full items-start gap-3.5 pb-2 min-w-max">
          {simulatedLanes.map((lane) => (
            <AiKanbanPreviewLane
              key={lane.id}
              lane={lane}
              filterMode={activeFilter}
              selectedIds={selectedIds}
              onToggleAction={onToggleAction}
              hoveredActionId={hoveredActionId}
              onHoverAction={onHoverAction}
            />
          ))}

          {simulatedLanes.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 w-72 rounded-xl border border-dashed border-muted-foreground/25 bg-muted/5 text-center p-4">
              <Sparkles className="size-6 text-muted-foreground/40 mb-2" />
              <p className="text-xs font-semibold text-foreground">No columns to display</p>
              <p className="text-[11px] text-muted-foreground">The board currently has no lanes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Preview Lane Column Component ──
interface AiKanbanPreviewLaneProps {
  lane: PreviewLaneItem
  filterMode: 'all' | 'changes_only'
  selectedIds: Set<string>
  onToggleAction: (actionId: string) => void
  hoveredActionId?: string | null
  onHoverAction?: (actionId: string | null) => void
}

export function AiKanbanPreviewLane({
  lane,
  filterMode,
  selectedIds,
  onToggleAction,
  hoveredActionId,
  onHoverAction
}: AiKanbanPreviewLaneProps) {
  const isLaneHovered = lane.actionId && hoveredActionId === lane.actionId
  const bgProps = getBoardBackgroundStyleAndClass(lane.background)
  const hasCustomBackground = Boolean(lane.background && lane.background.trim())

  const displayedItems = useMemo(() => {
    if (filterMode === 'changes_only') {
      // In changes_only, show cards that have changes or if lane itself is added/deleted
      return lane.items.filter((item) => item.diffStatus !== 'unchanged')
    }
    return lane.items
  }, [lane.items, filterMode])

  // Hide column entirely in changes_only if it has no changes and no changed items
  if (filterMode === 'changes_only' && lane.diffStatus === 'unchanged' && displayedItems.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'flex h-full max-h-full w-72 shrink-0 flex-col rounded-xl border bg-card/90 backdrop-blur-md shadow-2xs overflow-hidden transition-all duration-200',
        lane.diffStatus === 'added' && lane.isSelected && 'border-emerald-500/50 ring-1 ring-emerald-500/30',
        lane.diffStatus === 'updated' && lane.isSelected && 'border-amber-500/50 ring-1 ring-amber-500/30',
        lane.diffStatus === 'deleted' && lane.isSelected && 'border-rose-500/50 bg-rose-500/5 ring-1 ring-rose-500/30 opacity-75',
        isLaneHovered && 'ring-2 ring-primary shadow-lg',
        !lane.isSelected && lane.actionId && 'opacity-60 grayscale-[0.3]'
      )}
      onMouseEnter={() => lane.actionId && onHoverAction?.(lane.actionId)}
      onMouseLeave={() => lane.actionId && onHoverAction?.(null)}
    >
      {/* Lane Header */}
      <div
        className={cn(
          'flex h-12 shrink-0 items-center justify-between border-b px-3 py-2.5 gap-1.5 transition-all relative overflow-hidden',
          hasCustomBackground
            ? bgProps.className
            : lane.isVirtual
              ? 'bg-primary/5 border-primary/20'
              : 'bg-muted/30 backdrop-blur-md'
        )}
        style={hasCustomBackground ? bgProps.style : undefined}
      >
        {bgProps.isImage && (
          <div className="absolute inset-0 bg-background/60 dark:bg-background/75 pointer-events-none" />
        )}
        <div className="flex items-center gap-1.5 min-w-0 flex-1 relative z-10">
          {lane.actionId && (
            <button
              type="button"
              className="text-primary hover:scale-105 shrink-0 focus:outline-none cursor-pointer"
              onClick={() => lane.actionId && onToggleAction(lane.actionId)}
              title={lane.isSelected ? 'Deselect this column change' : 'Select this column change'}
            >
              {lane.isSelected ? (
                <CheckSquare className="size-3.5 fill-primary/10 text-primary" />
              ) : (
                <Square className="size-3.5 text-muted-foreground" />
              )}
            </button>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {lane.icon && <span className="text-sm shrink-0 leading-tight">{lane.icon}</span>}
              <span className="text-xs font-bold text-foreground truncate">
                {lane.title}
              </span>
            </div>
            {lane.description && (
              <p className="text-[10px] text-muted-foreground truncate" title={lane.description}>
                {lane.description}
              </p>
            )}
            {lane.oldTitle && (
              <p className="text-[10px] text-muted-foreground truncate">
                was: "{lane.oldTitle}"
              </p>
            )}
          </div>
        </div>

        {/* Diff Badge & Item Count */}
        <div className="flex items-center gap-1 shrink-0 relative z-10">
          {lane.diffStatus === 'added' && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md text-[9px] font-bold border',
                lane.isSelected
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-muted text-muted-foreground border-border'
              )}
            >
              + New
            </span>
          )}

          {lane.diffStatus === 'updated' && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md text-[9px] font-bold border',
                lane.isSelected
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : 'bg-muted text-muted-foreground border-border'
              )}
            >
              ~ Renamed
            </span>
          )}

          {lane.diffStatus === 'deleted' && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md text-[9px] font-bold border',
                lane.isSelected
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  : 'bg-muted text-muted-foreground border-border'
              )}
            >
              - Deleted
            </span>
          )}

          <span className="flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-background/90 border text-[10px] font-bold text-muted-foreground shadow-2xs">
            {displayedItems.length}
          </span>
        </div>
      </div>

      {/* Cards List Body */}
      <div className="flex-1 min-h-0 p-2 space-y-2 overflow-y-auto custom-scrollbar">
        {displayedItems.length > 0 ? (
          displayedItems.map((item) => (
            <AiKanbanPreviewCard
              key={item.id}
              item={item}
              selectedIds={selectedIds}
              onToggleAction={onToggleAction}
              hoveredActionId={hoveredActionId}
              onHoverAction={onHoverAction}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/5 gap-1">
            <Sparkles className="size-3.5 text-muted-foreground/50" />
            <span className="text-[11px] font-medium text-muted-foreground/80">
              {filterMode === 'changes_only' ? 'No changed tasks' : 'No tasks in column'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Preview Task Card Component ──
interface AiKanbanPreviewCardProps {
  item: PreviewCardItem
  selectedIds: Set<string>
  onToggleAction: (actionId: string) => void
  hoveredActionId?: string | null
  onHoverAction?: (actionId: string | null) => void
}

export function AiKanbanPreviewCard({
  item,
  selectedIds,
  onToggleAction,
  hoveredActionId,
  onHoverAction
}: AiKanbanPreviewCardProps) {
  const isCardHovered = item.actionId && hoveredActionId === item.actionId
  const priorityInfo =
    PRIORITY_CONFIG[(item.priority ?? 0) as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG[0]
  const bgProps = getBoardBackgroundStyleAndClass(item.background)
  const hasCustomBackground = Boolean(item.background && item.background.trim())

  return (
    <div
      onClick={() => item.actionId && onToggleAction(item.actionId)}
      onMouseEnter={() => item.actionId && onHoverAction?.(item.actionId)}
      onMouseLeave={() => item.actionId && onHoverAction?.(null)}
      className={cn(
        'group flex flex-col rounded-xl border p-2.5 shadow-2xs space-y-1.5 transition-all text-xs relative select-none',
        item.actionId ? 'cursor-pointer' : 'cursor-default',
        // Diff highlights
        item.diffStatus === 'added' && item.isSelected && 'bg-emerald-500/5 border-emerald-500/40 ring-1 ring-emerald-500/20',
        item.diffStatus === 'updated' && item.isSelected && 'bg-amber-500/5 border-amber-500/40 ring-1 ring-amber-500/20',
        item.diffStatus === 'deleted' && item.isSelected && 'bg-rose-500/5 border-rose-500/40 ring-1 ring-rose-500/20 opacity-70',
        item.diffStatus === 'unchanged' && 'bg-card/90 border-border/60 hover:border-border opacity-70 hover:opacity-100',
        // Hover ring
        isCardHovered && 'ring-2 ring-primary shadow-md border-primary scale-[1.01]',
        // Deselected action
        !item.isSelected && item.actionId && 'opacity-50 grayscale-[0.4] bg-muted/20 border-dashed',
        hasCustomBackground ? bgProps.className : ''
      )}
      style={hasCustomBackground ? bgProps.style : undefined}
    >
      {bgProps.isImage && (
        <div className="absolute inset-0 bg-background/70 dark:bg-background/80 pointer-events-none" />
      )}
      <div className="space-y-1.5 relative z-10 w-full">
        {/* Top Header Row with Diff Badge & Checkbox / Priority */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          {item.actionId && (
            <button
              type="button"
              className="text-primary shrink-0 focus:outline-none cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                item.actionId && onToggleAction(item.actionId)
              }}
            >
              {item.isSelected ? (
                <CheckSquare className="size-3.5 fill-primary/10 text-primary" />
              ) : (
                <Square className="size-3.5 text-muted-foreground" />
              )}
            </button>
          )}

          {/* Diff Status Badge */}
          {item.diffStatus === 'added' && (
            <span
              className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9px] font-bold border',
                item.isSelected
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-muted text-muted-foreground border-border'
              )}
            >
              <PlusCircle className="size-2.5" />
              {item.isSelected ? '+ Added' : '(Skipped)'}
            </span>
          )}

          {item.diffStatus === 'updated' && (
            <span
              className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9px] font-bold border',
                item.isSelected
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : 'bg-muted text-muted-foreground border-border'
              )}
            >
              <Pencil className="size-2.5" />
              {item.isSelected ? '~ Updated' : '(Skipped)'}
            </span>
          )}

          {item.diffStatus === 'deleted' && (
            <span
              className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9px] font-bold border',
                item.isSelected
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  : 'bg-muted text-muted-foreground border-border'
              )}
            >
              <Trash2 className="size-2.5" />
              {item.isSelected ? '- Deleted' : '(Retained)'}
            </span>
          )}

          {item.movedFromLaneTitle && item.isSelected && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md text-[9px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 truncate max-w-[140px]">
              <ArrowRight className="size-2" />
              from {item.movedFromLaneTitle}
            </span>
          )}
        </div>

        {/* Priority Badge */}
        {(item.priority ?? 0) > 0 && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-1.5 py-0.2 text-[9px] font-semibold border shrink-0',
              priorityInfo.badge
            )}
          >
            <span className={cn('size-1.5 rounded-full', priorityInfo.dot)} />
            {priorityInfo.label}
          </span>
        )}
      </div>

      {/* Task Title & Icon */}
      <div className="flex items-start gap-1.5 min-w-0">
        {item.icon && <span className="text-sm shrink-0 leading-tight">{item.icon}</span>}
        <span
          className={cn(
            'font-semibold text-xs leading-snug break-words flex-1',
            item.diffStatus === 'deleted' && item.isSelected
              ? 'line-through text-rose-600 dark:text-rose-400'
              : 'text-foreground'
          )}
        >
          {item.title}
        </span>
      </div>

      {/* Description Snippet if present */}
      {item.description && (
        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed pl-0.5">
          {item.description}
        </p>
      )}

      {/* Due Date if present */}
      {item.due_date && (
        <div className="pt-0.5">
          <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.2 text-[9px] font-medium border bg-muted/60 text-muted-foreground border-border">
            <Calendar className="size-2.5" />
            {new Date(item.due_date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric'
            })}
          </span>
        </div>
      )}
      </div>
    </div>
  )
}
