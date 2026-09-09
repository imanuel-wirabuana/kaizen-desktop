import * as React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, CalendarRange } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DateRangePickerProps = {
  startDate?: string | null
  dueDate?: string | null
  onChange: (range: { startDate: string | null; dueDate: string | null }) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

function parseDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

function isSameDay(d1?: Date | null, d2?: Date | null): boolean {
  if (!d1 || !d2) return false
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

function isDateBetween(d: Date, start: Date, end: Date): boolean {
  const time = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()
  const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime()
  return time > startTime && time < endTime
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  })
}

export function DateRangePicker({
  startDate,
  dueDate,
  onChange,
  placeholder = 'Start & due date...',
  className,
  disabled = false
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  const parsedStart = React.useMemo(() => parseDate(startDate), [startDate])
  const parsedDue = React.useMemo(() => parseDate(dueDate), [dueDate])

  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => parsedStart || parsedDue || new Date())
  const [hoverDate, setHoverDate] = React.useState<Date | null>(null)

  // Local selection state inside the picker
  const [tempStart, setTempStart] = React.useState<Date | null>(parsedStart)
  const [tempDue, setTempDue] = React.useState<Date | null>(parsedDue)

  React.useEffect(() => {
    setTempStart(parsedStart)
    setTempDue(parsedDue)
    if (parsedStart) {
      setCurrentMonth(parsedStart)
    } else if (parsedDue) {
      setCurrentMonth(parsedDue)
    }
  }, [parsedStart, parsedDue, open])

  // Navigation
  const prevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }
  const nextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  // Days calculation
  const daysInMonth = React.useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDayIndex = new Date(year, month, 1).getDay()
    const totalDays = new Date(year, month + 1, 0).getDate()

    const days: (Date | null)[] = []
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null)
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d))
    }
    return days
  }, [currentMonth])

  const handleDayClick = (date: Date) => {
    if (!tempStart || (tempStart && tempDue)) {
      // Start a new range
      setTempStart(date)
      setTempDue(null)
    } else {
      // Already have start, picking end
      if (date < tempStart) {
        setTempStart(date)
        setTempDue(null)
      } else {
        setTempDue(date)
      }
    }
  }

  const handleApply = () => {
    onChange({
      startDate: tempStart ? new Date(tempStart.getFullYear(), tempStart.getMonth(), tempStart.getDate(), 9, 0).toISOString() : null,
      dueDate: tempDue
        ? new Date(tempDue.getFullYear(), tempDue.getMonth(), tempDue.getDate(), 18, 0).toISOString()
        : tempStart
          ? new Date(tempStart.getFullYear(), tempStart.getMonth(), tempStart.getDate(), 18, 0).toISOString()
          : null
    })
    setOpen(false)
  }

  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setTempStart(null)
    setTempDue(null)
    onChange({ startDate: null, dueDate: null })
  }

  // Presets
  const setTodayPreset = () => {
    const today = new Date()
    setTempStart(today)
    setTempDue(today)
    onChange({
      startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0).toISOString(),
      dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18, 0).toISOString()
    })
    setOpen(false)
  }

  const setThisWeekPreset = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const distanceToFriday = 5 - dayOfWeek >= 0 ? 5 - dayOfWeek : 5 - dayOfWeek + 7
    const friday = new Date(today)
    friday.setDate(today.getDate() + distanceToFriday)

    setTempStart(today)
    setTempDue(friday)
    onChange({
      startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0).toISOString(),
      dueDate: new Date(friday.getFullYear(), friday.getMonth(), friday.getDate(), 18, 0).toISOString()
    })
    setOpen(false)
  }

  const setNextWeekPreset = () => {
    const today = new Date()
    const nextMonday = new Date(today)
    nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7))
    const nextFriday = new Date(nextMonday)
    nextFriday.setDate(nextMonday.getDate() + 4)

    setTempStart(nextMonday)
    setTempDue(nextFriday)
    onChange({
      startDate: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 9, 0).toISOString(),
      dueDate: new Date(nextFriday.getFullYear(), nextFriday.getMonth(), nextFriday.getDate(), 18, 0).toISOString()
    })
    setOpen(false)
  }

  // Label text
  const labelText = React.useMemo(() => {
    if (parsedStart && parsedDue) {
      if (isSameDay(parsedStart, parsedDue)) {
        return formatShortDate(parsedStart)
      }
      return `${formatShortDate(parsedStart)} – ${formatShortDate(parsedDue)}`
    }
    if (parsedStart) return `From ${formatShortDate(parsedStart)}`
    if (parsedDue) return `Due ${formatShortDate(parsedDue)}`
    return placeholder
  }, [parsedStart, parsedDue, placeholder])

  const hasValue = Boolean(parsedStart || parsedDue)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              'flex items-center justify-between text-left font-normal h-8 text-xs px-2.5 rounded-lg border-border/80 bg-background hover:bg-muted/60 transition-colors shadow-2xs group/picker cursor-pointer',
              !hasValue && 'text-muted-foreground',
              hasValue && 'text-foreground font-medium border-primary/40',
              className
            )}
          >
            <div className="flex items-center gap-1.5 truncate">
              {parsedStart && parsedDue ? (
                <CalendarRange className="size-3.5 text-primary shrink-0" />
              ) : (
                <CalendarIcon className="size-3.5 text-muted-foreground shrink-0" />
              )}
              <span className="truncate">{labelText}</span>
            </div>
            {hasValue && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="size-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted ml-1 transition-colors"
                title="Clear dates"
              >
                <X className="size-2.5" />
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent
        align="start"
        side="bottom"
        className="w-[280px] p-2.5 shadow-2xl rounded-xl border border-border/80 text-xs select-none"
      >
        {/* Quick Presets */}
        <div className="flex items-center gap-1 pb-2 border-b border-border/60">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={setTodayPreset}
            className="h-6 text-[10.5px] px-2 rounded-md hover:bg-primary/10 hover:text-primary flex-1 cursor-pointer"
          >
            Today
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={setThisWeekPreset}
            className="h-6 text-[10.5px] px-2 rounded-md hover:bg-primary/10 hover:text-primary flex-1 cursor-pointer"
          >
            This Week
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={setNextWeekPreset}
            className="h-6 text-[10.5px] px-2 rounded-md hover:bg-primary/10 hover:text-primary flex-1 cursor-pointer"
          >
            Next Week
          </Button>
        </div>

        {/* Calendar Header Month Navigation */}
        <div className="flex items-center justify-between pt-2 pb-1 px-1">
          <span className="font-semibold text-foreground text-xs">
            {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </span>
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={prevMonth}
              className="size-6 rounded-md text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={nextMonth}
              className="size-6 rounded-md text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground/70 py-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <div key={day} className="size-7 flex items-center justify-center">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
          {daysInMonth.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="size-7" />
            }

            const isStart = isSameDay(day, tempStart)
            const isDue = isSameDay(day, tempDue)
            const isToday = isSameDay(day, new Date())

            // Check if within range or hover preview
            const effectiveEnd = tempDue || hoverDate
            const isInRange =
              tempStart &&
              effectiveEnd &&
              effectiveEnd > tempStart &&
              isDateBetween(day, tempStart, effectiveEnd)

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => {
                  if (tempStart && !tempDue) {
                    setHoverDate(day)
                  }
                }}
                className={cn(
                  'size-7 text-xs flex items-center justify-center transition-all cursor-pointer select-none font-medium',
                  // Default styling
                  'hover:bg-muted/80 rounded-md',
                  isToday && 'font-bold border border-primary/40 text-primary',
                  // In range styling
                  isInRange && 'bg-primary/15 text-primary rounded-none',
                  // Start point
                  isStart &&
                    cn(
                      'bg-primary text-primary-foreground font-bold hover:bg-primary shadow-2xs',
                      tempDue ? 'rounded-l-md rounded-r-none' : 'rounded-md'
                    ),
                  // End point
                  isDue &&
                    cn(
                      'bg-primary text-primary-foreground font-bold hover:bg-primary shadow-2xs',
                      tempStart ? 'rounded-r-md rounded-l-none' : 'rounded-md'
                    )
                )}
              >
                {day.getDate()}
              </button>
            )
          })}
        </div>

        {/* Range Summary & Apply Footer */}
        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-border/60">
          <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">
            {tempStart && tempDue ? (
              <span>
                {formatShortDate(tempStart)} – {formatShortDate(tempDue)}
              </span>
            ) : tempStart ? (
              <span>From {formatShortDate(tempStart)}</span>
            ) : (
              <span>No dates chosen</span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => {
                handleClear()
                setOpen(false)
              }}
              className="h-6 text-[10.5px] px-2 rounded-md text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
            <Button
              type="button"
              size="xs"
              onClick={handleApply}
              className="h-6 text-[10.5px] px-2.5 rounded-md font-semibold cursor-pointer shadow-2xs"
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
