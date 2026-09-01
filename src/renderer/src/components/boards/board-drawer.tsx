import { useState, useEffect } from 'react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import { Plus, Loader2, Palette } from 'lucide-react'
import { useBoardsStore } from '@/stores/boards'
import { useNavigationStore } from '@/stores/navigation'
import { useUser } from '@clerk/clerk-react'
import { EmojiPicker, EmojiPickerSearch, EmojiPickerContent } from '@/components/ui/emoji-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getBoardBackgroundStyleAndClass } from '@/lib/board-utils'
import { cn } from '@/lib/utils'

const BG_PRESETS = [
  { label: 'None', value: '', colorClass: 'bg-muted/40 border-muted' },
  { label: 'Sunset Accent', value: 'from-amber-500/15 to-rose-500/15', colorClass: 'bg-gradient-to-br from-amber-500/40 to-rose-500/40' },
  { label: 'Ocean Accent', value: 'from-blue-500/15 to-cyan-500/15', colorClass: 'bg-gradient-to-br from-blue-500/40 to-cyan-500/40' },
  { label: 'Emerald Accent', value: 'from-emerald-500/15 to-teal-500/15', colorClass: 'bg-gradient-to-br from-emerald-500/40 to-teal-500/40' },
  { label: 'Purple Accent', value: 'from-purple-500/15 to-pink-500/15', colorClass: 'bg-gradient-to-br from-purple-500/40 to-pink-500/40' },
  { label: 'Midnight Accent', value: 'from-slate-900/40 to-indigo-950/60', colorClass: 'bg-gradient-to-br from-slate-900/60 to-indigo-950/80' },
  { label: 'Cosmic', value: 'bg-gradient-to-r from-purple-600 to-indigo-600', colorClass: 'bg-gradient-to-r from-purple-600 to-indigo-600' },
  { label: 'Sunset Glow', value: 'bg-gradient-to-r from-amber-500 to-rose-600', colorClass: 'bg-gradient-to-r from-amber-500 to-rose-600' },
  { label: 'Northern Lights', value: 'bg-gradient-to-r from-emerald-500 to-teal-700', colorClass: 'bg-gradient-to-r from-emerald-500 to-teal-700' },
  { label: 'Slate Dark', value: 'bg-slate-900', colorClass: 'bg-slate-900 border-slate-700' },
  { label: 'Zinc Dark', value: 'bg-zinc-900', colorClass: 'bg-zinc-900 border-zinc-700' }
]

export type BoardDrawerProps = {
  mode?: 'create' | 'edit'
  board?: Board | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactElement | null
  onSuccess?: (board: Board) => void
}

