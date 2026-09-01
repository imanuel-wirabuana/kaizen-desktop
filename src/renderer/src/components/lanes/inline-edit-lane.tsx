import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import { useLanesStore } from '@/stores/lanes'

type InlineEditLaneProps = {
  lane: Lane
  isEditing: boolean
  onEditingChange: (editing: boolean) => void
}

export function InlineEditLane({ lane, isEditing, onEditingChange }: InlineEditLaneProps) {
  const [title, setTitle] = useState(lane.title || '')
  const [description, setDescription] = useState(lane.description || '')
  const inputRef = useRef<HTMLInputElement>(null)

  const updateLane = useLanesStore((s) => s.updateLane)

  useEffect(() => {
    setTitle(lane.title || '')
    setDescription(lane.description || '')
  }, [lane])

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isEditing])

  const handleSave = async () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      // Revert if empty
      setTitle(lane.title || '')
      onEditingChange(false)
      return
    }

    if (trimmedTitle !== lane.title || description.trim() !== (lane.description || '')) {
      await updateLane(lane.id, {
        title: trimmedTitle,
        description: description.trim() || null
      })
    }
    onEditingChange(false)
  }

  const handleCancel = () => {
    setTitle(lane.title || '')
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
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-7 text-xs font-semibold px-2 py-0 bg-background flex-1 min-w-0"
            placeholder="Lane Title..."
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleSave}
            className="size-6 shrink-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md"
            title="Save (Enter)"
          >
            <Check className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="size-6 shrink-0 text-muted-foreground hover:text-foreground rounded-md"
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
      onDoubleClick={() => onEditingChange(true)}
      className="group flex-1 min-w-0 cursor-pointer select-none"
      title="Double-click to edit title"
    >
      <h3 className="truncate text-xs font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
        {lane.title || 'Untitled Lane'}
      </h3>
      {lane.description ? (
        <p className="truncate text-[11px] text-muted-foreground font-normal">
          {lane.description}
        </p>
      ) : null}
    </div>
  )
}
