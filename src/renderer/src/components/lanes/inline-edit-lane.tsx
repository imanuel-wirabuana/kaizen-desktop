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
        className={cn(
          'w-full rounded-xl border border-primary/40 p-3 shadow-md space-y-2.5 ring-1 ring-primary/20 transition-all overflow-hidden relative',
          hasCustomBackground
            ? bgProps.className
            : 'bg-neutral-950/10 dark:bg-black/70 backdrop-blur-md'
        )}
        style={hasCustomBackground ? bgProps.style : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {hasCustomBackground && bgProps.isImage && (
          <div className="absolute inset-0 bg-background/70 dark:bg-background/80 pointer-events-none" />
        )}
        <form onSubmit={handleSave} onKeyDown={handleKeyDown} className="space-y-2.5 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between select-none">
            <div className="flex items-center gap-1.5">
              <Pencil className="size-3.5 text-primary" />
              <span className="text-xs font-semibold tracking-tight text-foreground">Edit Lane</span>
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
                onClick={handleCancel}
                className="size-6 text-muted-foreground hover:text-foreground rounded-md"
                title="Close (Esc)"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Side-by-side Emoji Picker & Title Input */}
          <div className="flex items-center gap-1.5">
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
                  className="size-8 shrink-0 text-base p-0 rounded-lg cursor-pointer bg-background hover:bg-muted border-border/80 shadow-2xs transition-transform active:scale-95"
                  title="Choose icon"
                >
                  {icon || <Smile className="size-4 text-muted-foreground/60" />}
                </Button>
              }
            />

            <Input
              ref={inputRef}
              placeholder="Lane title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
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

          {/* Footer */}
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
                onClick={handleCancel}
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
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted/60 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
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
