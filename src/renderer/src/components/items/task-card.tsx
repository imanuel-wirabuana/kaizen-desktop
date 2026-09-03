import { useState, useEffect } from 'react'
import { useSortable } from '@dnd-kit/react/sortable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { EmojiPicker, EmojiPickerSearch, EmojiPickerContent } from '@/components/ui/emoji-picker'
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
  Flag,
  Palette,
  ArrowRight,
  Inbox,
  FolderInput,
  CopyPlus
} from 'lucide-react'
import { ItemMenuContent } from '@/components/menus/item-menu-content'
import { useItemsStore } from '@/stores/items'
import { useLanesStore } from '@/stores/lanes'
import { useBoardsStore } from '@/stores/boards'
import { getLanesByBoardId, subscribeLanes } from '@/services/lanes'
import { supabase } from '@/lib/supabase'
import { getBoardBackgroundStyleAndClass } from '@/lib/board-utils'
import { cn } from '@/lib/utils'

export const PRIORITY_CONFIG = {
  0: { label: 'Low', badge: 'bg-muted text-muted-foreground border-border', dot: 'bg-slate-400' },
  1: { label: 'Medium', badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30', dot: 'bg-amber-500' },
  2: { label: 'High', badge: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30', dot: 'bg-orange-500' },
  3: { label: 'Urgent', badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-semibold', dot: 'bg-rose-500' }
} as const

function formatDueDate(dueDateStr: string | null | undefined) {
  if (!dueDateStr) return null
  try {
    const d = new Date(dueDateStr)
    if (isNaN(d.getTime())) return null
    const formatted = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const isOverdue = d < now
    return { formatted, isOverdue }
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

  const updateItem = useItemsStore((s) => s.updateItem)
  const removeItem = useItemsStore((s) => s.removeItem)
  const moveItem = useItemsStore((s) => s.moveItem)
  const duplicateItem = useItemsStore((s) => s.duplicateItem)
  const lanes = useLanesStore((s) => s.lanes)
  const boards = useBoardsStore((s) => s.boards)
  const currentBoard = boards.find((b) => Number(b.id) === Number(item.board_id))
  const otherBoards = boards.filter((b) => String(b.id) !== String(item.board_id))

  const handleMoveTo = async (targetBoardId: number, targetLaneId: number | null) => {
    if (readOnly) return
    await updateItem(item.id, { board_id: targetBoardId, lane_id: targetLaneId })
  }

  const { ref, handleRef, isDragSource } = useSortable({
    id: item.id,
    index,
    type: 'item',
    accept: 'item',
    group: item.lane_id !== null ? String(item.lane_id) : 'draft',
    data: { type: 'item', laneId: item.lane_id, item },
    disabled: isEditing || readOnly
  })

  const handleSave = async (values: TaskFormValues) => {
    setIsEditing(false)
    await updateItem(item.id, {
      title: values.title.trim(),
      icon: values.icon || null,
      description: values.description.trim() || null,
      priority: values.priority,
      due_date: values.dueDate ? new Date(values.dueDate).toISOString() : null,
      background: values.background || null
    })
  }

  const handleMoveToLane = (targetLaneId: number | null) => {
    const allItems = useItemsStore.getState().items
    const targetLaneItems = allItems.filter(
      (i) => (targetLaneId === null && i.lane_id === null) || (targetLaneId !== null && i.lane_id === targetLaneId)
    )
    const maxOrder = targetLaneItems.length > 0 ? Math.max(...targetLaneItems.map((i) => i.order ?? 0)) : 0
    const newOrder = maxOrder + 100

    moveItem(item.id, targetLaneId, newOrder)
  }

  const dueDateInfo = formatDueDate(item.due_date)
  const priorityInfo = PRIORITY_CONFIG[(item.priority ?? 0) as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG[0]

  const bgProps = getBoardBackgroundStyleAndClass(item.background)
  const hasCustomBackground = Boolean(item.background && item.background.trim())

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <div
            ref={ref}
            className={cn(
              'group/card relative flex flex-col rounded-xl border border-border/80 bg-background/90 p-3 shadow-2xs transition-all duration-200 hover:border-primary/40 hover:shadow-xs select-none overflow-hidden',
              isDragSource ? 'opacity-30 ring-2 ring-primary/40 shadow-md scale-[0.98]' : '',
              hasCustomBackground ? bgProps.className : ''
            )}
            style={hasCustomBackground ? bgProps.style : undefined}
          >
            {isEditing ? (
              <TaskForm
                initialValues={{
                  title: item.title || '',
                  icon: item.icon || null,
                  description: item.description || '',
                  priority: item.priority ?? 0,
                  dueDate: item.due_date ? item.due_date : '',
                  background: item.background || ''
                }}
                onSubmit={handleSave}
                onCancel={() => setIsEditing(false)}
                submitLabel="Save"
              />
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-1.5 min-w-0">
                  <div className="flex items-start gap-1.5 min-w-0 flex-1">
                    {!readOnly && (
                      <span
                        ref={handleRef}
                        className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-foreground transition-colors p-0.5 rounded touch-none shrink-0 mt-0.5"
                        title="Drag to reorder task"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GripVertical className="size-3.5" />
                      </span>
                    )}
                    <div
                      className={cn("flex items-start gap-1.5 min-w-0 flex-1", !readOnly && "cursor-pointer")}
                      onDoubleClick={() => !readOnly && setIsEditing(true)}
                    >
                      {item.icon && <span className="text-sm shrink-0 leading-tight">{item.icon}</span>}
                      <span className="text-xs font-medium tracking-tight text-foreground/90 break-words flex-1">
                        {item.title || 'Untitled Task'}
                      </span>
                    </div>
                  </div>

                  {/* Card Options Dropdown */}
                  {!readOnly && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-5 rounded-md text-muted-foreground/60 hover:text-foreground opacity-0 group-hover/card:opacity-100 transition-opacity shrink-0"
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
                          onEdit={() => setIsEditing(true)}
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Description */}
                {item.description ? (
                  <p className="text-[11px] text-muted-foreground/80 line-clamp-2 pl-5 font-normal">
                    {item.description}
                  </p>
                ) : null}

                {/* Badges Footer (Priority & Due Date) */}
                {((item.priority ?? 0) > 0 || dueDateInfo) && (
                  <div className="flex items-center gap-1.5 pt-1 pl-5">
                    {/* Priority Badge */}
                    {(item.priority ?? 0) > 0 && (
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-1.5 py-0.2 text-[9px] font-semibold border', priorityInfo.badge)}>
                        <span className={cn('size-1.5 rounded-full', priorityInfo.dot)} />
                        {priorityInfo.label}
                      </span>
                    )}

                    {/* Due Date Badge */}
                    {dueDateInfo && (
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-full px-1.5 py-0.2 text-[9px] font-medium border bg-muted/60 text-muted-foreground border-border',
                        dueDateInfo.isOverdue ? 'bg-destructive/15 text-destructive border-destructive/30 font-semibold' : ''
                      )}>
                        <Calendar className="size-2.5" />
                        {dueDateInfo.formatted}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        }
      />

      {/* Right-click Context Menu */}
      <ContextMenuContent className="w-48 text-xs shadow-xl">
        <ItemMenuContent
          item={item}
          variant="context"
          onEdit={() => setIsEditing(true)}
        />
      </ContextMenuContent>
    </ContextMenu>
  )
}

// ── Drag Overlay Preview Component for Task Card ──
export function TaskCardPreview({ item }: { item: KanbanItem }) {
  const dueDateInfo = formatDueDate(item.due_date)
  const priorityInfo = PRIORITY_CONFIG[(item.priority ?? 0) as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG[0]
  const bgProps = getBoardBackgroundStyleAndClass(item.background)
  const hasCustomBackground = Boolean(item.background && item.background.trim())

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border border-primary/50 bg-background p-3 shadow-xl ring-2 ring-primary/30 opacity-95 pointer-events-none select-none overflow-hidden',
        hasCustomBackground ? bgProps.className : ''
      )}
      style={hasCustomBackground ? bgProps.style : undefined}
    >
      <div className="flex items-start gap-1.5 min-w-0">
        <GripVertical className="size-3.5 text-primary shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start gap-1.5">
            {item.icon && <span className="text-sm shrink-0 leading-tight">{item.icon}</span>}
            <span className="text-xs font-medium text-foreground truncate">{item.title || 'Untitled Task'}</span>
          </div>

          {((item.priority ?? 0) > 0 || dueDateInfo) && (
            <div className="flex items-center gap-1.5 pt-0.5">
              {(item.priority ?? 0) > 0 && (
                <span className={cn('inline-flex items-center gap-1 rounded-full px-1.5 py-0.2 text-[9px] font-semibold border', priorityInfo.badge)}>
                  <span className={cn('size-1.5 rounded-full', priorityInfo.dot)} />
                  {priorityInfo.label}
                </span>
              )}

              {dueDateInfo && (
                <span className={cn('inline-flex items-center gap-1 rounded-full px-1.5 py-0.2 text-[9px] font-medium border bg-muted/60 text-muted-foreground border-border')}>
                  <Calendar className="size-2.5" />
                  {dueDateInfo.formatted}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
