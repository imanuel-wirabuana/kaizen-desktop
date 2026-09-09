import { useState, useEffect, useRef } from 'react'
import { useSortable } from '@dnd-kit/react/sortable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { InlineEmojiPicker } from '@/components/ui/emoji-picker'
import { BackgroundPickerContent } from '@/components/ui/background-picker'
import { DateTimePicker } from '@/components/ui/date-picker'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent
} from '@/components/ui/context-menu'
import {
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
  Calendar,
  CalendarRange,
  Flag,
  Palette,
  ArrowRight,
  Inbox,
  FolderInput,
  CopyPlus,
  Smile,
  User
} from 'lucide-react'
import { ItemMenuContent } from '@/components/menus/item-menu-content'
import { useItemsStore } from '@/stores/items'
import { useLanesStore } from '@/stores/lanes'
import { useBoardsStore } from '@/stores/boards'
import { getLanesByBoardId, subscribeLanes } from '@/services/lanes'
import { supabase } from '@/lib/supabase'
import { getBoardBackgroundStyleAndClass } from '@/lib/board-utils'
import { cn } from '@/lib/utils'
import { useItemSelectionStore } from '@/stores/item-selection'

export const PRIORITY_CONFIG = {
  0: { label: 'Low', badge: 'bg-muted text-muted-foreground border-border', dot: 'bg-slate-400' },
  1: { label: 'Medium', badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30', dot: 'bg-amber-500' },
  2: { label: 'High', badge: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30', dot: 'bg-orange-500' },
  3: { label: 'Urgent', badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-semibold', dot: 'bg-rose-500' }
} as const

function formatDateRange(
  startDateStr: string | null | undefined,
  dueDateStr: string | null | undefined,
  isCompleted = false
) {
  if (!startDateStr && !dueDateStr) return null
  try {
    const start = startDateStr ? new Date(startDateStr) : null
    const due = dueDateStr ? new Date(dueDateStr) : null
    const validStart = start && !isNaN(start.getTime()) ? start : null
    const validDue = due && !isNaN(due.getTime()) ? due : null

    if (!validStart && !validDue) return null

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const isOverdue = !isCompleted && validDue ? validDue < now : false

    if (validStart && validDue) {
      const sameYear = validStart.getFullYear() === validDue.getFullYear()
      const startFormatted = validStart.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      })
      const dueFormatted = validDue.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: sameYear ? undefined : '2-digit'
      })
      return {
        formatted: `${startFormatted} – ${dueFormatted}`,
        isOverdue,
        isRange: true
      }
    }

    const singleDate = validDue || validStart
    if (!singleDate) return null

    return {
      formatted: singleDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      isOverdue,
      isRange: false
    }
  } catch {
    return null
  }
}



import { TaskForm, TaskFormValues } from './task-form'

type TaskCardProps = {
  item: KanbanItem
  index: number
  readOnly?: boolean
}

