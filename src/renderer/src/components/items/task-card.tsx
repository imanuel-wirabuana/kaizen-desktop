import { useState, useEffect } from 'react'
import { useSortable } from '@dnd-kit/react/sortable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  FolderInput
} from 'lucide-react'
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

function OtherBoardMoveGroupDropdown({
  board,
  onMove
}: {
  board: Board
  onMove: (boardId: number, laneId: number | null) => Promise<void>
}) {
  const [lanes, setLanes] = useState<Lane[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const boardId = board.id
    if (!boardId) return

    const loadLanes = () => {
      getLanesByBoardId(boardId).then((data) => {
        setLanes(data.filter((l) => l.id !== null))
        setLoading(false)
      })
    }

    loadLanes()

    // Realtime subscription for other board's lanes
    const channel = subscribeLanes(boardId, () => {
      loadLanes()
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [board.id])

  return (
    <>
      <DropdownMenuSeparator />

      {/* Board Item -> Clicking moves item to Draft of this board */}
      <DropdownMenuItem
        onClick={() => onMove(Number(board.id), null)}
        className="font-bold text-foreground flex items-center justify-between"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs shrink-0">{board.icon || '📋'}</span>
          <span className="truncate">{board.title || 'Untitled Board'}</span>
        </div>
        <span className="text-[9px] text-primary/80 font-normal">➔ Draft</span>
      </DropdownMenuItem>

      {/* Lanes under this board */}
      {loading ? (
        <div className="pl-6 py-1 text-[10px] text-muted-foreground">Loading lanes...</div>
      ) : (
        lanes.map((lane) => (
          <DropdownMenuItem
            key={lane.id}
            onClick={() => onMove(Number(board.id), lane.id)}
            className="pl-6 text-muted-foreground hover:text-foreground"
          >
            {lane.icon ? (
              <span className="mr-2 text-xs shrink-0">{lane.icon}</span>
            ) : (
              <span className="mr-2 size-2 rounded-full bg-primary/40 shrink-0" />
            )}
            <span className="truncate flex-1">{lane.title || 'Untitled Lane'}</span>
          </DropdownMenuItem>
        ))
      )}
    </>
  )
}

function OtherBoardMoveGroupContext({
  board,
  onMove
}: {
  board: Board
  onMove: (boardId: number, laneId: number | null) => Promise<void>
}) {
  const [lanes, setLanes] = useState<Lane[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const boardId = board.id
    if (!boardId) return

    const loadLanes = () => {
      getLanesByBoardId(boardId).then((data) => {
        setLanes(data.filter((l) => l.id !== null))
        setLoading(false)
      })
    }

    loadLanes()

    // Realtime subscription for other board's lanes
    const channel = subscribeLanes(boardId, () => {
      loadLanes()
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [board.id])

  return (
    <>
      <ContextMenuSeparator />

      {/* Board Item -> Clicking moves item to Draft of this board */}
      <ContextMenuItem
        onClick={() => onMove(Number(board.id), null)}
        className="font-bold text-foreground flex items-center justify-between"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs shrink-0">{board.icon || '📋'}</span>
          <span className="truncate">{board.title || 'Untitled Board'}</span>
        </div>
        <span className="text-[9px] text-primary/80 font-normal">➔ Draft</span>
      </ContextMenuItem>

      {/* Lanes under this board */}
      {loading ? (
        <div className="pl-6 py-1 text-[10px] text-muted-foreground">Loading lanes...</div>
      ) : (
        lanes.map((lane) => (
          <ContextMenuItem
            key={lane.id}
            onClick={() => onMove(Number(board.id), lane.id)}
            className="pl-6 text-muted-foreground hover:text-foreground"
          >
            {lane.icon ? (
              <span className="mr-2 text-xs shrink-0">{lane.icon}</span>
            ) : (
              <span className="mr-2 size-2 rounded-full bg-primary/40 shrink-0" />
            )}
            <span className="truncate flex-1">{lane.title || 'Untitled Lane'}</span>
          </ContextMenuItem>
        ))
      )}
    </>
  )
}

type TaskCardProps = {
  item: KanbanItem
  index: number
}

export function TaskCard({ item, index }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(item.title || '')
  const [icon, setIcon] = useState<string | null>(item.icon || null)
  const [description, setDescription] = useState(item.description || '')
  const [priority, setPriority] = useState<number>(item.priority ?? 0)
  const [dueDate, setDueDate] = useState<string>(
    item.due_date ? item.due_date : ''
  )
  const [background, setBackground] = useState<string>(item.background || '')
  const [popoverOpen, setPopoverOpen] = useState(false)

  const updateItem = useItemsStore((s) => s.updateItem)
  const removeItem = useItemsStore((s) => s.removeItem)
  const moveItem = useItemsStore((s) => s.moveItem)
  const lanes = useLanesStore((s) => s.lanes)
  const boards = useBoardsStore((s) => s.boards)
  const currentBoard = boards.find((b) => Number(b.id) === Number(item.board_id))
  const otherBoards = boards.filter((b) => String(b.id) !== String(item.board_id))

  const handleMoveTo = async (targetBoardId: number, targetLaneId: number | null) => {
    await updateItem(item.id, { board_id: targetBoardId, lane_id: targetLaneId })
  }

  const { ref, handleRef, isDragSource } = useSortable({
    id: item.id,
    index,
    type: 'item',
    accept: 'item',
    group: item.lane_id !== null ? String(item.lane_id) : 'draft',
    data: { type: 'item', laneId: item.lane_id, item },
    disabled: isEditing
  })

  const handleSave = async () => {
    if (!title.trim()) {
      setTitle(item.title || '')
      setIcon(item.icon || null)
      setIsEditing(false)
      return
    }

    setIsEditing(false)
    await updateItem(item.id, {
      title: title.trim(),
      icon: icon || null,
      description: description.trim() || null,
      priority,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      background: background || null
    })
  }

  const handleCancel = () => {
    setTitle(item.title || '')
    setIcon(item.icon || null)
    setDescription(item.description || '')
    setPriority(item.priority ?? 0)
    setDueDate(item.due_date ? item.due_date : '')
    setBackground(item.background || '')
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
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
            style={hasCustomBackground ? { background: item.background! } : undefined}
          >
            {isEditing ? (
              <div className="space-y-2.5" onKeyDown={handleKeyDown}>
                {/* Icon & Title */}
                <div className="flex items-center gap-1.5">
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger
                      render={
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-7 shrink-0 text-base p-0 rounded-md"
                          title="Choose Icon"
                        >
                          {icon || '😀'}
                        </Button>
                      }
                    />
                    <PopoverContent align="start" className="w-[300px] border-none bg-transparent p-0 shadow-none z-50">
                      <EmojiPicker
                        className="h-[300px] w-full rounded-lg border shadow-md"
                        onEmojiSelect={({ emoji }) => {
                          setIcon(emoji)
                          setPopoverOpen(false)
                        }}
                      >
                        <EmojiPickerSearch />
                        <EmojiPickerContent />
                      </EmojiPicker>
                    </PopoverContent>
                  </Popover>

                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                    className="h-7 text-xs font-medium bg-background flex-1"
                    placeholder="Task title..."
                  />
                </div>

                {/* Description */}
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-6 text-[11px] text-muted-foreground bg-background"
                  placeholder="Description (optional)..."
                />

                {/* Priority Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground">Priority:</label>
                  <div className="flex items-center gap-1">
                    {([0, 1, 2, 3] as const).map((p) => {
                      const pCfg = PRIORITY_CONFIG[p]
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={cn(
                            'flex-1 py-1 rounded-md text-[10px] font-medium border transition-all cursor-pointer',
                            priority === p ? 'ring-2 ring-primary border-primary font-bold' : 'opacity-70 hover:opacity-100',
                            pCfg.badge
                          )}
                        >
                          {pCfg.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Due Date Picker */}
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground">Due Date:</label>
                  <DateTimePicker
                    value={dueDate}
                    onChange={(val) => setDueDate(val || '')}
                    placeholder="Pick due date & time..."
                    className="h-7 text-xs"
                  />
                </div>

                {/* Action controls */}
                <div className="flex items-center justify-end gap-1 pt-1 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleCancel}
                    className="size-6 text-muted-foreground rounded-md hover:bg-muted"
                  >
                    <X className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    onClick={handleSave}
                    disabled={!title.trim()}
                    className="size-6 rounded-md bg-primary text-primary-foreground shadow-2xs"
                  >
                    <Check className="size-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-1.5 min-w-0">
                  <div className="flex items-start gap-1.5 min-w-0 flex-1">
                    <span
                      ref={handleRef}
                      className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-foreground transition-colors p-0.5 rounded touch-none shrink-0 mt-0.5"
                      title="Drag to reorder task"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripVertical className="size-3.5" />
                    </span>
                    <div
                      className="flex items-start gap-1.5 min-w-0 flex-1 cursor-pointer"
                      onDoubleClick={() => setIsEditing(true)}
                    >
                      {item.icon && <span className="text-sm shrink-0 leading-tight">{item.icon}</span>}
                      <span className="text-xs font-medium tracking-tight text-foreground/90 break-words flex-1">
                        {item.title || 'Untitled Task'}
                      </span>
                    </div>
                  </div>

                  {/* Card Options Dropdown */}
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
                    <DropdownMenuContent align="end" className="w-48 text-xs shadow-lg">
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Pencil className="mr-2 size-3.5 text-muted-foreground" />
                        <span>Edit Task</span>
                      </DropdownMenuItem>

                      {/* Move to Submenu */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <FolderInput className="mr-2 size-3.5 text-muted-foreground" />
                          <span>Move to</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-56 text-xs shadow-xl max-h-80 overflow-y-auto">
                          {/* Current Board Section */}
                          <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 bg-muted/40 rounded-t-sm">
                            <span>{currentBoard?.icon || '📋'}</span>
                            <span className="truncate">{currentBoard?.title || 'Current Board'}</span>
                            <span className="ml-auto text-[9px] font-medium text-primary">(Current)</span>
                          </div>

                          {/* Current Board: Draft */}
                          <DropdownMenuItem
                            disabled={item.lane_id === null}
                            onClick={() => handleMoveTo(Number(item.board_id), null)}
                            className="pl-4 font-medium"
                          >
                            <Inbox className="mr-2 size-3.5 text-primary shrink-0" />
                            <span className="truncate flex-1">Draft</span>
                            {item.lane_id === null && <Check className="ml-auto size-3 text-muted-foreground" />}
                          </DropdownMenuItem>

                          {/* Current Board: Lanes */}
                          {lanes
                            .filter((l) => l.id !== null)
                            .map((lane) => {
                              const isCurrent = item.lane_id === lane.id
                              return (
                                <DropdownMenuItem
                                  key={lane.id}
                                  disabled={isCurrent}
                                  onClick={() => handleMoveTo(Number(item.board_id), lane.id)}
                                  className="pl-6"
                                >
                                  {lane.icon ? (
                                    <span className="mr-2 text-xs shrink-0">{lane.icon}</span>
                                  ) : (
                                    <span className="mr-2 size-2 rounded-full bg-primary/40 shrink-0" />
                                  )}
                                  <span className="truncate flex-1">{lane.title || 'Untitled Lane'}</span>
                                  {isCurrent && <Check className="ml-auto size-3 text-muted-foreground" />}
                                </DropdownMenuItem>
                              )
                            })}

                          {/* Other Boards */}
                          {otherBoards.map((b) => (
                            <OtherBoardMoveGroupDropdown key={b.id} board={b} onMove={handleMoveTo} />
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>

                      {/* Priority Submenu */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Flag className="mr-2 size-3.5 text-muted-foreground" />
                          <span>Priority</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-36">
                          {([0, 1, 2, 3] as const).map((p) => (
                            <DropdownMenuItem
                              key={p}
                              onClick={() => updateItem(item.id, { priority: p })}
                            >
                              <span className={cn('size-2 rounded-full mr-2', PRIORITY_CONFIG[p].dot)} />
                              <span>{PRIORITY_CONFIG[p].label}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>

                      {/* Color Accent Submenu */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Palette className="mr-2 size-3.5 text-muted-foreground" />
                          <span>Color Accent</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-[240px] p-2">
                          <BackgroundPickerContent
                            value={item.background}
                            onChange={(newBg) => updateItem(item.id, { background: newBg || null })}
                          />
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => removeItem(item.id)}
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                      >
                        <Trash2 className="mr-2 size-3.5" />
                        <span>Delete Task</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
        <ContextMenuItem onClick={() => setIsEditing(true)}>
          <Pencil className="mr-2 size-3.5 text-muted-foreground" />
          <span>Edit Task</span>
        </ContextMenuItem>

        {/* Move to Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FolderInput className="mr-2 size-3.5 text-muted-foreground" />
            <span>Move to</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-56 text-xs shadow-xl max-h-80 overflow-y-auto">
            {/* Current Board Section */}
            <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 bg-muted/40 rounded-t-sm">
              <span>{currentBoard?.icon || '📋'}</span>
              <span className="truncate">{currentBoard?.title || 'Current Board'}</span>
              <span className="ml-auto text-[9px] font-medium text-primary">(Current)</span>
            </div>

            {/* Current Board: Draft */}
            <ContextMenuItem
              disabled={item.lane_id === null}
              onClick={() => handleMoveTo(Number(item.board_id), null)}
              className="pl-4 font-medium"
            >
              <Inbox className="mr-2 size-3.5 text-primary shrink-0" />
              <span className="truncate flex-1">Draft</span>
              {item.lane_id === null && <Check className="ml-auto size-3 text-muted-foreground" />}
            </ContextMenuItem>

            {/* Current Board: Lanes */}
            {lanes
              .filter((l) => l.id !== null)
              .map((lane) => {
                const isCurrent = item.lane_id === lane.id
                return (
                  <ContextMenuItem
                    key={lane.id}
                    disabled={isCurrent}
                    onClick={() => handleMoveTo(Number(item.board_id), lane.id)}
                    className="pl-6"
                  >
                    {lane.icon ? (
                      <span className="mr-2 text-xs shrink-0">{lane.icon}</span>
                    ) : (
                      <span className="mr-2 size-2 rounded-full bg-primary/40 shrink-0" />
                    )}
                    <span className="truncate flex-1">{lane.title || 'Untitled Lane'}</span>
                    {isCurrent && <Check className="ml-auto size-3 text-muted-foreground" />}
                  </ContextMenuItem>
                )
              })}

            {/* Other Boards */}
            {otherBoards.map((b) => (
              <OtherBoardMoveGroupContext key={b.id} board={b} onMove={handleMoveTo} />
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Priority Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Flag className="mr-2 size-3.5 text-muted-foreground" />
            <span>Priority</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-36">
            {([0, 1, 2, 3] as const).map((p) => (
              <ContextMenuItem
                key={p}
                onClick={() => updateItem(item.id, { priority: p })}
              >
                <span className={cn('size-2 rounded-full mr-2', PRIORITY_CONFIG[p].dot)} />
                <span>{PRIORITY_CONFIG[p].label}</span>
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Color Accent Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Palette className="mr-2 size-3.5 text-muted-foreground" />
            <span>Color Accent</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-[240px] p-2">
            <BackgroundPickerContent
              value={item.background}
              onChange={(newBg) => updateItem(item.id, { background: newBg || null })}
            />
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuItem
          variant="destructive"
          onClick={() => removeItem(item.id)}
        >
          <Trash2 className="mr-2 size-3.5" />
          <span>Delete Task</span>
        </ContextMenuItem>
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
      style={hasCustomBackground ? { background: item.background! } : undefined}
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
