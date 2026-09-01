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
import { Loader2, AlertTriangle } from 'lucide-react'
import { useLanesStore } from '@/stores/lanes'

type DeleteLaneDialogProps = {
  lane: Lane | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteLaneDialog({ lane, open, onOpenChange }: DeleteLaneDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const removeLane = useLanesStore((s) => s.removeLane)

  if (!lane || lane.isVirtual || lane.id === null) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await removeLane(lane.id)
      onOpenChange(false)
    } catch (err) {
      console.error('Error deleting lane:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5 shrink-0" />
            <DialogTitle>Delete Lane</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-xs space-y-1">
            <span>
              Are you sure you want to delete <span className="font-semibold text-foreground">"{lane.title}"</span>?
            </span>
            <span className="block text-muted-foreground font-medium pt-1">
              Items in this lane will automatically be moved to Draft.
            </span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
            Delete Column
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
