import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { redeemInviteCode } from '@/services/invites'
import { useBoardsStore } from '@/stores/boards'
import { useNavigationStore } from '@/stores/navigation'
import { useUser } from '@/providers/auth-provider'
import { LogIn, Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react'

type JoinBoardModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JoinBoardModal({ open, onOpenChange }: JoinBoardModalProps) {
  const { user } = useUser()
  const navigate = useNavigationStore((s) => s.navigate)
  const refreshBoards = useBoardsStore((s) => s.refresh)

  const [inviteCode, setInviteCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'info' | 'error'
    message: string
  } | null>(null)

  const handleReset = () => {
    setInviteCode('')
    setFeedback(null)
    setIsSubmitting(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleReset()
    }
    onOpenChange(newOpen)
  }

  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const cleanCode = inviteCode.trim().toUpperCase()

    if (!cleanCode) {
      setFeedback({ type: 'error', message: 'Please enter an invite code.' })
      return
    }

    if (!user?.id) {
      setFeedback({ type: 'error', message: 'You must be logged in to join a board.' })
      return
    }

    setIsSubmitting(true)
    setFeedback(null)

    try {
      const res = await redeemInviteCode(cleanCode, user.id)

      if (res.success) {
        if (res.already_member) {
          setFeedback({
            type: 'info',
            message: 'You already have access to this board.'
          })
        } else {
          setFeedback({
            type: 'success',
            message: 'Board joined successfully.'
          })
        }

        // Refresh boards store so joined board appears in list
        await refreshBoards()

        // After brief delay, navigate to board if returned
        if (res.board?.id) {
          setTimeout(() => {
            onOpenChange(false)
            navigate({ name: 'board-detail', boardId: res.board!.id! })
          }, 1200)
        }
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Failed to join board.'
        })
      }
    } catch (err) {
      console.error('Error redeeming invite code:', err)
      setFeedback({
        type: 'error',
        message: 'An unexpected error occurred while redeeming code.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm p-5 space-y-4">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LogIn className="size-4" />
            </div>
            <DialogTitle>Join Shared Board</DialogTitle>
          </div>
          <DialogDescription>
            Enter the temporary invite code shared with you by the board owner.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleJoin} className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="join-invite-code" className="text-xs font-semibold text-foreground">
              Enter invite code:
            </label>
            <Input
              id="join-invite-code"
              placeholder="e.g. K7F9-X2P4"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="font-mono uppercase tracking-widest text-center text-sm font-bold h-9"
              autoFocus
              maxLength={12}
            />
          </div>

          {feedback && (
            <div
              className={`rounded-lg p-3 text-xs font-medium flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : feedback.type === 'info'
                    ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                    : 'bg-destructive/10 text-destructive border border-destructive/20'
              }`}
            >
              {feedback.type === 'success' && <CheckCircle2 className="size-4 shrink-0" />}
              {feedback.type === 'info' && <Info className="size-4 shrink-0" />}
              {feedback.type === 'error' && <AlertCircle className="size-4 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || !inviteCode.trim()}
              className="w-full h-8 text-xs font-semibold cursor-pointer gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Joining Board...
                </>
              ) : (
                'Join Board'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
