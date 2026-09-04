import { useState } from 'react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Loader2, LogOut } from 'lucide-react'
import { leaveBoard } from '@/services/members'
import { useBoardsStore } from '@/stores/boards'
import { useUser } from '@/providers/auth-provider'

type LeaveBoardDrawerProps = {
  board: Board | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function LeaveBoardDrawer({
  board,
  open,
  onOpenChange,
  onSuccess
}: LeaveBoardDrawerProps) {
  const [isLeaving, setIsLeaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useUser()

  const isOwner =
    Boolean(board) &&
    (board?.role === 'owner' ||
      Boolean(user?.id && board?.owner === user.id))

  const handleLeave = async () => {
    if (board?.id === undefined || !user?.id) return

    if (isOwner) {
      setError('As the owner of this board, you cannot leave it. You can delete it instead.')
      return
    }

    setIsLeaving(true)
    setError(null)

    try {
      const ok = await leaveBoard(board.id, user.id)
      if (!ok) {
        setError('Failed to leave board. Please try again.')
        setIsLeaving(false)
        return
      }

      await useBoardsStore.getState().refresh()

      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error('Error leaving board:', err)
      setError('An unexpected error occurred.')
    } finally {
      setIsLeaving(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <div className="flex items-center gap-2 text-destructive">
            <LogOut className="size-5" />
            <DrawerTitle>Leave Board</DrawerTitle>
          </div>
          <DrawerDescription>
            {isOwner ? (
              <>
                You are the owner of{' '}
                <span className="font-semibold text-foreground">{board?.title || 'this board'}</span>.
                Owners cannot leave their own board (you can delete it instead).
              </>
            ) : (
              <>
                Are you sure you want to leave{' '}
                <span className="font-semibold text-foreground">{board?.title || 'this board'}</span>?
                You will lose access to this board until you are re-invited.
              </>
            )}
          </DrawerDescription>
        </DrawerHeader>

        {(error || isOwner) && (
          <div className="mx-4 rounded-md bg-destructive/15 p-3 text-xs font-medium text-destructive">
            {error || 'As board owner, you cannot leave your own board.'}
          </div>
        )}

        <DrawerFooter className="flex-row justify-end gap-2 pt-4">
          <DrawerClose
            render={
              <Button type="button" variant="outline" disabled={isLeaving}>
                Cancel
              </Button>
            }
          />
          <Button
            type="button"
            variant="destructive"
            onClick={handleLeave}
            disabled={isLeaving || isOwner}
          >
            {isLeaving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Leaving...
              </>
            ) : (
              'Leave Board'
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default LeaveBoardDrawer
