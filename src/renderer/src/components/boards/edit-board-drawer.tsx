import { useState, useEffect } from 'react'
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
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { useBoardsStore } from '@/stores/boards'

const EMOJI_OPTIONS = ['📋', '🚀', '📊', '⚡', '📌', '🎯', '💡', '🎨']
const BG_OPTIONS = [
  { label: 'None', value: '' },
  { label: 'Sunset', value: 'from-amber-500/10 to-rose-500/10' },
  { label: 'Ocean', value: 'from-blue-500/10 to-cyan-500/10' },
  { label: 'Emerald', value: 'from-emerald-500/10 to-teal-500/10' },
  { label: 'Purple', value: 'from-purple-500/10 to-pink-500/10' },
]

type EditBoardDrawerProps = {
  board: Board | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (updatedBoard: Board) => void
}

export function EditBoardDrawer({
  board,
  open,
  onOpenChange,
  onSuccess,
}: EditBoardDrawerProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('📋')
  const [background, setBackground] = useState('')
  const [pinned, setPinned] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (board) {
      setTitle(board.title || '')
      setDescription(board.description || '')
      setIcon(board.icon || '📋')
      setBackground(board.background || '')
      setPinned(!!board.pinned)
    }
  }, [board])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (board?.id === undefined) return

    if (!title.trim()) {
      setError('Board title is required.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const updated = await useBoardsStore.getState().updateBoard(board.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        icon,
        background: background || undefined,
        pinned,
      })

      if (!updated) {
        setError('Failed to update board.')
        setIsSubmitting(false)
        return
      }

      if (onSuccess) {
        onSuccess(updated)
      }
      onOpenChange(false)
    } catch (err) {
      console.error('Error updating board:', err)
      setError('An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="right">
      <DrawerContent>
        <form onSubmit={handleSubmit}>
          <DrawerHeader>
            <DrawerTitle>Edit Board</DrawerTitle>
            <DrawerDescription>
              Update your board details and settings.
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-4 p-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-xs font-medium text-destructive">
                {error}
              </div>
            )}

            {/* Icon Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Board Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`flex h-9 w-9 items-center justify-center rounded-md border text-lg transition-all ${
                      icon === emoji
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-input bg-background hover:bg-muted'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Title Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="edit-title"
                className="text-xs font-medium text-muted-foreground"
              >
                Board Title *
              </label>
              <Input
                id="edit-title"
                placeholder="e.g. Project Roadmap"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Description Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="edit-desc"
                className="text-xs font-medium text-muted-foreground"
              >
                Description (Optional)
              </label>
              <Input
                id="edit-desc"
                placeholder="e.g. Sprint tracking and feature backlogs"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Background Style */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Theme Accent (Optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {BG_OPTIONS.map((bg) => (
                  <button
                    key={bg.label}
                    type="button"
                    onClick={() => setBackground(bg.value)}
                    className={`rounded-md border px-2.5 py-1 text-xs transition-all ${
                      background === bg.value
                        ? 'border-primary bg-primary/10 font-medium text-primary shadow-xs'
                        : 'border-input bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pinned Toggle */}
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-xs font-medium">Pin to sidebar</p>
                <p className="text-[11px] text-muted-foreground">
                  Keep this board easily accessible
                </p>
              </div>
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
            </div>
          </div>

          <DrawerFooter className="flex-row justify-end gap-2">
            <DrawerClose
              render={
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              }
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
