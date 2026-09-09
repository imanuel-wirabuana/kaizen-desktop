import { useState, useEffect, useMemo } from 'react'
import {
  CheckSquare,
  CopyPlus,
  FolderInput,
  Flag,
  Palette,
  Trash2,
  X,
  Inbox,
  Check,
  Loader2,
  ChevronDown
} from 'lucide-react'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { BackgroundPickerContent } from '@/components/ui/background-picker'
import { BulkDeleteDialog } from './bulk-delete-dialog'
import { PRIORITY_CONFIG } from './task-card'
import { useItemSelectionStore } from '@/stores/item-selection'
import { useItemsStore } from '@/stores/items'
import { useBoardsStore } from '@/stores/boards'
import { useUser } from '@/providers/auth-provider'
import { cn } from '@/lib/utils'

interface BulkActionsToolbarProps {
  boardId: number | string
  lanes: Lane[]
}

export function BulkActionsToolbar({ boardId, lanes }: BulkActionsToolbarProps) {
  const isSelectionMode = useItemSelectionStore((s) => s.isSelectionMode)
  const selectedIds = useItemSelectionStore((s) => s.selectedIds)
  const exitSelectionMode = useItemSelectionStore((s) => s.exitSelectionMode)
  const selectAll = useItemSelectionStore((s) => s.selectAll)
  const clearSelection = useItemSelectionStore((s) => s.clearSelection)

  const allItems = useItemsStore((s) => s.items)
  const bulkDuplicateItems = useItemsStore((s) => s.bulkDuplicateItems)
  const bulkMoveItems = useItemsStore((s) => s.bulkMoveItems)
  const bulkSetPriority = useItemsStore((s) => s.bulkSetPriority)
  const bulkSetBackground = useItemsStore((s) => s.bulkSetBackground)
  const bulkRemoveItems = useItemsStore((s) => s.bulkRemoveItems)

  const boards = useBoardsStore((s) => s.boards)
  const { user } = useUser()

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)

  // Current board items count for Select All
  const boardItems = useMemo(() => {
    return allItems.filter((item) => String(item.board_id) === String(boardId))
  }, [allItems, boardId])

  const boardItemIds = useMemo(() => {
    return boardItems.map((i) => i.id)
  }, [boardItems])

  const isAllSelected =
    boardItemIds.length > 0 && selectedIds.length >= boardItemIds.length

  // Keyboard shortcut: Escape exits selection mode
  useEffect(() => {
    if (!isSelectionMode) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        exitSelectionMode()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSelectionMode, exitSelectionMode])

  if (!isSelectionMode) return null

  const selectedCount = selectedIds.length

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      clearSelection()
    } else {
      selectAll(boardItemIds)
    }
  }

  // Bulk Feature 1: Duplicate Tasks (Duplicated items go directly to draft lane)
  const handleDuplicate = async () => {
    if (selectedCount === 0 || isDuplicating) return
    setIsDuplicating(true)
    try {
      await bulkDuplicateItems(selectedIds)
      exitSelectionMode()
    } catch (err) {
      console.error('Error duplicating selected items:', err)
    } finally {
      setIsDuplicating(false)
    }
  }

  // Bulk Feature 2: Move to Lane
  const handleMoveToLane = async (
    targetLaneId: number | null,
    targetBoardId?: number
  ) => {
    if (selectedCount === 0) return
    await bulkMoveItems(selectedIds, targetLaneId, targetBoardId)
    exitSelectionMode()
  }

  // Bulk Feature 3: Set Priority
  const handleSetPriority = async (priority: number) => {
    if (selectedCount === 0) return
    await bulkSetPriority(selectedIds, priority)
  }

  // Bulk Feature 4: Set Color Accent
  const handleSetBackground = async (bg: string | null) => {
    if (selectedCount === 0) return
    await bulkSetBackground(selectedIds, bg)
  }

  // Bulk Feature 5: Delete Tasks
  const handleConfirmDelete = async () => {
    if (selectedCount === 0) return
    await bulkRemoveItems(selectedIds)
    exitSelectionMode()
  }

  const canEditBoard = (b: Board) => {
    return (
      b.role === 'owner' ||
      b.role === 'edit' ||
      Boolean(user?.id && b.owner === user.id) ||
      (!b.role && !b.owner)
    )
  }

  const otherEditableBoards = boards.filter(
    (b) => String(b.id) !== String(boardId) && canEditBoard(b)
  )

  const realLanes = lanes.filter((l) => l.id !== null && !l.isVirtual)

  return (
    <>
      <div
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5',
          'rounded-2xl border border-border/80 bg-card/90 dark:bg-card/85 backdrop-blur-xl',
          'p-1.5 px-3 shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5',
          'select-none'
        )}
      >
        {/* Count Badge & Select All */}
        <div className="flex items-center gap-2 pr-2 border-r border-border/60">
          <div className="flex items-center gap-1.5">
            <span className="flex size-5 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground shadow-2xs">
              {selectedCount}
            </span>
            <span className="text-xs font-semibold text-foreground whitespace-nowrap">
              {selectedCount === 1 ? 'task' : 'tasks'} selected
            </span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleToggleSelectAll}
            className="h-7 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            {isAllSelected ? 'Deselect all' : 'Select all'}
          </Button>
        </div>

        {/* Action Buttons Group */}
        <div className="flex items-center gap-1">
          {/* 1. Duplicate Task */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDuplicate}
            disabled={selectedCount === 0 || isDuplicating}
            className="h-8 gap-1.5 px-2.5 text-xs font-medium hover:bg-muted/80"
            title="Duplicate selected tasks to Draft lane"
          >
            {isDuplicating ? (
              <Loader2 className="size-3.5 animate-spin text-primary" />
            ) : (
              <CopyPlus className="size-3.5 text-primary" />
            )}
            <span>Duplicate</span>
          </Button>

          {/* 2. Move To */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={selectedCount === 0}
                  className="h-8 gap-1.5 px-2.5 text-xs font-medium hover:bg-muted/80"
                >
                  <FolderInput className="size-3.5 text-primary" />
                  <span>Move to</span>
                  <ChevronDown className="size-3 text-muted-foreground ml-0.5" />
                </Button>
              }
            />
            <DropdownMenuContent align="center" side="top" className="w-52 text-xs shadow-xl mb-1">
              <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Current Board Lanes
              </div>

              {/* Draft Lane Option */}
              <DropdownMenuItem
                onClick={() => handleMoveToLane(null)}
                className="pl-3 font-medium cursor-pointer"
              >
                <Inbox className="mr-2 size-3.5 text-primary shrink-0" />
                <span className="truncate flex-1">Draft</span>
              </DropdownMenuItem>

              {/* Real Lanes Options */}
              {realLanes.map((lane) => (
                <DropdownMenuItem
                  key={lane.id}
                  onClick={() => handleMoveToLane(lane.id)}
                  className="pl-3 cursor-pointer"
                >
                  {lane.icon ? (
                    <span className="mr-2 text-xs shrink-0">{lane.icon}</span>
                  ) : (
                    <span className="mr-2 size-2 rounded-full bg-primary/40 shrink-0" />
                  )}
                  <span className="truncate flex-1">{lane.title || 'Untitled Lane'}</span>
                </DropdownMenuItem>
              ))}

              {/* Other Boards (if any) */}
              {otherEditableBoards.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Other Boards
                  </div>
                  {otherEditableBoards.map((b) => (
                    <DropdownMenuSub key={b.id}>
                      <DropdownMenuSubTrigger className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs shrink-0">{b.icon || '📋'}</span>
                        <span className="truncate flex-1 font-medium">{b.title}</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-48 text-xs shadow-xl">
                        <DropdownMenuItem
                          onClick={() => handleMoveToLane(null, Number(b.id))}
                          className="pl-3 cursor-pointer"
                        >
                          <Inbox className="mr-2 size-3.5 text-primary shrink-0" />
                          <span className="truncate">Draft</span>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 3. Priority */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={selectedCount === 0}
                  className="h-8 gap-1.5 px-2.5 text-xs font-medium hover:bg-muted/80"
                >
                  <Flag className="size-3.5 text-primary" />
                  <span>Priority</span>
                  <ChevronDown className="size-3 text-muted-foreground ml-0.5" />
                </Button>
              }
            />
            <DropdownMenuContent align="center" side="top" className="w-36 text-xs shadow-xl mb-1">
              {([0, 1, 2, 3] as const).map((p) => (
                <DropdownMenuItem
                  key={p}
                  onClick={() => handleSetPriority(p)}
                  className="cursor-pointer"
                >
                  <span className={cn('size-2 rounded-full mr-2 shrink-0', PRIORITY_CONFIG[p].dot)} />
                  <span>{PRIORITY_CONFIG[p].label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 4. Color Accent */}
          <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={selectedCount === 0}
                  className="h-8 gap-1.5 px-2.5 text-xs font-medium hover:bg-muted/80"
                >
                  <Palette className="size-3.5 text-primary" />
                  <span>Color</span>
                </Button>
              }
            />
            <PopoverContent
              align="center"
              side="top"
              className="w-[240px] p-2 shadow-2xl mb-1"
            >
              <BackgroundPickerContent
                value={null}
                onChange={(newBg) => {
                  handleSetBackground(newBg)
                  setIsColorPickerOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>

          {/* 5. Delete */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={selectedCount === 0}
            className="h-8 gap-1.5 px-2.5 text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
            <span>Delete</span>
          </Button>
        </div>

        {/* Exit Selection Mode Button */}
        <div className="pl-1.5 border-l border-border/60 ml-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={exitSelectionMode}
            className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80"
            title="Exit selection mode (Esc)"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <BulkDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        count={selectedCount}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