export function TaskCard({ item, index, readOnly = false }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingBackground, setEditingBackground] = useState<string | null>(null)

  const updateItem = useItemsStore((s) => s.updateItem)
  const removeItem = useItemsStore((s) => s.removeItem)
  const moveItem = useItemsStore((s) => s.moveItem)
  const duplicateItem = useItemsStore((s) => s.duplicateItem)
  const lanes = useLanesStore((s) => s.lanes)
  const boards = useBoardsStore((s) => s.boards)
  const currentBoard = boards.find((b) => Number(b.id) === Number(item.board_id))
  const otherBoards = boards.filter((b) => String(b.id) !== String(item.board_id))

  const isSelectionMode = useItemSelectionStore((s) => s.isSelectionMode)
  const selectedIds = useItemSelectionStore((s) => s.selectedIds)
  const isSelected = isSelectionMode && selectedIds.includes(String(item.id))
  const isDraggingSelection = useItemSelectionStore((s) => s.isDraggingSelection)
  const enterSelectionMode = useItemSelectionStore((s) => s.enterSelectionMode)
  const toggleItem = useItemSelectionStore((s) => s.toggleItem)

  const { ref, handleRef, isDragSource } = useSortable({
    id: item.id,
    index,
    type: 'item',
    accept: 'item',
    group: item.lane_id !== null ? String(item.lane_id) : 'draft',
    data: { type: 'item', laneId: item.lane_id, item },
    disabled: isEditing || readOnly || (isSelectionMode && !isSelected)
  })

  const isBeingDragged = isDragSource || (isDraggingSelection && isSelected)

  const hasJustDraggedRef = useRef(false)
  const prevBeingDraggedRef = useRef(isBeingDragged)
  useEffect(() => {
    if (prevBeingDraggedRef.current && !isBeingDragged) {
      hasJustDraggedRef.current = true
      const timer = setTimeout(() => {
        hasJustDraggedRef.current = false
      }, 150)
      return () => clearTimeout(timer)
    }
    prevBeingDraggedRef.current = isBeingDragged
  }, [isBeingDragged])

  const handleCardClick = (e: React.MouseEvent) => {
    if (readOnly || isEditing || hasJustDraggedRef.current || isDraggingSelection) return
    if (isSelectionMode) {
      e.stopPropagation()
      toggleItem(item.id)
      return
    }
    if (e.ctrlKey || e.metaKey) {
      e.stopPropagation()
      enterSelectionMode(item.board_id, item.id)
      return
    }
  }

  const handleStartEdit = () => {
    if (readOnly || isSelectionMode) return
    setEditingBackground(item.background || '')
    setIsEditing(true)
  }

  const handleMoveTo = async (targetBoardId: number, targetLaneId: number | null) => {
    if (readOnly) return
    await updateItem(item.id, { board_id: targetBoardId, lane_id: targetLaneId })
  }

  const handleSave = async (values: TaskFormValues) => {
    if (readOnly) return
    setIsEditing(false)
    setEditingBackground(null)
    await updateItem(item.id, {
      title: values.title.trim(),
      icon: values.icon || null,
      description: values.description.trim() || null,
      priority: values.priority,
      start_date: values.startDate ? new Date(values.startDate).toISOString() : null,
      due_date: values.dueDate ? new Date(values.dueDate).toISOString() : null,
      status: values.status,
      assignee: values.assignee?.trim() || null,
      background: values.background || null
    })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditingBackground(null)
  }

  const handleMoveToLane = (targetLaneId: number | null) => {
    if (readOnly) return
    const allItems = useItemsStore.getState().items
    const targetLaneItems = allItems.filter(
      (i) => (targetLaneId === null && i.lane_id === null) || (targetLaneId !== null && i.lane_id === targetLaneId)
    )
    const maxOrder = targetLaneItems.length > 0 ? Math.max(...targetLaneItems.map((i) => i.order ?? 0)) : 0
    const newOrder = maxOrder + 100

    moveItem(item.id, targetLaneId, newOrder)
  }

  const dateRangeInfo = formatDateRange(item.start_date, item.due_date, Boolean(item.status))
  const priorityInfo = PRIORITY_CONFIG[(item.priority ?? 0) as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG[0]

  const activeBackground = isEditing ? (editingBackground ?? item.background) : item.background
  const bgProps = getBoardBackgroundStyleAndClass(activeBackground)
  const hasCustomBackground = Boolean(activeBackground && activeBackground.trim())

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <div
            ref={ref}
            onClick={handleCardClick}
            className={cn(
              'group/card relative flex flex-col rounded-xl border transition-all duration-200 select-none overflow-hidden',
              isSelectionMode && (isSelected ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'),
              isSelected && !isBeingDragged && 'ring-2 ring-primary border-primary bg-primary/5 dark:bg-primary/10 shadow-sm',
              isEditing
                ? cn(
                    'border-primary/50 ring-1 ring-primary/30 shadow-md p-2.5',
                    hasCustomBackground
                      ? bgProps.className
                      : 'bg-neutral-950/10 dark:bg-black/70 backdrop-blur-md'
                  )
                : cn(
                    'border-border/80 bg-background/90 p-2.5 shadow-2xs hover:border-primary/40 hover:shadow-xs',
                    hasCustomBackground ? bgProps.className : '',
                    item.status && !isEditing && 'opacity-40 hover:opacity-80'
                  ),
              isBeingDragged ? 'opacity-30 ring-2 ring-primary/40 shadow-md scale-[0.98]' : ''
            )}
            style={hasCustomBackground ? bgProps.style : undefined}
          >
            {bgProps.isImage && (
              <div className="absolute inset-0 bg-background/70 dark:bg-background/80 pointer-events-none" />
            )}
            {isEditing ? (
              <div className="relative z-10">
                <TaskForm
                  embedded
                  boardId={item.board_id}
                  initialValues={{
                    title: item.title || '',
                    icon: item.icon || null,
                    description: item.description || '',
                    priority: item.priority ?? 0,
                    startDate: item.start_date || null,
                    dueDate: item.due_date || null,
                    status: Boolean(item.status),
                    assignee: item.assignee || null,
                    background: item.background || ''
                  }}
                  onBackgroundChange={setEditingBackground}
                  onSubmit={handleSave}
                  onCancel={handleCancel}
                  submitLabel="Save"
                />
              </div>
            ) : (
              <div className="space-y-1 relative z-10">
                <div className="flex items-center justify-between gap-1.5 min-w-0 min-h-5">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {/* Left Drag Handle (shows on hover, no permanent gap on axis x at rest) */}
                    {!readOnly && (
                      <span
                        ref={handleRef}
                        className="hidden group-hover/card:inline-flex cursor-grab active:cursor-grabbing p-0.5 rounded text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
                        title={
                          isSelectionMode
                            ? selectedIds.length > 1
                              ? `Drag ${selectedIds.length} tasks`
                              : 'Drag task'
                            : 'Drag to reorder task'
                        }
                      >
                        <GripVertical className="size-3.5" />
                      </span>
                    )}

                    {/* Emoji Picker / Icon (identical in both modes) */}
                    {!readOnly ? (
                      <InlineEmojiPicker
                        value={item.icon}
                        onChange={async (emoji) => {
                          await updateItem(item.id, { icon: emoji })
                        }}
                        onClear={async () => {
                          await updateItem(item.id, { icon: null })
                        }}
                        align="start"
                        side="bottom"
                        title="Click to change task emoji"
                        trigger={
                          item.icon ? (
                            <button
                              type="button"
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm shrink-0 leading-none hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                              title="Click to change task emoji"
                            >
                              {item.icon}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex text-muted-foreground/40 hover:text-foreground transition-colors shrink-0 cursor-pointer p-0.5 rounded hover:bg-muted/60"
                              title="Add task emoji"
                            >
                              <Smile className="size-3.5" />
                            </button>
                          )
                        }
                      />
                    ) : (
                      item.icon && <span className="text-sm shrink-0 leading-none">{item.icon}</span>
                    )}

                    {/* Title */}
                    <div
                      className={cn("flex-1 min-w-0", !readOnly && !isSelectionMode && "cursor-pointer")}
                      onDoubleClick={() => !readOnly && !isSelectionMode && handleStartEdit()}
                    >
                      <span className={cn(
                        "text-xs font-bold tracking-tight break-words block transition-colors leading-snug",
                        item.status ? "line-through text-muted-foreground/70" : "text-foreground"
                      )}>
                        {item.title || 'Untitled Task'}
                      </span>
                    </div>
                  </div>

                  {/* Right Action Cluster (Check Button & Options Dropdown - identical dimensions in both modes) */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Check Button (Multi-select checkbox in selection mode, status toggle in normal mode) */}
                    {isSelectionMode ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleItem(item.id)
                        }}
                        className="size-4 flex items-center justify-center cursor-pointer transition-transform active:scale-90"
                        title={isSelected ? 'Deselect task' : 'Select task'}
                      >
                        {isSelected ? (
                          <span className="size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-2xs">
                            <Check className="size-2.5 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="size-4 rounded-full border-2 border-muted-foreground/40 hover:border-primary shrink-0 transition-colors bg-background/60" />
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!readOnly) {
                            updateItem(item.id, { status: !item.status })
                          }
                        }}
                        className={cn(
                          'size-4 flex items-center justify-center transition-all active:scale-90',
                          item.status ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100',
                          readOnly ? 'cursor-default' : 'cursor-pointer'
                        )}
                        title={item.status ? 'Mark as incomplete' : 'Mark as done'}
                      >
                        {item.status ? (
                          <span className="size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-2xs">
                            <Check className="size-2.5 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="size-4 rounded-full border-2 border-muted-foreground/40 hover:border-primary shrink-0 transition-colors bg-background/60" />
                        )}
                      </button>
                    )}

                    {/* Options Dropdown (always rendered to preserve exact 40px cluster width & prevent card thinning) */}
                    {!readOnly && (
                      <div className="opacity-0 group-hover/card:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={(e) => e.stopPropagation()}
                                className="size-5 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 shrink-0"
                                title="Task options"
                              >
                                <MoreHorizontal className="size-3" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-48 text-xs shadow-xl">
                            <ItemMenuContent
                              item={item}
                              variant="dropdown"
                              onEdit={handleStartEdit}
                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {item.description ? (
                  <p className="text-[11px] text-muted-foreground/80 line-clamp-2 font-normal leading-snug">
                    {item.description}
                  </p>
                ) : null}

                {/* Badges Footer (Priority, Date Range & Assignee) */}
                {((item.priority ?? 0) > 0 || dateRangeInfo || item.assignee) && (
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    {/* Priority Badge */}
                    {(item.priority ?? 0) > 0 && (
                      <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold border', priorityInfo.badge)}>
                        <span className={cn('size-1.5 rounded-full', priorityInfo.dot)} />
                        {priorityInfo.label}
                      </span>
                    )}

                    {/* Date Range Badge */}
                    {dateRangeInfo && (
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-medium border bg-muted/60 text-muted-foreground border-border',
                        dateRangeInfo.isOverdue ? 'bg-destructive/15 text-destructive border-destructive/30 font-semibold' : ''
                      )}>
                        {dateRangeInfo.isRange ? (
                          <CalendarRange className="size-2.5" />
                        ) : (
                          <Calendar className="size-2.5" />
                        )}
                        {dateRangeInfo.formatted}
                      </span>
                    )}

                    {/* Assignee Badge */}
                    {item.assignee && (
                      <span
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-medium border bg-primary/10 text-primary border-primary/20 max-w-[120px] truncate"
                        title={`Assignee: ${item.assignee}`}
                      >
                        <User className="size-2.5 shrink-0" />
                        <span className="truncate">{item.assignee}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        }
      />

      {/* Right-click Context Menu (only when editable and not in selection mode) */}
      {!readOnly && !isSelectionMode && (
        <ContextMenuContent className="w-48 text-xs shadow-xl">
          <ItemMenuContent
            item={item}
            variant="context"
            onEdit={handleStartEdit}
          />
        </ContextMenuContent>
      )}
    </ContextMenu>
  )
}

// ── Drag Overlay Preview Component for Task Card ──
export function TaskCardPreview({
  item,
  bulkCount
}: {
  item: KanbanItem
  bulkCount?: number
}) {
  const dateRangeInfo = formatDateRange(item.start_date, item.due_date, Boolean(item.status))
  const priorityInfo = PRIORITY_CONFIG[(item.priority ?? 0) as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG[0]
  const bgProps = getBoardBackgroundStyleAndClass(item.background)
  const hasCustomBackground = Boolean(item.background && item.background.trim())
  const isBulk = Boolean(bulkCount && bulkCount > 1)

  return (
    <div className="relative">
      {/* Background Stack Layer 2 */}
      {isBulk && (
        <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-xl border border-primary/30 bg-card/60 shadow-md rotate-2 pointer-events-none" />
      )}
      {/* Background Stack Layer 1 */}
      {isBulk && (
        <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-xl border border-primary/40 bg-card/80 shadow-lg rotate-1 pointer-events-none" />
      )}

      <div
        className={cn(
          'relative flex flex-col rounded-xl border border-primary/60 bg-background/95 backdrop-blur-md p-2.5 shadow-2xl ring-2 ring-primary/40 opacity-95 pointer-events-none select-none overflow-hidden',
          hasCustomBackground ? bgProps.className : '',
          item.status && 'opacity-40'
        )}
        style={hasCustomBackground ? bgProps.style : undefined}
      >
        {bgProps.isImage && (
          <div className="absolute inset-0 bg-background/70 dark:bg-background/80 pointer-events-none" />
        )}
        <div className="space-y-1 relative z-10">
          <div className="flex items-center justify-between gap-1.5 min-w-0 min-h-5">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {item.icon && <span className="text-sm shrink-0 leading-none">{item.icon}</span>}
              <span className={cn(
                "text-xs font-bold truncate leading-snug",
                item.status ? "line-through text-muted-foreground/70" : "text-foreground"
              )}>
                {item.title || 'Untitled Task'}
              </span>
            </div>

            {isBulk ? (
              <span className="flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-sm shrink-0">
                <span>📦</span>
                <span>{bulkCount} tasks</span>
              </span>
            ) : (
              <span className="size-4 rounded-full border-2 border-primary/40 shrink-0 flex items-center justify-center">
                {item.status && <Check className="size-2.5 stroke-[3]" />}
              </span>
            )}
          </div>

          {/* Description */}
          {item.description ? (
            <p className="text-[11px] text-muted-foreground/80 line-clamp-2 font-normal leading-snug">
              {item.description}
            </p>
          ) : null}

          {/* Badges Footer (Priority, Date Range & Assignee) */}
          {((item.priority ?? 0) > 0 || dateRangeInfo || item.assignee) && (
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              {/* Priority Badge */}
              {(item.priority ?? 0) > 0 && (
                <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold border', priorityInfo.badge)}>
                  <span className={cn('size-1.5 rounded-full', priorityInfo.dot)} />
                  {priorityInfo.label}
                </span>
              )}

              {/* Date Range Badge */}
              {dateRangeInfo && (
                <span className={cn(
                  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-medium border bg-muted/60 text-muted-foreground border-border',
                  dateRangeInfo.isOverdue ? 'bg-destructive/15 text-destructive border-destructive/30 font-semibold' : ''
                )}>
                  {dateRangeInfo.isRange ? (
                    <CalendarRange className="size-2.5" />
                  ) : (
                    <Calendar className="size-2.5" />
                  )}
                  {dateRangeInfo.formatted}
                </span>
              )}

              {/* Assignee Badge */}
              {item.assignee && (
                <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-medium border bg-primary/10 text-primary border-primary/20 max-w-[120px] truncate">
                  <User className="size-2.5 shrink-0" />
                  <span className="truncate">{item.assignee}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
