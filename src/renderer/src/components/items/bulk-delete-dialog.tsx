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

interface BulkDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  count: number
  onConfirm: () => Promise<void>
}

export function BulkDeleteDialog({
  open,
  onOpenChange,
  count,
  onConfirm
}: BulkDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (err) {
      console.error('Error in bulk delete:', err)
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
            <DialogTitle>Delete {count} {count === 1 ? 'Task' : 'Tasks'}</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-xs space-y-1">
            <span>
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-foreground">
                {count} selected {count === 1 ? 'task' : 'tasks'}
              </span>
              ?
            </span>
            <span className="block text-muted-foreground font-medium pt-1">
              This action cannot be undone.
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
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 size-3.5 animate-spin" />
                Deleting...
              </>
            ) : (
              `Delete ${count} ${count === 1 ? 'Task' : 'Tasks'}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
