import { useState } from 'react'
import { useSortable } from '@dnd-kit/react/sortable'
import { useDroppable } from '@dnd-kit/react'
import { Button } from '@/components/ui/button'
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
  ArrowLeft,
  ArrowRight,
  Palette,
  Inbox,
  Sparkles,
  FolderInput
} from 'lucide-react'
import { useLanesStore } from '@/stores/lanes'
import { useItemsStore } from '@/stores/items'
import { useBoardsStore } from '@/stores/boards'
import { InlineEditLane } from './inline-edit-lane'
import { BackgroundPickerContent } from '@/components/ui/background-picker'
import { DeleteLaneDialog } from './delete-lane-dialog'
import { MoveLaneDialog } from './move-lane-dialog'
import { TaskCard, TaskCardPreview, InlineCreateTask } from '@/components/items'
import { getBoardBackgroundStyleAndClass } from '@/lib/board-utils'
import { cn } from '@/lib/utils'

type LaneColumnProps = {
  lane: Lane
  index: number
  totalLanes: number
  readOnly?: boolean
}

export function LaneColumn({ lane, index, totalLanes, readOnly = false }: LaneColumnProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [targetBoardForMove, setTargetBoardForMove] = useState<Board | null>(null)
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)

  const handleRequestMoveToBoard = (targetBoard: Board) => {
    setTargetBoardForMove(targetBoard)
    setIsMoveDialogOpen(true)
  }

  const updateLane = useLanesStore((s) => s.updateLane)
  const moveLane = useLanesStore((s) => s.moveLane)
  const boards = useBoardsStore((s) => s.boards)
  const otherBoards = boards.filter((b) => String(b.id) !== String(lane.board_id))
  const allItems = useItemsStore((s) => s.items)

  const isVirtual = Boolean(lane.isVirtual || lane.id === null)

  // Attach sortable drag & drop ref for column reordering
  const { ref, handleRef, isDragSource } = useSortable({
    id: lane.id ?? 'draft-lane-virtual',
    index,
    type: 'lane',
    accept: 'lane',
    group: 'lanes',
    disabled: isEditing || isVirtual || readOnly
  })

  // Attach droppable ref for task items dropping into this column (especially when empty)
  const { ref: columnDropRef, isDropTarget } = useDroppable({
    id: `lane-drop-target-${lane.id}`,
    type: 'item',
    accept: 'item',
    data: { type: 'lane', laneId: lane.id },
    disabled: readOnly
  })

  // Filter items belonging to this lane
  const columnItems = allItems
    .filter((i) => (lane.id === null ? i.lane_id === null : i.lane_id === lane.id))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const bgProps = getBoardBackgroundStyleAndClass(lane.background)
  const hasCustomBackground = Boolean(lane.background && lane.background.trim())

  const handleBackgroundChange = (newBg: string) => {
    if (isVirtual || lane.id === null || readOnly) return
    updateLane(lane.id, { background: newBg || null })
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger
          render={
            <div
              ref={ref}
              className={cn(
                'group/column flex h-fit max-h-full w-72 shrink-0 flex-col rounded-2xl border border-border/70 bg-card/95 backdrop-blur-md shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden relative select-none',
                isDragSource ? 'opacity-40 ring-2 ring-primary/50 shadow-xl scale-[0.99]' : 'hover:border-border',
                isVirtual ? 'border-primary/30 bg-card/98 ring-1 ring-primary/10' : ''
              )}
            >
              {/* Column Header */}
              <div
                className={cn(
                  'flex items-center justify-between border-b px-3.5 py-3 gap-2 min-w-0 transition-all duration-200',
                  hasCustomBackground ? bgProps.className : isVirtual ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 backdrop-blur-md'
                )}
                style={hasCustomBackground ? { background: lane.background! } : undefined}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {/* Drag Handle Icon or Virtual Inbox Badge */}
                  {isVirtual ? (
                    <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0" title="Virtual Draft Lane">
                      <Inbox className="size-3.5" />
                    </div>
                  ) : !readOnly ? (
                    <span
                      ref={handleRef}
                      className="flex size-6 items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-background/50 transition-colors cursor-grab active:cursor-grabbing touch-none shrink-0"
                      title="Drag column to reorder"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripVertical className="size-4" />
                    </span>
                  ) : (
                    <span className="size-2 rounded-full bg-primary/40 shrink-0" />
                  )}

                  {/* Header Title */}
                  {isVirtual ? (
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-xs font-semibold tracking-tight text-foreground truncate">Draft</span>
                      <span className="rounded-full bg-primary/15 px-1.5 py-0.2 text-[9px] font-semibold text-primary uppercase tracking-wider">
                        Virtual
                      </span>
                    </div>
                  ) : (
                    <InlineEditLane
                      lane={lane}
                      isEditing={isEditing}
                      onEditingChange={setIsEditing}
                    />
                  )}
                </div>

                {/* Controls Area */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Item Count Pill Badge */}
                  <span className="flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-background/80 border text-[10px] font-bold text-muted-foreground shadow-2xs backdrop-blur-xs">
                    {columnItems.length}
                  </span>

                  {/* Options Dropdown Menu Trigger */}
                  {!isVirtual && !readOnly && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/60"
                            title="Column options"
                          >
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-48 text-xs shadow-xl">
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                          <Pencil className="mr-2 size-3.5 text-muted-foreground" />
                          <span>Edit Title & Description</span>
                        </DropdownMenuItem>

                        {/* Move to Board Submenu */}
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <FolderInput className="mr-2 size-3.5 text-muted-foreground" />
                            <span>Move to</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-48 text-xs shadow-xl">
                            {otherBoards.length > 0 ? (
                              otherBoards.map((b) => (
                                <DropdownMenuItem
                                  key={b.id}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRequestMoveToBoard(b)
                                  }}
                                >
                                  <span className="mr-2 text-xs shrink-0">{b.icon || '📋'}</span>
                                  <span className="truncate flex-1 font-medium">{b.title || 'Untitled Board'}</span>
                                </DropdownMenuItem>
                              ))
                            ) : (
                              <div className="p-2 text-center text-[10px] text-muted-foreground">
                                No other boards
                              </div>
                            )}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        {/* Color Accent Submenu */}
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Palette className="mr-2 size-3.5 text-muted-foreground" />
                            <span>Change Color Accent</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-[240px] p-2">
                            <BackgroundPickerContent
                              value={lane.background}
                              onChange={handleBackgroundChange}
                            />
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          disabled={index === 0}
                          onClick={() => moveLane(lane.id!, 'left')}
                        >
                          <ArrowLeft className="mr-2 size-3.5 text-muted-foreground" />
                          <span>Move Left</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={index === totalLanes - 1}
                          onClick={() => moveLane(lane.id!, 'right')}
                        >
                          <ArrowRight className="mr-2 size-3.5 text-muted-foreground" />
                          <span>Move Right</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => setIsDeleteOpen(true)}
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        >
                          <Trash2 className="mr-2 size-3.5" />
                          <span>Delete Column</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              {/* Column Cards Drop Body */}
              <div
                ref={columnDropRef}
                className={cn(
                  'flex-1 min-h-[40px] overflow-y-auto p-2.5 space-y-2 transition-all rounded-xl',
                  isDropTarget && !readOnly ? 'bg-primary/10 ring-2 ring-primary/40 border-2 border-dashed border-primary/50' : ''
                )}
              >
                {columnItems.length > 0 ? (
                  columnItems.map((item, idx) => (
                    <TaskCard key={item.id} item={item} index={idx} readOnly={readOnly} />
                  ))
                ) : (
                  /* Ultra-Compact Empty State Placeholder */
                  <div className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-muted-foreground/20 bg-muted/5 py-1.5 px-2 text-center transition-all">
                    <Sparkles className="size-3 text-muted-foreground/60" />
                    <span className="text-[10px] font-medium text-muted-foreground/80">No tasks</span>
                  </div>
                )}
              </div>

              {/* Footer Inline Create Task Button */}
              {!readOnly && (
                <div className="p-2 border-t border-border/50 bg-muted/20 backdrop-blur-xs">
                  <InlineCreateTask laneId={lane.id} />
                </div>
              )}
            </div>
          }
        />

        {/* Right-click Context Menu */}
        {!isVirtual && (
          <ContextMenuContent className="w-48 text-xs shadow-xl">
            <ContextMenuItem onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 size-3.5 text-muted-foreground" />
              <span>Edit Title & Description</span>
            </ContextMenuItem>

            {/* Move to Board Submenu */}
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <FolderInput className="mr-2 size-3.5 text-muted-foreground" />
                <span>Move to</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48 text-xs shadow-xl">
                {otherBoards.length > 0 ? (
                  otherBoards.map((b) => (
                    <ContextMenuItem
                      key={b.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRequestMoveToBoard(b)
                      }}
                    >
                      <span className="mr-2 text-xs shrink-0">{b.icon || '📋'}</span>
                      <span className="truncate flex-1 font-medium">{b.title || 'Untitled Board'}</span>
                    </ContextMenuItem>
                  ))
                ) : (
                  <div className="p-2 text-center text-[10px] text-muted-foreground">
                    No other boards
                  </div>
                )}
              </ContextMenuSubContent>
            </ContextMenuSub>

            {/* Color Accent Submenu */}
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Palette className="mr-2 size-3.5 text-muted-foreground" />
                <span>Change Color Accent</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-[240px] p-2">
                <BackgroundPickerContent
                  value={lane.background}
                  onChange={handleBackgroundChange}
                />
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSeparator />

            <ContextMenuItem
              disabled={index === 0}
              onClick={() => moveLane(lane.id!, 'left')}
            >
              <ArrowLeft className="mr-2 size-3.5 text-muted-foreground" />
              <span>Move Left</span>
            </ContextMenuItem>
            <ContextMenuItem
              disabled={index === totalLanes - 1}
              onClick={() => moveLane(lane.id!, 'right')}
            >
              <ArrowRight className="mr-2 size-3.5 text-muted-foreground" />
              <span>Move Right</span>
            </ContextMenuItem>

            <ContextMenuSeparator />

            <ContextMenuItem
              variant="destructive"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="mr-2 size-3.5" />
              <span>Delete Column</span>
            </ContextMenuItem>
          </ContextMenuContent>
        )}
      </ContextMenu>

      {/* Delete Confirmation Modal */}
      {!isVirtual && (
        <>
          <DeleteLaneDialog
            lane={lane}
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
          />
          <MoveLaneDialog
            lane={lane}
            targetBoard={targetBoardForMove}
            open={isMoveDialogOpen}
            onOpenChange={setIsMoveDialogOpen}
          />
        </>
      )}
    </>
  )
}

