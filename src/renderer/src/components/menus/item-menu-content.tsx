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

export const PRIORITY_CONFIG = {
  0: { label: 'Low', badge: 'bg-muted text-muted-foreground border-border', dot: 'bg-slate-400' },
  1: { label: 'Medium', badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30', dot: 'bg-amber-500' },
  2: { label: 'High', badge: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30', dot: 'bg-orange-500' },
  3: { label: 'Urgent', badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-semibold', dot: 'bg-rose-500' }
} as const

function OtherBoardMoveGroup({
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
    const channel = subscribeLanes(boardId, () => {
      loadLanes()
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [board.id])

  return (
    <>
      <MenuSeparator />
      <MenuItem
        onClick={() => onMove(Number(board.id), null)}
        className="font-bold text-foreground flex items-center justify-between"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs shrink-0">{board.icon || '📋'}</span>
          <span className="truncate">{board.title || 'Untitled Board'}</span>
        </div>
        <span className="text-[9px] text-primary/80 font-normal">➔ Draft</span>
      </MenuItem>

      {loading ? (
        <div className="pl-6 py-1 text-[10px] text-muted-foreground">Loading lanes...</div>
      ) : (
        lanes.map((lane) => (
          <MenuItem
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
          </MenuItem>
        ))
      )}
    </>
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

  const otherBoards = boards.filter((b) => String(b.id) !== String(item.board_id))

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
          <MenuItem
            disabled={item.lane_id === null}
            onClick={() => handleMoveTo(Number(item.board_id), null)}
            className="pl-4 font-medium"
          >
            <Inbox className="mr-2 size-3.5 text-primary shrink-0" />
            <span className="truncate flex-1">Draft</span>
            {item.lane_id === null && <Check className="ml-auto size-3 text-muted-foreground" />}
          </MenuItem>

          {lanes
            .filter((l) => l.id !== null)
            .map((lane) => {
              const isCurrent = item.lane_id === lane.id
              return (
                <MenuItem
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
                </MenuItem>
              )
            })}

          {otherBoards.map((b) => (
            <OtherBoardMoveGroup key={b.id} board={b} onMove={handleMoveTo} />
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
