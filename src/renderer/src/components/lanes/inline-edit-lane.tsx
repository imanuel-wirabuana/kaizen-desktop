import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { InlineEmojiPicker } from '@/components/ui/emoji-picker'
import { BackgroundPicker } from '@/components/ui/background-picker'
import { Pencil, X, Smile, Palette, Loader2 } from 'lucide-react'
import { useLanesStore } from '@/stores/lanes'
import { getBoardBackgroundStyleAndClass } from '@/lib/board-utils'
import { cn } from '@/lib/utils'

type InlineEditLaneProps = {
  lane: Lane
  isEditing: boolean
  onEditingChange: (editing: boolean) => void
  readOnly?: boolean
}

export function InlineEditLane({ lane, isEditing, onEditingChange, readOnly = false }: InlineEditLaneProps) {
  const [title, setTitle] = useState(lane.title || '')
  const [icon, setIcon] = useState<string | null>(lane.icon || null)
  const [description, setDescription] = useState(lane.description || '')
  const [background, setBackground] = useState<string>(lane.background || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const updateLane = useLanesStore((s) => s.updateLane)

  useEffect(() => {
    setTitle(lane.title || '')
    setIcon(lane.icon || null)
    setDescription(lane.description || '')
    setBackground(lane.background || '')
  }, [lane, isEditing])

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
    }
  }, [isEditing])

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (readOnly || isSubmitting) {
      onEditingChange(false)
      return
    }
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      handleCancel()
      return
    }

    setIsSubmitting(true)
    try {
      if (
        trimmedTitle !== (lane.title || '') ||
        icon !== (lane.icon || null) ||
        description.trim() !== (lane.description || '') ||
        background !== (lane.background || '')
      ) {
        await updateLane(lane.id, {
          title: trimmedTitle,
          icon: icon || null,
          description: description.trim() || null,
          background: background || null
        })
      }
      onEditingChange(false)
    } catch (err) {
      console.error('Failed to update lane:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setTitle(lane.title || '')
    setIcon(lane.icon || null)
    setDescription(lane.description || '')
    setBackground(lane.background || '')
    onEditingChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isTextArea = (e.target as HTMLElement)?.tagName === 'TEXTAREA'
    if (e.key === 'Enter') {
      if (isTextArea) {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          handleSave()
        }
        return
      }
      if (!e.shiftKey) {
        e.preventDefault()
        handleSave()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  if (isEditing) {
    const bgProps = getBoardBackgroundStyleAndClass(background)
    const hasCustomBackground = Boolean(background && background.trim())

    return (
      <div
        className="w-full rounded-xl border border-primary/40 p-2.5 shadow-md space-y-1.5 ring-1 ring-primary/20 bg-card transition-all overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSave} onKeyDown={handleKeyDown} className="space-y-1.5 relative z-10">
          {/* Header Banner (Previews background only on this banner) */}
          <div
            className={cn(
              'relative flex items-center justify-between select-none -mx-2.5 -mt-2.5 px-2.5 py-1.5 rounded-t-[10px] border-b border-border/40 overflow-hidden transition-all',
              hasCustomBackground
                ? bgProps.className
                : 'bg-muted/40'
            )}
            style={hasCustomBackground ? bgProps.style : undefined}
          >
            {hasCustomBackground && bgProps.isImage && (
              <div className="absolute inset-0 bg-background/60 dark:bg-background/70 pointer-events-none" />
            )}
            <div className="flex items-center gap-1.5 relative z-10">
              <Pencil className="size-3 text-primary" />
              <span className="text-[11px] font-semibold tracking-tight text-foreground">Edit Lane</span>
            </div>
            <div className="flex items-center gap-0.5 relative z-10">
              <BackgroundPicker
                value={background}
                onChange={setBackground}
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className={cn(
                      'size-5 rounded-md text-muted-foreground/80 hover:text-foreground hover:bg-background/60 shrink-0',
                      hasCustomBackground ? 'text-primary bg-background/50 font-bold' : ''
                    )}
                    title="Choose Lane Background Accent"
                  >
                    <Palette className="size-3" />
                  </Button>
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={handleCancel}
                className="size-5 text-muted-foreground/80 hover:text-foreground hover:bg-background/60 rounded-md shrink-0"
                title="Close (Esc)"
              >
                <X className="size-3" />
              </Button>
            </div>
          </div>

          {/* Side-by-side Emoji Picker & Title Input */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <InlineEmojiPicker
              value={icon}
              onChange={(emoji) => setIcon(emoji)}
              onClear={() => setIcon(null)}
              align="start"
              side="bottom"
              title="Choose icon"
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-7 shrink-0 text-sm p-0 rounded-md cursor-pointer bg-transparent hover:bg-muted/50 border-border/70 shadow-none transition-transform active:scale-95"
                  title="Choose icon"
                >
                  {icon || <Smile className="size-3.5 text-muted-foreground/60" />}
                </Button>
              }
            />

            <Input
              ref={inputRef}
              placeholder="Lane title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              className="h-7 text-xs font-medium bg-transparent rounded-md border border-border/70 flex-1 px-2.5 shadow-none focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:bg-transparent"
            />
          </div>

          {/* Description Textarea */}
          <Textarea
            placeholder="Description (optional)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            className="min-h-[38px] max-h-[90px] text-xs text-muted-foreground bg-transparent rounded-md border border-border/70 resize-none py-1.5 px-2.5 leading-snug focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/40 shadow-none focus-visible:bg-transparent"
          />

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-border/40 gap-2">
            <span className="text-[9.5px] text-muted-foreground/70 flex items-center gap-1 select-none shrink-0">
              <kbd className="font-mono text-[8.5px] bg-muted px-1 py-0.5 rounded border border-border/50">↵ Enter</kbd>
              <span className="opacity-40">·</span>
              <kbd className="font-mono text-[8.5px] bg-muted px-1 py-0.5 rounded border border-border/50">Esc</kbd>
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="h-7 text-xs px-2.5 rounded-md text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="xs"
                disabled={!title.trim() || isSubmitting}
                className="h-7 text-xs px-3 font-medium rounded-md cursor-pointer shadow-2xs gap-1"
              >
                {isSubmitting ? <Loader2 className="size-3 animate-spin" /> : null}
                Save
              </Button>
            </div>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div
      onDoubleClick={() => !readOnly && onEditingChange(true)}
      className={cn(
        'group flex-1 min-w-0 select-none flex items-center gap-1.5',
        !readOnly && 'cursor-pointer'
      )}
      title={!readOnly ? 'Double-click to edit title' : undefined}
    >
      {!readOnly ? (
        <InlineEmojiPicker
          value={lane.icon}
          onChange={async (emoji) => {
            await updateLane(lane.id, { icon: emoji })
          }}
          onClear={async () => {
            await updateLane(lane.id, { icon: null })
          }}
          align="start"
          side="bottom"
          title="Click to change lane emoji"
          trigger={
            lane.icon ? (
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="flex size-7 items-center justify-center rounded-md hover:bg-muted/80 text-lg shrink-0 transition-transform active:scale-95 cursor-pointer"
                title="Click to change lane emoji"
              >
                {lane.icon}
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted/60 transition-colors shrink-0 cursor-pointer"
                title="Add lane emoji"
              >
                <Smile className="size-3.5" />
              </button>
            )
          }
        />
      ) : (
        lane.icon && <span className="text-lg shrink-0">{lane.icon}</span>
      )}
      <div className="min-w-0 flex-1">
        <h3
          className={cn(
            'truncate text-xs font-semibold tracking-tight text-foreground transition-colors',
            !readOnly && 'group-hover:text-primary'
          )}
        >
          {lane.title || 'Untitled Lane'}
        </h3>
        {lane.description ? (
          <p className="truncate text-[11px] text-muted-foreground font-normal">
            {lane.description}
          </p>
        ) : null}
      </div>
    </div>
  )
}
