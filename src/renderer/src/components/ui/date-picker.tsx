import * as React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DateTimePickerProps = {
  value?: string | null // ISO string or YYYY-MM-DD / YYYY-MM-DDTHH:mm
  onChange: (value: string | null) => void
  placeholder?: string
  className?: string
  includeTime?: boolean
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Pick a due date',
  className,
  includeTime = true
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Parse initial date
  const parsedDate = React.useMemo(() => {
    if (!value) return null
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  }, [value])

  const [currentMonth, setCurrentMonth] = React.useState(() => parsedDate || new Date())
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(parsedDate)
  const [timeStr, setTimeStr] = React.useState(() => {
    if (!parsedDate) return '17:00'
    const h = String(parsedDate.getHours()).padStart(2, '0')
    const m = String(parsedDate.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  })

  React.useEffect(() => {
    setSelectedDate(parsedDate)
    if (parsedDate) {
      setCurrentMonth(parsedDate)
      const h = String(parsedDate.getHours()).padStart(2, '0')
      const m = String(parsedDate.getMinutes()).padStart(2, '0')
      setTimeStr(`${h}:${m}`)
    }
  }, [parsedDate])

  // Month navigation
  const prevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }
  const nextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  // Days in month calculation
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

  const commitChange = (date: Date | null, time: string) => {
    if (!date) {
      onChange(null)
      return
    }
    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()
    let hours = 17
    let mins = 0
    if (includeTime && time) {
      const [h, m] = time.split(':').map(Number)
      if (!isNaN(h)) hours = h
      if (!isNaN(m)) mins = m
    }
    const finalDate = new Date(year, month, day, hours, mins)
    onChange(finalDate.toISOString())
  }

  // Handle date selection
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date)
    commitChange(date, timeStr)
  }

  const handleClear = () => {
    setSelectedDate(null)
    onChange(null)
    setOpen(false)
  }

  const handlePreset = (preset: 'today' | 'tomorrow' | 'nextWeek') => {
    const now = new Date()
    let target = new Date()
    if (preset === 'today') {
      target = now
    } else if (preset === 'tomorrow') {
      target.setDate(now.getDate() + 1)
    } else if (preset === 'nextWeek') {
      target.setDate(now.getDate() + 7)
    }
    setSelectedDate(target)
    setCurrentMonth(target)
    commitChange(target, timeStr)
  }

  const displayString = React.useMemo(() => {
    if (!selectedDate) return null
    const datePart = selectedDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: selectedDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
    if (!includeTime) return datePart
    const timePart = selectedDate.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    })
    return `${datePart}, ${timePart}`
  }, [selectedDate, includeTime])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              'h-8 w-full justify-start text-left font-normal gap-2 rounded-lg bg-background px-2.5 shadow-2xs cursor-pointer',
              !selectedDate && 'text-muted-foreground',
              className
            )}
          >
            <Calendar className="size-3.5 text-primary shrink-0" />
            <span className="truncate text-xs flex-1">
              {displayString || placeholder}
            </span>
            {selectedDate && (
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
                className="size-4 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground"
                title="Clear date"
              >
                <X className="size-3" />
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-[280px] p-3 shadow-xl rounded-2xl z-50">
        {/* Quick Presets */}
        <div className="flex items-center gap-1 pb-2 mb-2 border-b">
          <button
            type="button"
            onClick={() => handlePreset('today')}
            className="flex-1 py-1 text-[10px] font-semibold rounded-md border bg-muted/40 hover:bg-muted text-foreground transition-colors cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handlePreset('tomorrow')}
            className="flex-1 py-1 text-[10px] font-semibold rounded-md border bg-muted/40 hover:bg-muted text-foreground transition-colors cursor-pointer"
          >
            Tomorrow
          </button>
          <button
            type="button"
            onClick={() => handlePreset('nextWeek')}
            className="flex-1 py-1 text-[10px] font-semibold rounded-md border bg-muted/40 hover:bg-muted text-foreground transition-colors cursor-pointer"
          >
            Next Week
          </button>
        </div>

        {/* Month Header Navigation */}
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-xs font-bold text-foreground">
            {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </span>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon" className="size-6 rounded-md" onClick={prevMonth}>
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="size-6 rounded-md" onClick={nextMonth}>
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground mb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {daysInMonth.map((dayDate, idx) => {
            if (!dayDate) return <span key={`empty-${idx}`} />
            const isToday = dayDate.toDateString() === new Date().toDateString()
            const isSelected = selectedDate && dayDate.toDateString() === selectedDate.toDateString()

            return (
              <button
                key={dayDate.toISOString()}
                type="button"
                onClick={() => handleSelectDate(dayDate)}
                className={cn(
                  'size-7 rounded-lg text-xs font-medium flex items-center justify-center transition-all cursor-pointer',
                  isSelected
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : isToday
                      ? 'bg-primary/10 text-primary font-bold border border-primary/30'
                      : 'hover:bg-muted text-foreground'
                )}
              >
                {dayDate.getDate()}
              </button>
            )
          })}
        </div>

        {/* Optional Time Picker */}
        {includeTime && selectedDate && (
          <div className="flex items-center justify-between pt-2 mt-2 border-t text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-3.5 text-primary" />
              <span className="text-[11px] font-medium">Time:</span>
            </div>
            <Input
              type="time"
              value={timeStr}
              onChange={(e) => {
                setTimeStr(e.target.value)
                commitChange(selectedDate, e.target.value)
              }}
              className="h-6 w-24 text-[11px] px-1.5 py-0 bg-background"
            />
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 mt-2 border-t">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 text-[10px] px-2 text-muted-foreground hover:text-destructive"
          >
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setOpen(false)}
            className="h-6 text-[10px] px-2.5 font-medium"
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
