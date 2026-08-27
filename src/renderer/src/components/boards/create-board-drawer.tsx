import { useState } from 'react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import { Plus, Loader2 } from 'lucide-react'
import { createBoard } from '@/services/boards'
import { useNavigationStore } from '@/stores/navigation'
import { useUser } from '@clerk/clerk-react'

const EMOJI_OPTIONS = ['📋', '🚀', '📊', '⚡', '📌', '🎯', '💡', '🎨']
const BG_OPTIONS = [
  { label: 'None', value: '' },
  { label: 'Sunset', value: 'from-amber-500/10 to-rose-500/10' },
  { label: 'Ocean', value: 'from-blue-500/10 to-cyan-500/10' },
  { label: 'Emerald', value: 'from-emerald-500/10 to-teal-500/10' },
  { label: 'Purple', value: 'from-purple-500/10 to-pink-500/10' },
]

export function CreateBoardDrawer() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('📋')
  const [background, setBackground] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigationStore((s) => s.navigate)
  const { user } = useUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Board title is required.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const newBoard = await createBoard({
        title: title.trim(),
        description: description.trim() || undefined,
        icon,
        pinned: false,
        background: background || undefined,
        owner: user?.id || undefined,
      })

      if (!newBoard) {
        setError('Failed to create board. Please check database permissions.')
        setIsSubmitting(false)
        return
      }

      // Reset form and close
      setTitle('')
      setDescription('')
      setIcon('📋')
      setBackground('')
      setOpen(false)

      if (newBoard.id !== undefined) {
        navigate({ name: 'board-detail', boardId: newBoard.id })
      }
    } catch (err) {
      console.error('Error creating board:', err)
      setError('An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} swipeDirection="right">
      <DrawerTrigger
        render={
          <SidebarMenuButton size="default" className="h-8 w-full gap-2 px-2 text-xs">
            <div className="flex size-5 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <Plus className="size-3.5" />
            </div>
            <span className="truncate font-medium">New Board</span>
          </SidebarMenuButton>
        }
      />
      <DrawerContent>
        <form onSubmit={handleSubmit}>
          <DrawerHeader>
            <DrawerTitle>Create New Board</DrawerTitle>
            <DrawerDescription>
              Add a new Kanban board to organize your tasks.
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
                htmlFor="board-title"
                className="text-xs font-medium text-muted-foreground"
              >
                Board Title *
              </label>
              <Input
                id="board-title"
                placeholder="e.g. Project Roadmap"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            {/* Description Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="board-desc"
                className="text-xs font-medium text-muted-foreground"
              >
                Description (Optional)
              </label>
              <Input
                id="board-desc"
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
                  Creating...
                </>
              ) : (
                'Create Board'
              )}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
