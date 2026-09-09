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
          ? 'space-y-1.5 transition-all'
          : 'rounded-xl border border-primary/40 bg-card p-2.5 shadow-md space-y-1.5 ring-1 ring-primary/20 transition-all overflow-hidden relative',
        className
      )}
    >
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-1.5 relative z-10">
        {/* Form Header (Previews background only on this header banner) */}
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
            {isEditMode ? (
              <Pencil className="size-3 text-primary" />
            ) : (
              <Sparkles className="size-3 text-primary" />
            )}
            <span className="text-[11px] font-semibold tracking-tight text-foreground">
              {displayTitle}
            </span>
          </div>
          <div className="flex items-center gap-0.5 relative z-10">
            <BackgroundPicker
              value={background}
              onChange={handleBackgroundSelect}
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className={cn(
                    'size-5 rounded-md text-muted-foreground/80 hover:text-foreground hover:bg-background/60 shrink-0',
                    hasCustomBackground ? 'text-primary bg-background/50 font-bold' : ''
                  )}
                  title="Choose Task Background Accent"
                >
                  <Palette className="size-3" />
                </Button>
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onCancel}
              className="size-5 text-muted-foreground/80 hover:text-foreground hover:bg-background/60 rounded-md shrink-0"
              title="Close (Esc)"
            >
              <X className="size-3" />
            </Button>
          </div>
        </div>

        {/* Emoji Icon & Title */}
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
            placeholder="Task title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            autoFocus={autoFocus}
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

        {/* Priority Selector Pills */}
        <div className="space-y-1">
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
                    'flex-1 h-7 rounded-md text-xs font-medium border transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none',
                    pCfg.badge,
                    isSelected
                      ? cn(
                          'font-bold shadow-xs ring-2 opacity-100',
                          p === 0 && 'bg-muted text-foreground border-foreground/40 ring-muted-foreground/30',
                          p === 1 && 'bg-amber-500/30 text-amber-700 dark:text-amber-300 border-amber-500 ring-amber-500/50',
                          p === 2 && 'bg-orange-500/30 text-orange-700 dark:text-orange-300 border-orange-500 ring-orange-500/50',
                          p === 3 && 'bg-rose-500/30 text-rose-700 dark:text-rose-300 border-rose-500 ring-rose-500/50'
                        )
                      : 'opacity-60 hover:opacity-90'
                  )}
                >
                  <span className={cn('size-1.5 rounded-full shrink-0', pCfg.dot)} />
                  <span>{pCfg.label}</span>
                </button>
              )
            })}
          </div>

          {/* Date Range Picker & Assignee Combobox Stacked */}
          <div className="space-y-1 pt-0.5">
            <DateRangePicker
              startDate={startDate}
              dueDate={dueDate}
              onChange={(range) => {
                setStartDate(range.startDate)
                setDueDate(range.dueDate)
              }}
              placeholder="Start & due date..."
              className="h-7 text-xs px-2.5 w-full bg-transparent"
            />
            <AssigneeCombobox
              value={assignee}
              onChange={setAssignee}
              boardId={boardId}
              placeholder="Assignee (optional)..."
              className="h-7 text-xs px-2.5 w-full bg-transparent"
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
                  'size-3.5 rounded-md border flex items-center justify-center transition-colors shrink-0',
                  status
                    ? 'bg-primary border-primary text-primary-foreground shadow-2xs'
                    : 'border-muted-foreground/40 hover:border-primary bg-transparent'
                )}
              >
                {status && <Check className="size-2 stroke-[3]" />}
              </span>
              <span
                className={cn(
                  'text-xs',
                  status ? 'text-foreground font-semibold' : 'text-muted-foreground'
                )}
              >
                {status ? 'Marked as completed' : 'Mark as completed'}
              </span>
            </label>
          </div>
        </div>

        {/* Footer Action Controls */}
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
              onClick={onCancel}
              disabled={isSubmitting}
              className="h-7 text-xs px-2.5 rounded-md text-muted-foreground hover:text-foreground"
            >
              {cancelLabel || 'Cancel'}
            </Button>
            <Button
              type="submit"
              size="xs"
              disabled={!title.trim() || isSubmitting}
              className="h-7 text-xs px-3 font-medium rounded-md cursor-pointer shadow-2xs gap-1"
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
