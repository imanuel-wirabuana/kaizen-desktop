import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { InlineEmojiPicker } from '@/components/ui/emoji-picker'
import { BackgroundPicker } from '@/components/ui/background-picker'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { AssigneeCombobox } from './assignee-combobox'
import { Loader2, Palette, Sparkles, Pencil, X, Smile, Check } from 'lucide-react'
import { PRIORITY_CONFIG } from './task-card'
import { getBoardBackgroundStyleAndClass } from '@/lib/board-utils'
import { cn } from '@/lib/utils'

export type TaskFormValues = {
  title: string
  icon: string | null
  description: string
  priority: number
  startDate: string | null
  dueDate: string | null
  status: boolean
  assignee: string | null
  background: string
}

export type TaskFormProps = {
  initialValues?: Partial<TaskFormValues> & {
    start_date?: string | null
    due_date?: string | null
  }
  boardId?: number | string | null
  onSubmit: (values: TaskFormValues) => Promise<void> | void
  onCancel: () => void
  submitLabel?: string
  cancelLabel?: string
  isSubmitting?: boolean
  autoFocus?: boolean
  className?: string
  embedded?: boolean
  formTitle?: string
  onBackgroundChange?: (background: string) => void
}

export function TaskForm({
  initialValues,
  boardId,
  onSubmit,
  onCancel,
  submitLabel,
  cancelLabel,
  isSubmitting = false,
  autoFocus = true,
  className,
  embedded = false,
  formTitle,
  onBackgroundChange
}: TaskFormProps) {
  const [title, setTitle] = useState(initialValues?.title || '')
  const [icon, setIcon] = useState<string | null>(initialValues?.icon || null)
  const [description, setDescription] = useState(initialValues?.description || '')
  const [priority, setPriority] = useState<number>(initialValues?.priority ?? 0)
  const [startDate, setStartDate] = useState<string | null>(
    initialValues?.startDate ?? initialValues?.start_date ?? null
  )
  const [dueDate, setDueDate] = useState<string | null>(
    initialValues?.dueDate ?? initialValues?.due_date ?? null
  )
  const [status, setStatus] = useState<boolean>(Boolean(initialValues?.status))
  const [assignee, setAssignee] = useState<string | null>(initialValues?.assignee || null)
  const [background, setBackground] = useState<string>(initialValues?.background || '')

  const isEditMode = Boolean(initialValues?.title)
  const displayTitle = formTitle || (isEditMode ? 'Edit Task' : 'New Task')

  const handleBackgroundSelect = (newBg: string) => {
    setBackground(newBg)
    onBackgroundChange?.(newBg)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!title.trim() || isSubmitting) return

    await onSubmit({
      title: title.trim(),
      icon: icon || null,
      description: description.trim(),
      priority,
      startDate,
      dueDate,
      status,
      assignee,
      background
    })
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
      onCancel()
    }
  }

  const bgProps = getBoardBackgroundStyleAndClass(background)
  const hasCustomBackground = Boolean(background && background.trim())

  return (
    <div
      className={cn(
        embedded
          ? 'space-y-2.5 transition-all'
          : cn(
              'rounded-xl border border-primary/40 p-3 shadow-md space-y-2.5 ring-1 ring-primary/20 transition-all overflow-hidden relative',
              hasCustomBackground
                ? bgProps.className
                : 'bg-neutral-950/10 dark:bg-black/70 backdrop-blur-md'
            ),
        className
      )}
      style={!embedded && hasCustomBackground ? bgProps.style : undefined}
    >
      {!embedded && hasCustomBackground && bgProps.isImage && (
        <div className="absolute inset-0 bg-background/70 dark:bg-background/80 pointer-events-none" />
      )}
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-2.5 relative z-10">
        {/* Form Header */}
        <div className="flex items-center justify-between select-none">
          <div className="flex items-center gap-1.5">
            {isEditMode ? (
              <Pencil className="size-3.5 text-primary" />
            ) : (
              <Sparkles className="size-3.5 text-primary" />
            )}
            <span className="text-xs font-semibold tracking-tight text-foreground">
              {displayTitle}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <BackgroundPicker
              value={background}
              onChange={handleBackgroundSelect}
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'size-6 rounded-md text-muted-foreground hover:text-foreground',
                    hasCustomBackground ? 'text-primary bg-primary/10' : ''
                  )}
                  title="Choose Task Background Accent"
                >
                  <Palette className="size-3.5" />
                </Button>
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="size-6 text-muted-foreground hover:text-foreground rounded-md"
              title="Close (Esc)"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Emoji Icon & Title */}
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
            placeholder="Task title (e.g. Draft new wireframe)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            autoFocus={autoFocus}
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

        {/* Priority Selector Pills */}
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center gap-1">
            {([0, 1, 2, 3] as const).map((p) => {
              const pCfg = PRIORITY_CONFIG[p]
              const isSelected = priority === p
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    'flex-1 py-1 rounded-md text-[9.5px] font-medium border transition-all cursor-pointer text-center select-none',
                    isSelected
                      ? 'ring-2 ring-primary border-primary font-bold shadow-2xs opacity-100'
                      : 'opacity-80 hover:opacity-100 bg-background',
                    pCfg.badge
                  )}
                >
                  {pCfg.label}
                </button>
              )
            })}
          </div>

          {/* Date Range Picker & Assignee Combobox Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
            <DateRangePicker
              startDate={startDate}
              dueDate={dueDate}
              onChange={(range) => {
                setStartDate(range.startDate)
                setDueDate(range.dueDate)
              }}
              placeholder="Start & due date..."
              className="h-7 text-[11px] w-full"
            />
            <AssigneeCombobox
              value={assignee}
              onChange={setAssignee}
              boardId={boardId}
              placeholder="Assignee (optional)..."
              className="h-7 text-[11px] w-full"
            />
          </div>

          {/* Completion Status Toggle */}
          <div className="flex items-center justify-between pt-0.5 px-0.5">
            <label
              className="inline-flex items-center gap-1.5 cursor-pointer select-none py-0.5"
              onClick={() => setStatus(!status)}
            >
              <span
                className={cn(
                  'size-4 rounded-full border flex items-center justify-center transition-colors shrink-0',
                  status
                    ? 'bg-primary border-primary text-primary-foreground shadow-2xs'
                    : 'border-muted-foreground/40 hover:border-primary bg-background'
                )}
              >
                {status && <Check className="size-2.5 stroke-[3]" />}
              </span>
              <span
                className={cn(
                  'text-[11px]',
                  status ? 'text-foreground font-semibold' : 'text-muted-foreground'
                )}
              >
                {status ? 'Marked as completed' : 'Mark as completed'}
              </span>
            </label>
          </div>
        </div>

        {/* Footer Action Controls */}
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
              onClick={onCancel}
              disabled={isSubmitting}
              className="h-7 text-xs px-2.5 rounded-lg text-muted-foreground hover:text-foreground"
            >
              {cancelLabel || 'Cancel'}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!title.trim() || isSubmitting}
              className="h-7 text-xs px-3 font-medium rounded-lg cursor-pointer shadow-2xs gap-1"
            >
              {isSubmitting ? <Loader2 className="size-3 animate-spin" /> : null}
              {submitLabel || (isEditMode ? 'Save' : 'Add Task')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
