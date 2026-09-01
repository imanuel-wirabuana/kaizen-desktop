import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { EmojiPicker, EmojiPickerSearch, EmojiPickerContent } from '@/components/ui/emoji-picker'
import { Plus, X, Loader2, Palette, Sparkles } from 'lucide-react'
import { useLanesStore } from '@/stores/lanes'
import { BackgroundPicker } from '@/components/ui/background-picker'
import { getBoardBackgroundStyleAndClass } from '@/lib/board-utils'
import { cn } from '@/lib/utils'

export function InlineCreateLane({ boardId }: { boardId: number | string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState('📌')
  const [description, setDescription] = useState('')
  const [background, setBackground] = useState('')
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addLane = useLanesStore((s) => s.addLane)

  const handleOpen = () => {
    setTitle('')
    setIcon('📌')
    setDescription('')
    setBackground('')
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    setTitle('')
    setIcon('📌')
    setDescription('')
    setBackground('')
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!title.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await addLane({
        board_id: Number(boardId),
        title: title.trim(),
        icon: icon || null,
        description: description.trim() || null,
        background: background || null
      })
      handleClose()
    } catch (err) {
      console.error('Error creating lane inline:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleClose()
    }
  }

  const bgProps = getBoardBackgroundStyleAndClass(background)
  const hasCustomBackground = Boolean(background && background.trim())

  if (!isOpen) {
    return (
      <div className="w-72 shrink-0">
        <Button
          variant="outline"
          onClick={handleOpen}
          className="h-12 w-full justify-start gap-2.5 rounded-2xl border-2 border-dashed bg-background/40 border-muted-foreground/25 px-4 text-xs font-medium text-muted-foreground hover:bg-background/80 hover:text-foreground hover:border-primary/50 shadow-2xs transition-all duration-200 cursor-pointer"
        >
          <div className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Plus className="size-3.5" />
          </div>
          <span>Add another lane</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="w-72 shrink-0 rounded-2xl border border-primary/40 bg-card p-3.5 shadow-xl transition-all space-y-3 ring-1 ring-primary/20 overflow-hidden">
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-3">
        {/* Header Title & Color Trigger */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            <span className="text-xs font-semibold tracking-tight text-foreground">Create New Lane</span>
          </div>
          <div className="flex items-center gap-1">
            <BackgroundPicker
              value={background}
              onChange={setBackground}
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'size-6 rounded-md text-muted-foreground hover:text-foreground',
                    hasCustomBackground ? 'text-primary bg-primary/10' : ''
                  )}
                  title="Choose Lane Background Accent"
                >
                  <Palette className="size-3.5" />
                </Button>
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="size-6 text-muted-foreground hover:text-foreground rounded-md"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Icon & Title Inputs */}
        <div className="space-y-2">
          {/* Emoji Icon Selector */}
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  className="flex h-8 w-full items-center justify-between px-2.5 text-left font-normal bg-background"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm">{icon}</span>
                    <span className="text-xs text-muted-foreground">Choose Emoji Icon</span>
                  </span>
                </Button>
              }
            />
            <PopoverContent align="start" className="w-[300px] border-none bg-transparent p-0 shadow-none z-50">
              <EmojiPicker
                className="h-[300px] w-full rounded-lg border shadow-md"
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

          <Input
            placeholder="Lane title (e.g. In Progress)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            autoFocus
            className="h-8 text-xs font-medium bg-background"
          />

          <Input
            placeholder="Description (optional)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            className="h-7 text-[11px] text-muted-foreground bg-background"
          />
        </div>

        {/* Live Header Background Accent Preview */}
        <div className="space-y-1 pt-0.5">
          <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
            <span>Header Preview:</span>
            {hasCustomBackground ? (
              <button
                type="button"
                onClick={() => setBackground('')}
                className="text-[9px] text-muted-foreground/80 hover:text-foreground underline cursor-pointer"
              >
                Reset color
              </button>
            ) : (
              <span className="text-[9px] opacity-70">Default Theme</span>
            )}
          </div>

          <div
            className={cn(
              'flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold shadow-2xs overflow-hidden transition-all duration-200 gap-1.5',
              hasCustomBackground ? bgProps.className : 'bg-muted/30 border-border/80'
            )}
            style={hasCustomBackground ? { background: background! } : undefined}
          >
            <div className="flex items-center gap-1.5 truncate">
              {icon && <span className="text-sm shrink-0">{icon}</span>}
              <span className="truncate text-foreground font-semibold">
                {title.trim() || 'Untitled Lane'}
              </span>
            </div>
            <span className="flex size-4 items-center justify-center rounded-full bg-background/80 text-[9px] font-bold text-muted-foreground border shrink-0">
              0
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <span className="text-[10px] text-muted-foreground/70">
            Press <kbd className="font-mono text-[9px] bg-muted px-1 py-0.5 rounded border">Enter</kbd>
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-7 text-xs px-2.5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!title.trim() || isSubmitting}
              className="h-7 text-xs px-3 font-medium cursor-pointer shadow-2xs"
            >
              {isSubmitting ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
              Add Lane
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
