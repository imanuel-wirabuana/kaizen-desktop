import { useState } from 'react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle } from 'lucide-react'
import { useBoardsStore } from '@/stores/boards'

type DeleteBoardDrawerProps = {
  board: Board | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteBoardDrawer({
  board,
  open,
  onOpenChange,
  onSuccess,
}: DeleteBoardDrawerProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (board?.id === undefined) return

    setIsDeleting(true)
    setError(null)

    try {
      const ok = await useBoardsStore.getState().removeBoard(board.id)
      if (!ok) {
        setError('Failed to delete board. Please try again.')
        setIsDeleting(false)
        return
      }

      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error('Error deleting board:', err)
      setError('An unexpected error occurred.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <DrawerTitle>Delete Board</DrawerTitle>
          </div>
          <DrawerDescription>
            Are you sure you want to delete{' '}
            <span className="font-semibold text-foreground">
              {board?.title || 'this board'}
            </span>
            ? This action cannot be undone.
          </DrawerDescription>
        </DrawerHeader>

        {error && (
          <div className="mx-4 rounded-md bg-destructive/15 p-3 text-xs font-medium text-destructive">
            {error}
          </div>
        )}

        <DrawerFooter className="flex-row justify-end gap-2 pt-4">
          <DrawerClose
            render={
              <Button type="button" variant="outline" disabled={isDeleting}>
                Cancel
              </Button>
            }
          />
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Board'
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
