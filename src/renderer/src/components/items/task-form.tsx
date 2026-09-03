import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { EmojiPicker, EmojiPickerSearch, EmojiPickerContent } from '@/components/ui/emoji-picker'
import { BackgroundPicker } from '@/components/ui/background-picker'
import { DateTimePicker } from '@/components/ui/date-picker'
import { Loader2, Palette } from 'lucide-react'
import { PRIORITY_CONFIG } from './task-card'
import { getBoardBackgroundStyleAndClass } from '@/lib/board-utils'
import { cn } from '@/lib/utils'

export type TaskFormValues = {
  title: string
  icon: string | null
  description: string
  priority: number
  dueDate: string
  background: string
}

export type TaskFormProps = {
  initialValues?: Partial<TaskFormValues>
  onSubmit: (values: TaskFormValues) => Promise<void> | void
  onCancel: () => void
  submitLabel?: string
  cancelLabel?: string
  isSubmitting?: boolean
  autoFocus?: boolean
  className?: string
}

export function TaskForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel,
  cancelLabel,
  isSubmitting = false,
  autoFocus = true,
  className
}: TaskFormProps) {
  const [title, setTitle] = useState(initialValues?.title || '')
  const [icon, setIcon] = useState<string | null>(initialValues?.icon || null)
  const [description, setDescription] = useState(initialValues?.description || '')
  const [priority, setPriority] = useState<number>(initialValues?.priority ?? 0)
  const [dueDate, setDueDate] = useState<string>(initialValues?.dueDate || '')
  const [background, setBackground] = useState<string>(initialValues?.background || '')
  const [popoverOpen, setPopoverOpen] = useState(false)

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!title.trim() || isSubmitting) return

    await onSubmit({
      title: title.trim(),
      icon: icon || null,
      description: description.trim(),
      priority,
      dueDate,
      background
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isTextArea = (e.target as HTMLElement)?.tagName === 'TEXTAREA'
    if (e.key === 'Enter') {
      if (isTextArea && !e.ctrlKey && !e.metaKey) {
        return
      }
      if (!e.shiftKey || (isTextArea && (e.ctrlKey || e.metaKey))) {
        e.preventDefault()
        handleSubmit()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  const bgProps = getBoardBackgroundStyleAndClass(background)
  const hasCustomBackground = Boolean(background && background.trim())

  return (
    <div
      className={cn(
        'rounded-xl border border-primary/40 bg-background p-2.5 shadow-md space-y-2 ring-1 ring-primary/20 transition-all overflow-hidden',
        hasCustomBackground ? bgProps.className : '',
        className
      )}
      style={hasCustomBackground ? bgProps.style : undefined}
    >
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-2">
        {/* Emoji Icon & Title */}
        <div className="flex items-center gap-1.5">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-7 shrink-0 text-base p-0 rounded-md"
                  title="Choose Icon (optional)"
                >
                  {icon || '😀'}
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
            placeholder="Task title (e.g. Draft new wireframe)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            autoFocus={autoFocus}
            className="h-7 text-xs font-medium bg-background flex-1"
          />
        </div>

        {/* Description */}
        <Textarea
          placeholder="Description (optional)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          className="min-h-[52px] text-xs text-muted-foreground bg-background resize-none py-1.5 px-2"
        />

        {/* Options Row (Priority, Due Date, Background Accent) */}
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center gap-1">
            {([0, 1, 2, 3] as const).map((p) => {
              const pCfg = PRIORITY_CONFIG[p]
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    'flex-1 py-0.5 rounded-md text-[9px] font-medium border transition-all cursor-pointer text-center',
                    priority === p ? 'ring-2 ring-primary border-primary font-bold' : 'opacity-60 hover:opacity-100',
                    pCfg.badge
                  )}
                >
                  {pCfg.label}
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between gap-1.5">
            <div className="flex-1 min-w-0">
              <DateTimePicker
                value={dueDate}
                onChange={(val) => setDueDate(val || '')}
                placeholder="Due date & time..."
                className="h-7 text-[11px]"
              />
            </div>

            <BackgroundPicker
              value={background}
              onChange={setBackground}
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'size-5 rounded-md text-muted-foreground hover:text-foreground',
                    hasCustomBackground ? 'text-primary bg-primary/10' : ''
                  )}
                  title="Choose Task Background Accent"
                >
                  <Palette className="size-3" />
                </Button>
              }
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <span className="text-[9px] text-muted-foreground/70">
            Press <kbd className="font-mono text-[9px] bg-muted px-1 py-0.5 rounded border">Enter</kbd>
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
              className="h-6 text-xs px-2"
            >
              {cancelLabel || 'Cancel'}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!title.trim() || isSubmitting}
              className="h-6 text-xs px-2.5 font-medium cursor-pointer shadow-2xs"
            >
              {isSubmitting ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
              {submitLabel || (initialValues ? 'Save' : 'Add')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