export function BoardDrawer({
  mode: propMode,
  board,
  open: propOpen,
  onOpenChange: propOnOpenChange,
  trigger,
  onSuccess
}: BoardDrawerProps) {
  const isControlled = propOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isControlled ? propOpen : internalOpen
  const setOpen = (newOpen: boolean) => {
    if (propOnOpenChange) propOnOpenChange(newOpen)
    if (!isControlled) setInternalOpen(newOpen)
  }

  const isEdit = propMode === 'edit' || !!board

  const [popoverOpen, setPopoverOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('📋')
  const [background, setBackground] = useState('')
  const [pinned, setPinned] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigationStore((s) => s.navigate)
  const { user } = useUser()

  useEffect(() => {
    if (open) {
      if (board) {
        setTitle(board.title || '')
        setDescription(board.description || '')
        setIcon(board.icon || '📋')
        setBackground(board.background || '')
        setPinned(!!board.pinned)
      } else {
        setTitle('')
        setDescription('')
        setIcon('📋')
        setBackground('')
        setPinned(false)
      }
      setError(null)
    }
  }, [open, board])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Board title is required.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      if (isEdit) {
        if (board?.id === undefined) {
          setError('Board ID is missing.')
          setIsSubmitting(false)
          return
        }

        const updated = await useBoardsStore.getState().updateBoard(board.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          icon,
          background: background || undefined,
          pinned
        })

        if (!updated) {
          setError('Failed to update board.')
          setIsSubmitting(false)
          return
        }

        if (onSuccess) onSuccess(updated)
        setOpen(false)
      } else {
        const newBoard = await useBoardsStore.getState().addBoard({
          title: title.trim(),
          description: description.trim() || undefined,
          icon,
          pinned: false,
          background: background || undefined,
          owner: user?.id || undefined
        })

        if (!newBoard) {
          setError('Failed to create board. Please check database permissions.')
          setIsSubmitting(false)
          return
        }

        if (onSuccess) onSuccess(newBoard)
        setOpen(false)

        if (newBoard.id !== undefined) {
          navigate({ name: 'board-detail', boardId: newBoard.id })
        }
      }
    } catch (err) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} board:`, err)
      setError('An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const defaultTrigger = (
    <SidebarMenuButton size="default" className="h-8 w-full gap-2 px-2 text-xs">
      <div className="flex size-5 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
        <Plus className="size-3.5" />
      </div>
      <span className="truncate font-medium">New Board</span>
    </SidebarMenuButton>
  )

  const activeTrigger: React.ReactElement | null =
    trigger !== undefined ? trigger : isControlled || isEdit ? null : defaultTrigger


  return (
    <Drawer open={open} onOpenChange={setOpen} swipeDirection="right">
      {activeTrigger ? <DrawerTrigger render={activeTrigger} /> : null}
      <DrawerContent>
        <form onSubmit={handleSubmit}>
          <DrawerHeader>
            <DrawerTitle>{isEdit ? 'Edit Board' : 'Create New Board'}</DrawerTitle>
            <DrawerDescription>
              {isEdit
                ? 'Update your board details and settings.'
                : 'Add a new Kanban board to organize your tasks.'}
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
              <label className="text-xs font-medium text-muted-foreground">Board Icon</label>
              <div>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        className="flex h-9 w-full items-center justify-between px-3 text-left font-normal"
                      >
                        <span className="flex items-center gap-2">
                          <span className="flex size-6 items-center justify-center rounded bg-muted/60 text-base">
                            {icon}
                          </span>
                          <span className="text-xs text-muted-foreground">Choose Icon</span>
                        </span>
                      </Button>
                    }
                  />
                  <PopoverContent
                    align="start"
                    className="w-[300px] border-none bg-transparent p-0 shadow-none"
                  >
                    <EmojiPicker
                      className="h-[326px] w-full rounded-lg border shadow-md"
                      onEmojiSelect={({ emoji }) => {
                        setIcon(emoji)
                        setPopoverOpen(false)
                      }}
                    >
                      <EmojiPickerSearch />
                      <EmojiPickerContent />
                    </EmojiPicker>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Title Input */}
            <div className="space-y-1.5">
              <label htmlFor="board-title" className="text-xs font-medium text-muted-foreground">
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
              <label htmlFor="board-desc" className="text-xs font-medium text-muted-foreground">
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

            {/* Background Style - Presets & Custom Color */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Palette className="size-3.5" />
                  <span>Background Color</span>
                </span>
                <span className="text-[11px] text-muted-foreground/70">Presets & Custom</span>
              </label>

              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {BG_PRESETS.map((preset) => {
                  const isSelected = background === preset.value
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setBackground(preset.value)}
                      className={cn(
                        'flex items-center gap-2 rounded-md border p-1.5 text-left text-xs transition-all hover:border-primary/50 cursor-pointer',
                        isSelected
                          ? 'border-primary bg-primary/10 font-medium text-primary shadow-xs ring-1 ring-primary/30'
                          : 'border-input bg-background hover:bg-muted/50'
                      )}
                    >
                      <span
                        className={cn('size-3.5 shrink-0 rounded-full border shadow-xs', preset.colorClass)}
                      />
                      <span className="truncate text-[11px]">{preset.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Custom Color Input */}
              <div className="flex items-center gap-2 pt-1">
                <label htmlFor="custom-color-picker" className="text-xs text-muted-foreground shrink-0">
                  Custom Color:
                </label>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    id="custom-color-picker"
                    type="color"
                    value={background.startsWith('#') ? background : '#3b82f6'}
                    onChange={(e) => setBackground(e.target.value)}
                    className="size-7 rounded border border-input cursor-pointer bg-transparent p-0.5 shrink-0"
                    title="Pick custom background color"
                  />
                  <Input
                    placeholder="Hex color (e.g. #3b82f6)..."
                    value={background.startsWith('#') ? background : ''}
                    onChange={(e) => setBackground(e.target.value)}
                    disabled={isSubmitting}
                    className="text-xs font-mono h-8 flex-1"
                  />
                  {background ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setBackground('')}
                      className="h-8 text-xs text-muted-foreground hover:text-foreground px-2 shrink-0"
                    >
                      Clear
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Background Live Preview */}
            {background ? (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                  <span>Background Preview:</span>
                  <span className="text-[10px] opacity-70">Color Theme</span>
                </div>
                <div
                  className={cn(
                    'relative h-16 w-full rounded-lg border shadow-inner flex items-center justify-center transition-all overflow-hidden p-2',
                    getBoardBackgroundStyleAndClass(background).className
                  )}
                  style={getBoardBackgroundStyleAndClass(background).style}
                >
                  <span className="relative z-10 text-xs font-medium bg-background/85 backdrop-blur-xs px-3 py-1 rounded-md border shadow-xs flex items-center gap-1.5">
                    <span>{icon}</span>
                    <span className="truncate max-w-[200px]">{title || 'Board Title'}</span>
                  </span>
                </div>
              </div>
            ) : null}

            {/* Pinned Toggle (for edit mode) */}
            {isEdit && (
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
            )}
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
                  {isEdit ? 'Saving...' : 'Creating...'}
                </>
              ) : isEdit ? (
                'Save Changes'
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

// ── Backward compatibility wrappers ──

export function CreateBoardDrawer(props: Omit<BoardDrawerProps, 'mode' | 'board'>) {
  return <BoardDrawer mode="create" {...props} />
}

export function EditBoardDrawer(
  props: Omit<BoardDrawerProps, 'mode'> & { board: Board | null; open: boolean; onOpenChange: (open: boolean) => void }
) {
  return <BoardDrawer mode="edit" {...props} />
}
