import {
  MenuProvider,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
  MenuSubContent,
  MenuVariant
} from './unified-menu-primitives'
import {
  Pencil,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Palette,
  FolderInput,
  Copy,
  CopyPlus
} from 'lucide-react'
import { useLanesStore } from '@/stores/lanes'
import { useBoardsStore } from '@/stores/boards'
import { BackgroundPickerContent } from '@/components/ui/background-picker'

export type LaneMenuContentProps = {
  lane: Lane
  index: number
  totalLanes: number
  columnItemsCount: number
  variant: MenuVariant
  onEditTitle: () => void
  onDelete: () => void
  onRequestMoveToBoard: (board: Board) => void
  onBackgroundChange: (bg: string) => void
}

export function LaneMenuContent({
  lane,
  index,
  totalLanes,
  columnItemsCount,
  variant,
  onEditTitle,
  onDelete,
  onRequestMoveToBoard,
  onBackgroundChange
}: LaneMenuContentProps) {
  const moveLane = useLanesStore((s) => s.moveLane)
  const duplicateLane = useLanesStore((s) => s.duplicateLane)
  const boards = useBoardsStore((s) => s.boards)
  const otherBoards = boards.filter((b) => String(b.id) !== String(lane.board_id))

  return (
    <MenuProvider variant={variant}>
      <MenuItem onClick={onEditTitle}>
        <Pencil className="mr-2 size-3.5 text-muted-foreground" />
        <span>Edit Title & Description</span>
      </MenuItem>

      {/* Duplicate Submenu */}
      <MenuSub>
        <MenuSubTrigger>
          <Copy className="mr-2 size-3.5 text-muted-foreground" />
          <span>Duplicate</span>
        </MenuSubTrigger>
        <MenuSubContent className="w-52 text-xs shadow-xl">
          <MenuItem onClick={() => duplicateLane(lane.id!, false)}>
            <Copy className="mr-2 size-3.5 text-muted-foreground" />
            <span>Duplicate Lane</span>
          </MenuItem>
          {columnItemsCount > 0 && (
            <MenuItem onClick={() => duplicateLane(lane.id!, true)}>
              <CopyPlus className="mr-2 size-3.5 text-muted-foreground" />
              <span>Duplicate Lane with Items</span>
            </MenuItem>
          )}
        </MenuSubContent>
      </MenuSub>

      {/* Move to Board Submenu */}
      <MenuSub>
        <MenuSubTrigger>
          <FolderInput className="mr-2 size-3.5 text-muted-foreground" />
          <span>Move to</span>
        </MenuSubTrigger>
        <MenuSubContent className="w-48 text-xs shadow-xl">
          {otherBoards.length > 0 ? (
            otherBoards.map((b) => (
              <MenuItem
                key={b.id}
                onClick={(e) => {
                  e.stopPropagation()
                  onRequestMoveToBoard(b)
                }}
              >
                <span className="mr-2 text-xs shrink-0">{b.icon || '📋'}</span>
                <span className="truncate flex-1 font-medium">{b.title || 'Untitled Board'}</span>
              </MenuItem>
            ))
          ) : (
            <div className="p-2 text-center text-[10px] text-muted-foreground">No other boards</div>
          )}
        </MenuSubContent>
      </MenuSub>

      {/* Color Accent Submenu */}
      <MenuSub>
        <MenuSubTrigger>
          <Palette className="mr-2 size-3.5 text-muted-foreground" />
          <span>Change Color Accent</span>
        </MenuSubTrigger>
        <MenuSubContent className="w-[240px] p-2">
          <BackgroundPickerContent value={lane.background} onChange={onBackgroundChange} />
        </MenuSubContent>
      </MenuSub>

      <MenuSeparator />

      <MenuItem disabled={index === 0} onClick={() => moveLane(lane.id!, 'left')}>
        <ArrowLeft className="mr-2 size-3.5 text-muted-foreground" />
        <span>Move Left</span>
      </MenuItem>
      <MenuItem disabled={index === totalLanes - 1} onClick={() => moveLane(lane.id!, 'right')}>
        <ArrowRight className="mr-2 size-3.5 text-muted-foreground" />
        <span>Move Right</span>
      </MenuItem>

      <MenuSeparator />

      <MenuItem destructive onClick={onDelete}>
        <Trash2 className="mr-2 size-3.5" />
        <span>Delete Lane</span>
      </MenuItem>
    </MenuProvider>
  )
}
