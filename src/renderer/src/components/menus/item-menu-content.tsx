import { useState, useEffect } from 'react'
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
  Check,
  Flag,
  Palette,
  FolderInput,
  Inbox,
  CopyPlus
} from 'lucide-react'
import { useItemsStore } from '@/stores/items'
import { useLanesStore } from '@/stores/lanes'
import { useBoardsStore } from '@/stores/boards'
import * as itemsService from '@/services/items'
import { getLanesByBoardId, subscribeLanes } from '@/services/lanes'
import { supabase } from '@/lib/supabase'
import { BackgroundPickerContent } from '@/components/ui/background-picker'
import { cn } from '@/lib/utils'

import { useUser } from '@/providers/auth-provider'

export const PRIORITY_CONFIG = {
  0: { label: 'Low', badge: 'bg-muted text-muted-foreground border-border', dot: 'bg-slate-400' },
  1: { label: 'Medium', badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30', dot: 'bg-amber-500' },
  2: { label: 'High', badge: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30', dot: 'bg-orange-500' },
  3: { label: 'Urgent', badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-semibold', dot: 'bg-rose-500' }
} as const

function BoardLaneSubmenu({
  board,
  item,
  lanes: propLanes,
  onMove
}: {
  board: Board
  item: KanbanItem
  lanes?: Lane[]
  onMove: (boardId: number, laneId: number | null) => Promise<void>
}) {
  const isCurrentBoard = String(board.id) === String(item.board_id)
  const [boardLanes, setBoardLanes] = useState<Lane[]>(propLanes || [])
  const [loading, setLoading] = useState(!propLanes && !isCurrentBoard)

  useEffect(() => {
    if (isCurrentBoard || propLanes) return
    const boardId = board.id
    if (!boardId) return

    let isCancelled = false
    setLoading(true)
    getLanesByBoardId(boardId).then((data) => {
      if (!isCancelled) {
        setBoardLanes(data.filter((l) => l.id !== null))
        setLoading(false)
      }
    })

    const channel = subscribeLanes(boardId, () => {
      getLanesByBoardId(boardId).then((data) => {
        if (!isCancelled) {
          setBoardLanes(data.filter((l) => l.id !== null))
        }
      })
    })

    return () => {
      isCancelled = true
      supabase.removeChannel(channel)
    }
  }, [board.id, isCurrentBoard, propLanes])

  const lanesList = isCurrentBoard ? propLanes || boardLanes : boardLanes
  const realLanes = lanesList.filter((l) => l.id !== null)

  return (
    <MenuSub>
      <MenuSubTrigger className="flex items-center gap-1.5 min-w-0">
        <span className="text-xs shrink-0">{board.icon || '📋'}</span>
        <span className="truncate flex-1 font-medium">{board.title || 'Untitled Board'}</span>
        {isCurrentBoard && (
          <span className="ml-1 text-[9px] text-muted-foreground font-mono shrink-0">(Current)</span>
        )}
      </MenuSubTrigger>
      <MenuSubContent className="w-52 text-xs shadow-xl">
        <MenuItem
          disabled={isCurrentBoard && item.lane_id === null}
          onClick={() => onMove(Number(board.id), null)}
          className="pl-3 font-medium"
        >
          <Inbox className="mr-2 size-3.5 text-primary shrink-0" />
          <span className="truncate flex-1">Draft</span>
          {isCurrentBoard && item.lane_id === null && (
            <Check className="ml-auto size-3 text-muted-foreground shrink-0" />
          )}
        </MenuItem>

        {loading ? (
          <div className="px-3 py-2 text-[10px] text-muted-foreground">Loading lanes...</div>
        ) : (
          realLanes.map((lane) => {
            const isCurrentLane = isCurrentBoard && item.lane_id === lane.id
            return (
              <MenuItem
                key={lane.id}
                disabled={isCurrentLane}
                onClick={() => onMove(Number(board.id), lane.id)}
                className="pl-3"
              >
                {lane.icon ? (
                  <span className="mr-2 text-xs shrink-0">{lane.icon}</span>
                ) : (
                  <span className="mr-2 size-2 rounded-full bg-primary/40 shrink-0" />
                )}
                <span className="truncate flex-1">{lane.title || 'Untitled Lane'}</span>
                {isCurrentLane && <Check className="ml-auto size-3 text-muted-foreground shrink-0" />}
              </MenuItem>
            )
          })
        )}
      </MenuSubContent>
    </MenuSub>
  )
}

export type ItemMenuContentProps = {
  item: KanbanItem
  variant: MenuVariant
  onEdit: () => void
}

export function ItemMenuContent({ item, variant, onEdit }: ItemMenuContentProps) {
  const updateItem = useItemsStore((s) => s.updateItem)
  const removeItem = useItemsStore((s) => s.removeItem)
  const duplicateItem = useItemsStore((s) => s.duplicateItem)
  const lanes = useLanesStore((s) => s.lanes)
  const boards = useBoardsStore((s) => s.boards)
  const { user } = useUser()

  const canEditBoard = (b: Board) => {
    return (
      b.role === 'owner' ||
      b.role === 'edit' ||
      Boolean(user?.id && b.owner === user.id) ||
      (!b.role && !b.owner)
    )
  }

  const currentBoard = boards.find((b) => String(b.id) === String(item.board_id))
  const otherEditableBoards = boards.filter(
    (b) => String(b.id) !== String(item.board_id) && canEditBoard(b)
  )

  const handleMoveTo = async (targetBoardId: number, targetLaneId: number | null) => {
    if (String(targetBoardId) === String(item.board_id)) {
      await updateItem(item.id, { lane_id: targetLaneId })
    } else {
      await itemsService.updateItem(item.id, { board_id: targetBoardId, lane_id: targetLaneId })
      useItemsStore.setState((s) => ({
        items: s.items.filter((i) => String(i.id) !== String(item.id))
      }))
    }
  }

  return (
    <MenuProvider variant={variant}>
      <MenuItem onClick={onEdit}>
        <Pencil className="mr-2 size-3.5 text-muted-foreground" />
        <span>Edit Task</span>
      </MenuItem>

      <MenuItem onClick={() => duplicateItem(item.id)}>
        <CopyPlus className="mr-2 size-3.5 text-muted-foreground" />
        <span>Duplicate Task</span>
      </MenuItem>

      {/* Move to Submenu */}
      <MenuSub>
        <MenuSubTrigger>
          <FolderInput className="mr-2 size-3.5 text-muted-foreground" />
          <span>Move to</span>
        </MenuSubTrigger>
        <MenuSubContent className="w-56 text-xs shadow-xl">
          {currentBoard ? (
            <BoardLaneSubmenu
              board={currentBoard}
              item={item}
              lanes={lanes}
              onMove={handleMoveTo}
            />
          ) : (
            <BoardLaneSubmenu
              board={
                {
                  id: item.board_id,
                  title: 'Current Board',
                  icon: '📋'
                } as Board
              }
              item={item}
              lanes={lanes}
              onMove={handleMoveTo}
            />
          )}

          {otherEditableBoards.length > 0 && <MenuSeparator />}

          {otherEditableBoards.map((b) => (
            <BoardLaneSubmenu
              key={b.id}
              board={b}
              item={item}
              onMove={handleMoveTo}
            />
          ))}
        </MenuSubContent>
      </MenuSub>

      {/* Priority Submenu */}
      <MenuSub>
        <MenuSubTrigger>
          <Flag className="mr-2 size-3.5 text-muted-foreground" />
          <span>Priority</span>
        </MenuSubTrigger>
        <MenuSubContent className="w-36">
          {([0, 1, 2, 3] as const).map((p) => (
            <MenuItem key={p} onClick={() => updateItem(item.id, { priority: p })}>
              <span className={cn('size-2 rounded-full mr-2', PRIORITY_CONFIG[p].dot)} />
              <span>{PRIORITY_CONFIG[p].label}</span>
            </MenuItem>
          ))}
        </MenuSubContent>
      </MenuSub>

      {/* Color Accent Submenu */}
      <MenuSub>
        <MenuSubTrigger>
          <Palette className="mr-2 size-3.5 text-muted-foreground" />
          <span>Color Accent</span>
        </MenuSubTrigger>
        <MenuSubContent className="w-[240px] p-2">
          <BackgroundPickerContent
            value={item.background}
            onChange={(newBg) => updateItem(item.id, { background: newBg || null })}
          />
        </MenuSubContent>
      </MenuSub>

      <MenuSeparator />

      <MenuItem destructive onClick={() => removeItem(item.id)}>
        <Trash2 className="mr-2 size-3.5" />
        <span>Delete Task</span>
      </MenuItem>
    </MenuProvider>
  )
}
