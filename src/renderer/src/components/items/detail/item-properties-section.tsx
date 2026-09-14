import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  GripVertical,
  Check,
  Circle,
  User,
  Calendar,
  Flag,
  FolderInput,
  Palette,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { AssigneeCombobox } from '@/components/items/assignee-combobox'
import { BackgroundPicker } from '@/components/ui/background-picker'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { PRIORITY_CONFIG } from '@/components/items/task-card'
import { getBoardBackgroundStyleAndClass } from '@/lib/board-utils'
import { cn } from '@/lib/utils'

export type PropertyKey = 'status' | 'assignee' | 'dates' | 'priority' | 'lane' | 'cover'

const DEFAULT_PROPERTY_KEYS: PropertyKey[] = [
  'status',
  'assignee',
  'dates',
  'priority',
  'lane',
  'cover'
]

const STORAGE_KEY = 'kaizen_item_properties_order'

export interface ItemPropertiesSectionProps {
  item: KanbanItem
  boardId?: number | string | null
  lanes: Lane[]
  readOnly?: boolean
  onUpdate: (updates: Partial<KanbanItem>) => void
  layout?: 'inline' | 'vertical'
  className?: string
}

export function ItemPropertiesSection({
  item,
  boardId,
  lanes,
  readOnly = false,
  onUpdate,
  layout = 'inline',
  className
}: ItemPropertiesSectionProps) {
  // Load property order from localStorage
  const [propertyOrder, setPropertyOrder] = useState<PropertyKey[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as PropertyKey[]
        const valid = parsed.filter((k) => DEFAULT_PROPERTY_KEYS.includes(k))
        DEFAULT_PROPERTY_KEYS.forEach((k) => {
          if (!valid.includes(k)) valid.push(k)
        })
        return valid
      }
    } catch {
      // ignore
    }
    return DEFAULT_PROPERTY_KEYS
  })

  // Collapsed state for vertical layout
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Drag and drop states
  const [draggedKey, setDraggedKey] = useState<PropertyKey | null>(null)
  const [dragOverKey, setDragOverKey] = useState<PropertyKey | null>(null)

  const savePropertyOrder = useCallback((newOrder: PropertyKey[]) => {
    setPropertyOrder(newOrder)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder))
    } catch {
      // ignore
    }
  }, [])

  const handleDragStart = (e: React.DragEvent, key: PropertyKey) => {
    if (readOnly) return
    setDraggedKey(key)
    e.dataTransfer.setData('text/plain', key)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, key: PropertyKey) => {
    if (readOnly || !draggedKey || draggedKey === key) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverKey(key)
  }

  const handleDrop = (e: React.DragEvent, targetKey: PropertyKey) => {
    e.preventDefault()
    if (!draggedKey || draggedKey === targetKey) {
      setDraggedKey(null)
      setDragOverKey(null)
      return
    }

    const currentOrder = [...propertyOrder]
    const fromIndex = currentOrder.indexOf(draggedKey)
    const toIndex = currentOrder.indexOf(targetKey)

    if (fromIndex !== -1 && toIndex !== -1) {
      currentOrder.splice(fromIndex, 1)
      currentOrder.splice(toIndex, 0, draggedKey)
      savePropertyOrder(currentOrder)
    }

    setDraggedKey(null)
    setDragOverKey(null)
  }

  const handleDragEnd = () => {
    setDraggedKey(null)
    setDragOverKey(null)
  }

  const currentLane = useMemo(() => {
    return lanes.find((l) =>
      item.lane_id === null ? l.id === null : String(l.id) === String(item.lane_id)
    )
  }, [lanes, item.lane_id])

  const priorityInfo =
    PRIORITY_CONFIG[(item.priority ?? 0) as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG[0]

  const bgProps = getBoardBackgroundStyleAndClass(item.background)
  const hasCover = Boolean(item.background && item.background.trim())

  // Render individual property in compact inline pill form
  const renderInlinePill = (key: PropertyKey) => {
    switch (key) {
      case 'status':
        return (
          <button
            type="button"
            disabled={readOnly}
            onClick={() => {
              if (!readOnly) onUpdate({ status: !item.status })
            }}
            className={cn(
              'h-7 inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors cursor-pointer select-none',
              item.status
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/50'
            )}
            title={item.status ? 'Mark incomplete' : 'Mark done'}
          >
            {item.status ? (
              <>
                <Check className="size-3 stroke-[3]" />
                <span>Done</span>
              </>
            ) : (
              <>
                <Circle className="size-3" />
                <span>In Progress</span>
              </>
            )}
          </button>
        )

      case 'assignee':
        return (
          <div className="inline-flex items-center">
            <AssigneeCombobox
              value={item.assignee || null}
              onChange={(newAssignee) => {
                onUpdate({ assignee: newAssignee })
              }}
              boardId={boardId}
              disabled={readOnly}
              placeholder="Assignee"
              className="h-7 text-xs px-2.5 bg-muted/40 border-border/50 hover:bg-muted font-normal rounded-md gap-1.5 shadow-none max-w-[160px]"
            />
          </div>
        )

      case 'dates':
        return (
          <div className="inline-flex items-center">
            <DateRangePicker
              startDate={item.start_date || null}
              dueDate={item.due_date || null}
              onChange={(range) => {
                onUpdate({
                  start_date: range.startDate,
                  due_date: range.dueDate
                })
              }}
              disabled={readOnly}
              placeholder="Dates"
              className="h-7 text-xs px-2.5 bg-muted/40 border-border/50 hover:bg-muted font-normal rounded-md gap-1.5 shadow-none"
            />
          </div>
        )

      case 'priority':
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={readOnly}
              render={
                <button
                  type="button"
                  className="h-7 inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium border border-border/50 bg-muted/40 hover:bg-muted transition-colors cursor-pointer select-none"
                  title="Set priority"
                >
                  <span className={cn('size-2 rounded-full', priorityInfo.dot)} />
                  <span>{priorityInfo.label}</span>
                </button>
              }
            />
            <DropdownMenuContent align="start" className="w-36 text-xs">
              {([0, 1, 2, 3] as const).map((p) => {
                const cfg = PRIORITY_CONFIG[p]
                return (
                  <DropdownMenuItem
                    key={p}
                    onClick={() => onUpdate({ priority: p })}
                    className={cn(item.priority === p ? 'bg-primary/10 font-bold' : '')}
                  >
                    <span className={cn('size-2 rounded-full mr-2', cfg.dot)} />
                    <span>{cfg.label}</span>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )

      case 'lane':
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={readOnly}
              render={
                <button
                  type="button"
                  className="h-7 inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium border border-border/50 bg-muted/40 hover:bg-muted transition-colors cursor-pointer select-none max-w-[150px]"
                  title="Change column"
                >
                  {currentLane?.icon ? (
                    <span className="text-xs leading-none">{currentLane.icon}</span>
                  ) : (
                    <FolderInput className="size-3 text-muted-foreground/70" />
                  )}
                  <span className="truncate">{currentLane?.title || (item.lane_id === null ? 'Draft' : 'Column')}</span>
                </button>
              }
            />
            <DropdownMenuContent align="start" className="w-48 text-xs">
              <DropdownMenuItem
                onClick={() => onUpdate({ lane_id: null })}
                className={cn(item.lane_id === null ? 'bg-primary/10 text-primary font-bold' : '')}
              >
                <span>📥 Draft</span>
              </DropdownMenuItem>
              {lanes
                .filter((l) => l.id !== null)
                .map((lane) => (
                  <DropdownMenuItem
                    key={lane.id}
                    onClick={() => onUpdate({ lane_id: lane.id })}
                    className={cn(
                      String(lane.id) === String(item.lane_id) ? 'bg-primary/10 text-primary font-bold' : ''
                    )}
                  >
                    {lane.icon && <span className="mr-1.5">{lane.icon}</span>}
                    <span>{lane.title || 'Untitled Column'}</span>
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )

      case 'cover':
        return (
          <div className="inline-flex items-center gap-0.5">
            <BackgroundPicker
              value={item.background}
              onChange={(newBg) => {
                onUpdate({ background: newBg || null })
              }}
              trigger={
                <button
                  type="button"
                  disabled={readOnly}
                  className="h-7 inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium border border-border/50 bg-muted/40 hover:bg-muted transition-colors cursor-pointer select-none"
                  title="Choose cover background"
                >
                  {hasCover ? (
                    <div
                      className={cn('size-3 rounded border border-border/50 shrink-0', bgProps.className)}
                      style={bgProps.style}
                    />
                  ) : (
                    <Palette className="size-3 text-muted-foreground/70" />
                  )}
                  <span>{hasCover ? 'Cover' : 'Add cover'}</span>
                </button>
              }
            />
            {hasCover && !readOnly && (
              <button
                type="button"
                onClick={() => onUpdate({ background: null })}
                className="p-1 text-muted-foreground/60 hover:text-foreground rounded hover:bg-muted transition-colors cursor-pointer"
                title="Remove cover"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        )

      default:
        return null
    }
  }

  // Render individual property in vertical row form (for vertical layout)
  const renderVerticalRow = (key: PropertyKey) => {
    switch (key) {
      case 'status':
        return (
          <div key="status" className="flex items-center">
            <button
              type="button"
              disabled={readOnly}
              onClick={() => {
                if (!readOnly) onUpdate({ status: !item.status })
              }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors cursor-pointer',
                item.status
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted/80'
              )}
              title={item.status ? 'Mark incomplete' : 'Mark done'}
            >
              {item.status ? (
                <>
                  <Check className="size-3 stroke-[3]" />
                  <span>Done</span>
                </>
              ) : (
                <>
                  <Circle className="size-3" />
                  <span>In Progress</span>
                </>
              )}
            </button>
          </div>
        )

      case 'assignee':
        return (
          <div key="assignee" className="flex-1 min-w-0 max-w-xs">
            <AssigneeCombobox
              value={item.assignee || null}
              onChange={(newAssignee) => {
                onUpdate({ assignee: newAssignee })
              }}
              boardId={boardId}
              disabled={readOnly}
              placeholder="Empty"
              className="h-7 text-xs px-2 w-full justify-start font-normal border-transparent hover:border-border hover:bg-muted/50 shadow-none"
            />
          </div>
        )

      case 'dates':
        return (
          <div key="dates" className="flex-1 min-w-0 max-w-sm">
            <DateRangePicker
              startDate={item.start_date || null}
              dueDate={item.due_date || null}
              onChange={(range) => {
                onUpdate({
                  start_date: range.startDate,
                  due_date: range.dueDate
                })
              }}
              disabled={readOnly}
              placeholder="Empty"
              className="h-7 text-xs px-2 w-full justify-start font-normal border-transparent hover:border-border hover:bg-muted/50 shadow-none"
            />
          </div>
        )

      case 'priority':
        return (
          <div key="priority" className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={readOnly}
                render={
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-foreground hover:bg-muted/60 transition-colors cursor-pointer border border-transparent hover:border-border"
                    title="Set priority"
                  >
                    <span className={cn('size-2 rounded-full', priorityInfo.dot)} />
                    <span className="font-medium">{priorityInfo.label}</span>
                  </button>
                }
              />
              <DropdownMenuContent align="start" className="w-36 text-xs">
                {([0, 1, 2, 3] as const).map((p) => {
                  const cfg = PRIORITY_CONFIG[p]
                  return (
                    <DropdownMenuItem
                      key={p}
                      onClick={() => onUpdate({ priority: p })}
                      className={cn(item.priority === p ? 'bg-primary/10 font-bold' : '')}
                    >
                      <span className={cn('size-2 rounded-full mr-2', cfg.dot)} />
                      <span>{cfg.label}</span>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )

      case 'lane':
        return (
          <div key="lane" className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={readOnly}
                render={
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-foreground hover:bg-muted/60 transition-colors cursor-pointer border border-transparent hover:border-border"
                    title="Change column"
                  >
                    {currentLane?.icon ? (
                      <span className="text-sm leading-none">{currentLane.icon}</span>
                    ) : (
                      <FolderInput className="size-3.5 text-muted-foreground/70" />
                    )}
                    <span className="truncate max-w-[160px] font-medium">
                      {currentLane?.title || (item.lane_id === null ? 'Draft' : 'Column')}
                    </span>
                  </button>
                }
              />
              <DropdownMenuContent align="start" className="w-48 text-xs">
                <DropdownMenuItem
                  onClick={() => onUpdate({ lane_id: null })}
                  className={cn(item.lane_id === null ? 'bg-primary/10 text-primary font-bold' : '')}
                >
                  <span>📥 Draft</span>
                </DropdownMenuItem>
                {lanes
                  .filter((l) => l.id !== null)
                  .map((lane) => (
                    <DropdownMenuItem
                      key={lane.id}
                      onClick={() => onUpdate({ lane_id: lane.id })}
                      className={cn(
                        String(lane.id) === String(item.lane_id) ? 'bg-primary/10 text-primary font-bold' : ''
                      )}
                    >
                      {lane.icon && <span className="mr-1.5">{lane.icon}</span>}
                      <span>{lane.title || 'Untitled Column'}</span>
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )

      case 'cover':
        return (
          <div key="cover" className="flex items-center gap-1.5">
            <BackgroundPicker
              value={item.background}
              onChange={(newBg) => {
                onUpdate({ background: newBg || null })
              }}
              trigger={
                <button
                  type="button"
                  disabled={readOnly}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-foreground hover:bg-muted/60 transition-colors cursor-pointer border border-transparent hover:border-border"
                  title="Choose cover background"
                >
                  {hasCover ? (
                    <div
                      className={cn('size-3.5 rounded border border-border/50 shrink-0', bgProps.className)}
                      style={bgProps.style}
                    />
                  ) : (
                    <Palette className="size-3.5 text-muted-foreground/70" />
                  )}
                  <span className="font-medium">
                    {hasCover ? 'Custom Cover' : 'Empty'}
                  </span>
                </button>
              }
            />
            {hasCover && !readOnly && (
              <button
                type="button"
                onClick={() => onUpdate({ background: null })}
                className="p-1 text-muted-foreground/60 hover:text-foreground rounded hover:bg-muted transition-colors cursor-pointer"
                title="Remove cover"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const PROPERTY_METADATA: Record<PropertyKey, { label: string; icon: React.ReactNode }> = {
    status: { label: 'Status', icon: <Check className="size-3.5" /> },
    assignee: { label: 'Assignee', icon: <User className="size-3.5" /> },
    dates: { label: 'Dates', icon: <Calendar className="size-3.5" /> },
    priority: { label: 'Priority', icon: <Flag className="size-3.5" /> },
    lane: { label: 'Column', icon: <FolderInput className="size-3.5" /> },
    cover: { label: 'Cover', icon: <Palette className="size-3.5" /> }
  }

  // ── INLINE LAYOUT: Sleek horizontal row of interactive property pills ──
  if (layout === 'inline') {
    return (
      <div className={cn('flex flex-wrap items-center gap-1.5 select-none', className)}>
        {propertyOrder.map((key) => {
          const isDragging = draggedKey === key
          const isOver = dragOverKey === key

          return (
            <div
              key={key}
              draggable={!readOnly}
              onDragStart={(e) => handleDragStart(e, key)}
              onDragOver={(e) => handleDragOver(e, key)}
              onDrop={(e) => handleDrop(e, key)}
              onDragEnd={handleDragEnd}
              className={cn(
                'inline-flex items-center transition-all rounded-md',
                !readOnly && 'cursor-grab active:cursor-grabbing',
                isDragging && 'opacity-40 scale-95',
                isOver && 'ring-2 ring-primary ring-offset-1'
              )}
              title="Drag to reorder property"
            >
              {renderInlinePill(key)}
            </div>
          )
        })}
      </div>
    )
  }

  // ── VERTICAL LAYOUT: 2-column table with drag handles and labels ──
  return (
    <div className={cn('select-none space-y-1', className)}>
      {/* Toggle Bar / Header */}
      <div className="flex items-center justify-between py-1 text-[11px] text-muted-foreground font-medium">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight className="size-3" />
          ) : (
            <ChevronDown className="size-3" />
          )}
          <span>Properties ({propertyOrder.length})</span>
        </button>
        <span className="text-[10px] text-muted-foreground/50 hidden sm:inline">
          Drag handles to reorder
        </span>
      </div>

      {/* Property Rows */}
      {!isCollapsed && (
        <div className="space-y-0.5">
          {propertyOrder.map((key) => {
            const meta = PROPERTY_METADATA[key]
            const isDragging = draggedKey === key
            const isOver = dragOverKey === key

            return (
              <div
                key={key}
                draggable={!readOnly}
                onDragStart={(e) => handleDragStart(e, key)}
                onDragOver={(e) => handleDragOver(e, key)}
                onDrop={(e) => handleDrop(e, key)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'group flex items-center min-h-[30px] rounded-md px-1 py-0.5 transition-all text-xs',
                  'hover:bg-muted/40',
                  isDragging && 'opacity-40 bg-muted/60',
                  isOver && 'border-t-2 border-primary'
                )}
              >
                {/* Drag Handle */}
                <div
                  className={cn(
                    'w-4 flex items-center justify-center shrink-0 mr-1 text-muted-foreground/40 transition-opacity',
                    readOnly
                      ? 'opacity-0'
                      : 'opacity-0 group-hover:opacity-100 hover:text-foreground cursor-grab active:cursor-grabbing'
                  )}
                  title="Drag to reorder"
                >
                  <GripVertical className="size-3" />
                </div>

                {/* Property Label & Icon (Left Column) */}
                <div className="w-24 sm:w-28 shrink-0 flex items-center gap-1.5 text-muted-foreground text-xs font-normal">
                  <span className="text-muted-foreground/70 shrink-0">{meta.icon}</span>
                  <span className="truncate">{meta.label}</span>
                </div>

                {/* Property Value (Right Column) */}
                <div className="flex-1 min-w-0 flex items-center">
                  {renderVerticalRow(key)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