// ── Drag Overlay Preview Component for Lane Column ──
export function LaneColumnPreview({ lane }: { lane: Lane }) {
  const allItems = useItemsStore.getState().items
  const columnItems = allItems
    .filter((i) => (lane.id === null ? i.lane_id === null : i.lane_id === lane.id))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const bgProps = getBoardBackgroundStyleAndClass(lane.background)
  const hasCustomBackground = Boolean(lane.background && lane.background.trim())
  const isVirtual = Boolean(lane.isVirtual || lane.id === null)

  return (
    <div className="flex h-fit max-h-full w-full shrink-0 flex-col rounded-2xl border border-primary/50 bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden ring-2 ring-primary/40 opacity-95 pointer-events-none select-none">
      {/* Column Header */}
      <div
        className={cn(
          'flex items-center justify-between border-b px-3.5 py-3 gap-2 min-w-0 transition-all duration-200',
          hasCustomBackground ? bgProps.className : isVirtual ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 backdrop-blur-md'
        )}
        style={hasCustomBackground ? { background: lane.background! } : undefined}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <GripVertical className="size-4 text-primary shrink-0" />
          <span className="text-xs font-semibold text-foreground truncate">{lane.title || 'Untitled Lane'}</span>
        </div>
        <span className="flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-background/80 border text-[10px] font-bold text-muted-foreground shadow-2xs">
          {columnItems.length}
        </span>
      </div>

      {/* Column Cards Preview Body */}
      <div className="p-2.5 space-y-2 max-h-[400px] overflow-hidden">
        {columnItems.length > 0 ? (
          columnItems.map((item) => (
            <TaskCardPreview key={item.id} item={item} />
          ))
        ) : (
          <div className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-muted-foreground/20 bg-muted/5 py-1.5 px-2 text-center">
            <Sparkles className="size-3 text-muted-foreground/60" />
            <span className="text-[10px] font-medium text-muted-foreground/80">No tasks</span>
          </div>
        )}
      </div>
    </div>
  )
}
