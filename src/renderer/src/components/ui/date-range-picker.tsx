import * as React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, CalendarRange, Clock } from 'lucide-react'
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

function formatShortDateTime(d: Date, withTime: boolean): string {
  const dateStr = d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  })
  if (!withTime) return dateStr
  const timeStr = d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  return `${dateStr}, ${timeStr}`
}

function extractTimeStr(d: Date | null, fallback = '09:00'): string {
  if (!d) return fallback
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function hasSpecificTime(d: Date | null): boolean {
  if (!d) return false
  return d.getHours() !== 0 || d.getMinutes() !== 0
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

  // Time state
  const [includeTime, setIncludeTime] = React.useState(() => {
    return Boolean(
      (parsedStart && hasSpecificTime(parsedStart)) ||
      (parsedDue && hasSpecificTime(parsedDue))
    )
  })
  const [startTime, setStartTime] = React.useState(() => extractTimeStr(parsedStart, '09:00'))
  const [dueTime, setDueTime] = React.useState(() => extractTimeStr(parsedDue, '18:00'))

  React.useEffect(() => {
    setTempStart(parsedStart)
    setTempDue(parsedDue)
    if (parsedStart) {
      setCurrentMonth(parsedStart)
      setStartTime(extractTimeStr(parsedStart, '09:00'))
    }
    if (parsedDue) {
      if (!parsedStart) setCurrentMonth(parsedDue)
      setDueTime(extractTimeStr(parsedDue, '18:00'))
    }
    if ((parsedStart && hasSpecificTime(parsedStart)) || (parsedDue && hasSpecificTime(parsedDue))) {
      setIncludeTime(true)
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

  const buildIso = (date: Date | null, timeStr: string, isDueDefault = false) => {
    if (!date) return null
    const y = date.getFullYear()
    const m = date.getMonth()
    const d = date.getDate()
    if (includeTime && timeStr) {
      const [h, min] = timeStr.split(':').map(Number)
      return new Date(y, m, d, isNaN(h) ? 0 : h, isNaN(min) ? 0 : min, 0).toISOString()
    }
    return new Date(y, m, d, isDueDefault ? 23 : 0, isDueDefault ? 59 : 0, 0).toISOString()
  }

  const handleApply = () => {
    const startIso = tempStart ? buildIso(tempStart, startTime, false) : null
    const dueIso = tempDue
      ? buildIso(tempDue, dueTime, true)
      : tempStart
        ? buildIso(tempStart, dueTime, true)
        : null
    onChange({ startDate: startIso, dueDate: dueIso })
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
    const startIso = buildIso(today, startTime || '09:00', false)
    const dueIso = buildIso(today, dueTime || '18:00', true)
    onChange({ startDate: startIso, dueDate: dueIso })
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
    const startIso = buildIso(today, startTime || '09:00', false)
    const dueIso = buildIso(friday, dueTime || '18:00', true)
    onChange({ startDate: startIso, dueDate: dueIso })
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
    const startIso = buildIso(nextMonday, startTime || '09:00', false)
    const dueIso = buildIso(nextFriday, dueTime || '18:00', true)
    onChange({ startDate: startIso, dueDate: dueIso })
    setOpen(false)
  }

  // Label text
  const labelText = React.useMemo(() => {
    const withTime = Boolean(
      (parsedStart && hasSpecificTime(parsedStart)) ||
      (parsedDue && hasSpecificTime(parsedDue))
    )

    if (parsedStart && parsedDue) {
      if (isSameDay(parsedStart, parsedDue)) {
        if (withTime) {
          const sTime = parsedStart.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
          const dTime = parsedDue.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
          return `${formatShortDate(parsedStart)}, ${sTime} – ${dTime}`
        }
        return formatShortDate(parsedStart)
      }
      return `${formatShortDateTime(parsedStart, withTime)} – ${formatShortDateTime(parsedDue, withTime)}`
    }
    if (parsedStart) return `From ${formatShortDateTime(parsedStart, withTime)}`
    if (parsedDue) return `Due ${formatShortDateTime(parsedDue, withTime)}`
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
              'flex items-center justify-between text-left font-normal h-7 text-xs px-2.5 rounded-md border border-border/70 bg-transparent hover:bg-muted/40 hover:border-border/80 transition-colors group/picker cursor-pointer w-full',
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
                className="size-3.5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted ml-1 transition-colors"
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
        className="w-[240px] p-2 shadow-2xl rounded-xl border border-border/80 text-xs select-none"
      >
        {/* Quick Presets */}
        <div className="flex items-center gap-1 pb-1.5 mb-1 border-b border-border/50">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={setTodayPreset}
            className="h-5 text-[9.5px] px-1.5 rounded hover:bg-primary/10 hover:text-primary flex-1 cursor-pointer font-medium"
          >
            Today
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={setThisWeekPreset}
            className="h-5 text-[9.5px] px-1.5 rounded hover:bg-primary/10 hover:text-primary flex-1 cursor-pointer font-medium"
          >
            This Week
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={setNextWeekPreset}
            className="h-5 text-[9.5px] px-1.5 rounded hover:bg-primary/10 hover:text-primary flex-1 cursor-pointer font-medium"
          >
            Next Week
          </Button>
        </div>

        {/* Calendar Header Month Navigation */}
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="font-semibold text-foreground text-[11px]">
            {currentMonth.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
          </span>
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={prevMonth}
              className="size-5 rounded text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={nextMonth}
              className="size-5 rounded text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="size-3" />
            </Button>
          </div>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-0.5 text-center text-[9px] font-semibold text-muted-foreground/70 mb-0.5">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <div key={day} className="size-6 flex items-center justify-center">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-0.5 gap-x-0.5 text-center text-xs">
          {daysInMonth.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="size-6" />
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
                  'size-6 text-[10.5px] flex items-center justify-center transition-all cursor-pointer select-none font-medium',
                  // Default styling
                  'hover:bg-muted/80 rounded',
                  isToday && 'font-bold border border-primary/40 text-primary',
                  // In range styling
                  isInRange && 'bg-primary/15 text-primary rounded-none',
                  // Start point
                  isStart &&
                    cn(
                      'bg-primary text-primary-foreground font-bold hover:bg-primary shadow-2xs',
                      tempDue ? 'rounded-l rounded-r-none' : 'rounded'
                    ),
                  // End point
                  isDue &&
                    cn(
                      'bg-primary text-primary-foreground font-bold hover:bg-primary shadow-2xs',
                      tempStart ? 'rounded-r rounded-l-none' : 'rounded'
                    )
                )}
              >
                {day.getDate()}
              </button>
            )
          })}
        </div>

        {/* Compact Time Controls */}
        <div className="pt-1.5 mt-1 border-t border-border/50 space-y-1">
          <div className="flex items-center justify-between text-[10px] px-0.5">
            <label className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeTime}
                onChange={(e) => setIncludeTime(e.target.checked)}
                className="size-3 rounded border-border/70 accent-primary cursor-pointer"
              />
              <Clock className="size-3 text-primary shrink-0" />
              <span className="font-medium">Include time</span>
            </label>
            {includeTime && (
              <span className="text-[8.5px] text-muted-foreground/60">24h</span>
            )}
          </div>

          {includeTime && (
            <div className="flex items-center gap-1 text-[10px]">
              <div className="flex-1 flex items-center gap-1 bg-transparent border border-border/60 rounded px-1.5 py-0.5">
                <span className="text-[8.5px] text-muted-foreground shrink-0">Start:</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={!tempStart}
                  className="w-full bg-transparent text-foreground text-[10px] outline-none disabled:opacity-40"
                />
              </div>
              <span className="text-muted-foreground/60 text-[9px]">–</span>
              <div className="flex-1 flex items-center gap-1 bg-transparent border border-border/60 rounded px-1.5 py-0.5">
                <span className="text-[8.5px] text-muted-foreground shrink-0">Due:</span>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  disabled={!tempDue && !tempStart}
                  className="w-full bg-transparent text-foreground text-[10px] outline-none disabled:opacity-40"
                />
              </div>
            </div>
          )}
        </div>

        {/* Range Summary & Apply Footer */}
        <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-border/50">
          <div className="text-[9.5px] text-muted-foreground truncate max-w-[130px]">
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
              className="h-5.5 text-[10px] px-2 rounded text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
            <Button
              type="button"
              size="xs"
              onClick={handleApply}
              className="h-5.5 text-[10px] px-2.5 rounded font-semibold cursor-pointer shadow-2xs"
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
