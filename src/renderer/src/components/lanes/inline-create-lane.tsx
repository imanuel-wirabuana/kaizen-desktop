import { useState } from 'react'
import { useUser } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { InlineEmojiPicker } from '@/components/ui/emoji-picker'
import { Plus, X, Loader2, Palette, Sparkles, Smile } from 'lucide-react'
import { useLanesStore } from '@/stores/lanes'
import { BackgroundPicker } from '@/components/ui/background-picker'
import { getBoardBackgroundStyleAndClass } from '@/lib/board-utils'
import { cn } from '@/lib/utils'

export function InlineCreateLane({ boardId }: { boardId: number | string }) {
  const { user } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState('📌')
  const [description, setDescription] = useState('')
  const [background, setBackground] = useState('')
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
        background: background || null,
        owner: user?.id || null
      })
      handleClose()
    } catch (err) {
      console.error('Error creating lane inline:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isTextArea = (e.target as HTMLElement)?.tagName === 'TEXTAREA'
    if (e.key === 'Enter') {
      if (isTextArea) {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          handleSubmit()
        }
        return
      }
      if (!e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
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
          className="h-14 w-full justify-start gap-2.5 rounded-xl border-2 border-dashed bg-card/40 border-muted-foreground/25 px-4 text-xs font-medium text-muted-foreground hover:bg-card/80 hover:text-foreground hover:border-primary/50 shadow-2xs transition-all duration-200 cursor-pointer"
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
    <div
      className={cn(
        'w-72 shrink-0 rounded-xl border border-primary/40 p-3 shadow-md space-y-2.5 ring-1 ring-primary/20 transition-all overflow-hidden relative',
        hasCustomBackground
          ? bgProps.className
          : 'bg-neutral-950/10 dark:bg-black/70 backdrop-blur-md'
      )}
      style={hasCustomBackground ? bgProps.style : undefined}
    >
      {hasCustomBackground && bgProps.isImage && (
        <div className="absolute inset-0 bg-background/70 dark:bg-background/80 pointer-events-none" />
      )}
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-2.5 relative z-10">
        {/* Header Title & Color Trigger */}
        <div className="flex items-center justify-between select-none">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            <span className="text-xs font-semibold tracking-tight text-foreground">New Lane</span>
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
              title="Close (Esc)"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Side-by-side Emoji Icon & Title */}
        <div className="flex items-center gap-1.5">
          <InlineEmojiPicker
            value={icon}
            onChange={(emoji) => setIcon(emoji)}
            onClear={() => setIcon('📌')}
            align="start"
            side="bottom"
            title="Choose icon"
            trigger={
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8 shrink-0 text-base p-0 rounded-lg cursor-pointer bg-background hover:bg-muted border-border/80 shadow-2xs transition-transform active:scale-95"
                title="Choose icon"
              >
                {icon || <Smile className="size-4 text-muted-foreground/60" />}
              </Button>
            }
          />

          <Input
            placeholder="Lane title (e.g. In Progress)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            autoFocus
            className="h-8 text-xs font-medium bg-background rounded-lg border-border/80 flex-1 shadow-2xs"
          />
        </div>

        {/* Description Textarea */}
        <Textarea
          placeholder="Description (optional)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          className="min-h-[48px] max-h-[120px] text-xs text-muted-foreground bg-background rounded-lg border-border/80 resize-none py-1.5 px-2.5 leading-relaxed focus-visible:ring-1 focus-visible:ring-primary/40 shadow-2xs"
        />

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-1.5 border-t border-border/50 gap-2">
          <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1 select-none shrink-0">
            <kbd className="font-mono text-[9px] bg-muted px-1 py-0.5 rounded border border-border/60">↵ Enter</kbd>
            <span className="opacity-40">·</span>
            <kbd className="font-mono text-[9px] bg-muted px-1 py-0.5 rounded border border-border/60">Esc</kbd>
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-7 text-xs px-2.5 rounded-lg text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!title.trim() || isSubmitting}
              className="h-7 text-xs px-3 font-medium rounded-lg cursor-pointer shadow-2xs gap-1"
            >
              {isSubmitting ? <Loader2 className="size-3 animate-spin" /> : null}
              Add Lane
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
