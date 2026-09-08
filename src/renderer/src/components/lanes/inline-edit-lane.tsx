import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { InlineEmojiPicker } from '@/components/ui/emoji-picker'
import { Check, X, Smile } from 'lucide-react'
import { useLanesStore } from '@/stores/lanes'
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
  const inputRef = useRef<HTMLInputElement>(null)

  const updateLane = useLanesStore((s) => s.updateLane)

  useEffect(() => {
    setTitle(lane.title || '')
    setIcon(lane.icon || null)
    setDescription(lane.description || '')
  }, [lane])

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isEditing])

  const handleSave = async () => {
    if (readOnly) {
      onEditingChange(false)
      return
    }
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      // Revert if empty
      setTitle(lane.title || '')
      setIcon(lane.icon || null)
      onEditingChange(false)
      return
    }

    if (
      trimmedTitle !== lane.title ||
      icon !== lane.icon ||
      description.trim() !== (lane.description || '')
    ) {
      await updateLane(lane.id, {
        title: trimmedTitle,
        icon: icon || null,
        description: description.trim() || null
      })
    }
    onEditingChange(false)
  }

  const handleCancel = () => {
    setTitle(lane.title || '')
    setIcon(lane.icon || null)
    setDescription(lane.description || '')
    onEditingChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="flex-1 space-y-1.5 min-w-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          {/* Emoji Icon Picker */}
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
                className="size-8 shrink-0 text-lg p-0 rounded-md cursor-pointer"
                title="Choose icon"
              >
                {icon || '😀'}
              </Button>
            }
          />

          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-xs font-semibold px-2 py-0 bg-background flex-1 min-w-0"
            placeholder="Lane Title..."
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleSave}
            className="size-7 shrink-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md cursor-pointer"
            title="Save (Enter)"
          >
            <Check className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="size-7 shrink-0 text-muted-foreground hover:text-foreground rounded-md cursor-pointer"
            title="Cancel (Esc)"
          >
            <X className="size-3.5" />
          </Button>
        </div>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-6 text-[11px] px-2 py-0 text-muted-foreground bg-background"
          placeholder="Add description (optional)..."
        />
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
