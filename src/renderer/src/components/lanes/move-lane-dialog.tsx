import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, FolderInput, ArrowRight } from 'lucide-react'
import { useLanesStore } from '@/stores/lanes'
import { useItemsStore } from '@/stores/items'

type MoveLaneDialogProps = {
  lane: Lane | null
  targetBoard: Board | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MoveLaneDialog({ lane, targetBoard, open, onOpenChange }: MoveLaneDialogProps) {
  const [isMoving, setIsMoving] = useState(false)
  const moveLaneToBoard = useLanesStore((s) => s.moveLaneToBoard)

  if (!lane || !targetBoard || lane.isVirtual || lane.id === null || targetBoard.id === undefined) {
    return null
  }

  const items = useItemsStore.getState().items
  const taskCount = items.filter((i) => i.lane_id === lane.id).length

  const handleMove = async () => {
    setIsMoving(true)
    try {
      onOpenChange(false)
      await moveLaneToBoard(lane.id!, Number(targetBoard.id))
    } catch (err) {
      console.error('Error moving lane to board:', err)
    } finally {
      setIsMoving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <FolderInput className="size-5 shrink-0" />
            <DialogTitle>Move Lane to Another Board</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-xs space-y-2">
            <div>
              Are you sure you want to move lane{' '}
              <span className="font-semibold text-foreground">"{lane.title || 'Untitled Lane'}"</span> to{' '}
              <span className="font-semibold text-foreground">
                {targetBoard.icon || '📋'} {targetBoard.title || 'Untitled Board'}
              </span>
              ?
            </div>
            <div className="rounded-lg border bg-muted/30 p-2.5 text-[11px] text-muted-foreground">
              {taskCount > 0 ? (
                <span>
                  All <span className="font-bold text-foreground">{taskCount} tasks</span> inside this lane will also be moved to{' '}
                  <span className="font-medium text-foreground">{targetBoard.title}</span>.
                </span>
              ) : (
                <span>This lane has no tasks and will be moved to the new board.</span>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isMoving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleMove}
            disabled={isMoving}
            className="gap-1.5"
          >
            {isMoving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Moving...</span>
              </>
            ) : (
              <>
                <ArrowRight className="size-3.5" />
                <span>Move Lane</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
