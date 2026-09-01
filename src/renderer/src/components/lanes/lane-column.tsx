import { useState } from 'react'
import { useSortable } from '@dnd-kit/react/sortable'
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
  Plus,
  Sparkles
} from 'lucide-react'
import { useLanesStore } from '@/stores/lanes'
import { InlineEditLane } from './inline-edit-lane'
import { BackgroundPickerContent } from '@/components/ui/background-picker'
import { DeleteLaneDialog } from './delete-lane-dialog'
import { getBoardBackgroundStyleAndClass } from '@/lib/board-utils'
import { cn } from '@/lib/utils'

type LaneColumnProps = {
  lane: Lane
  index: number
  totalLanes: number
}

export function LaneColumn({ lane, index, totalLanes }: LaneColumnProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const updateLane = useLanesStore((s) => s.updateLane)
  const moveLane = useLanesStore((s) => s.moveLane)

  // Attach sortable drag & drop ref
  const { ref, handleRef, isDragSource } = useSortable({
    id: lane.id,
    index,
    type: 'lane',
    accept: 'lane',
    disabled: isEditing
  })

  const bgProps = getBoardBackgroundStyleAndClass(lane.background)
  const hasCustomBackground = Boolean(lane.background && lane.background.trim())

  const handleBackgroundChange = (newBg: string) => {
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
                isDragSource ? 'opacity-40 ring-2 ring-primary/50 shadow-xl scale-[0.99]' : 'hover:border-border'
              )}
            >
              {/* Column Header (Displays custom background or sleek glassmorphism) */}
              <div
                className={cn(
                  'flex items-center justify-between border-b px-3.5 py-3 gap-2 min-w-0 transition-all duration-200',
                  hasCustomBackground ? bgProps.className : 'bg-muted/30 backdrop-blur-md'
                )}
                style={hasCustomBackground ? { background: lane.background! } : undefined}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {/* Drag Handle Icon */}
                  <span
                    ref={handleRef}
                    className="flex size-6 items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-background/50 transition-colors cursor-grab active:cursor-grabbing touch-none shrink-0"
                    title="Drag column to reorder"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="size-4" />
                  </span>

                  {/* Inline Edit Header Title */}
                  <InlineEditLane
                    lane={lane}
                    isEditing={isEditing}
                    onEditingChange={setIsEditing}
                  />
                </div>

                {/* Controls Area */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Item Count Pill Badge */}
                  <span className="flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-background/80 border text-[10px] font-bold text-muted-foreground shadow-2xs backdrop-blur-xs">
                    0
                  </span>

                  {/* Options Dropdown Menu Trigger */}
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
                        onClick={() => moveLane(lane.id, 'left')}
                      >
                        <ArrowLeft className="mr-2 size-3.5 text-muted-foreground" />
                        <span>Move Left</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={index === totalLanes - 1}
                        onClick={() => moveLane(lane.id, 'right')}
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
                </div>
              </div>

              {/* Column Cards Drop Body (Height fits items) */}
              <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2">
                {/* Modern Empty State Placeholder */}
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/15 bg-muted/10 p-6 text-center transition-all hover:border-muted-foreground/30">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-background border shadow-2xs text-muted-foreground">
                    <Sparkles className="size-4 text-muted-foreground/70" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground/80">No tasks in this lane</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">Click below to add a card</p>
                  </div>
                </div>
              </div>

              {/* Footer Quick Action Button */}
              <div className="p-2 border-t border-border/50 bg-muted/20 backdrop-blur-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background/80 h-8 rounded-xl shadow-2xs transition-all cursor-pointer group/btn"
                >
                  <div className="flex size-4 items-center justify-center rounded-md bg-muted group-hover/btn:bg-primary group-hover/btn:text-primary-foreground transition-colors">
                    <Plus className="size-3" />
                  </div>
                  <span>Add Task</span>
                </Button>
              </div>
            </div>
          }
        />

        {/* Right-click Context Menu */}
        <ContextMenuContent className="w-48 text-xs shadow-xl">
          <ContextMenuItem onClick={() => setIsEditing(true)}>
            <Pencil className="mr-2 size-3.5 text-muted-foreground" />
            <span>Edit Title & Description</span>
          </ContextMenuItem>

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
            onClick={() => moveLane(lane.id, 'left')}
          >
            <ArrowLeft className="mr-2 size-3.5 text-muted-foreground" />
            <span>Move Left</span>
          </ContextMenuItem>
          <ContextMenuItem
            disabled={index === totalLanes - 1}
            onClick={() => moveLane(lane.id, 'right')}
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
      </ContextMenu>

      {/* Delete confirmation dialog */}
      <DeleteLaneDialog
        lane={lane}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  )
}

// ── Drag Overlay Preview Component for Lane Column ──
export function LaneColumnPreview({ lane }: { lane: Lane }) {
  const bgProps = getBoardBackgroundStyleAndClass(lane.background)
  const hasCustomBackground = Boolean(lane.background && lane.background.trim())

  return (
    <div className="flex h-fit max-h-full w-72 shrink-0 flex-col rounded-2xl border border-primary/40 bg-card/95 shadow-2xl overflow-hidden opacity-95 pointer-events-none ring-2 ring-primary/30">
      <div
        className={cn(
          'flex items-center justify-between border-b px-3.5 py-3 backdrop-blur-md',
          hasCustomBackground ? bgProps.className : 'bg-background/80'
        )}
        style={hasCustomBackground ? { background: lane.background! } : undefined}
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="size-4 text-primary" />
          <span className="truncate text-xs font-semibold text-foreground">{lane.title || 'Lane'}</span>
        </div>
      </div>
      <div className="p-5 flex items-center justify-center text-xs text-muted-foreground font-medium">
        Moving column...
      </div>
    </div>
  )
}
