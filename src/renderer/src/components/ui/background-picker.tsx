import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Palette, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type BackgroundPreset = {
  label: string
  value: string
  colorClass: string
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { label: 'Default / None', value: '', colorClass: 'bg-muted/40 border-muted' },
  {
    label: 'Sunset Accent',
    value: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(244, 63, 94, 0.2))',
    colorClass: 'bg-gradient-to-br from-amber-500/60 to-rose-500/60'
  },
  {
    label: 'Ocean Accent',
    value: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.2))',
    colorClass: 'bg-gradient-to-br from-blue-500/60 to-cyan-500/60'
  },
  {
    label: 'Emerald Accent',
    value: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(20, 184, 166, 0.2))',
    colorClass: 'bg-gradient-to-br from-emerald-500/60 to-teal-500/60'
  },
  {
    label: 'Purple Accent',
    value: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))',
    colorClass: 'bg-gradient-to-br from-purple-500/60 to-pink-500/60'
  },
  {
    label: 'Midnight Accent',
    value: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7), rgba(30, 27, 75, 0.7))',
    colorClass: 'bg-gradient-to-br from-slate-900 to-indigo-950'
  },
  {
    label: 'Cosmic Glow',
    value: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    colorClass: 'bg-gradient-to-r from-purple-600 to-indigo-600'
  },
  {
    label: 'Sunset Glow',
    value: 'linear-gradient(135deg, #f59e0b, #e11d48)',
    colorClass: 'bg-gradient-to-r from-amber-500 to-rose-600'
  },
  {
    label: 'Northern Lights',
    value: 'linear-gradient(135deg, #10b981, #0f766e)',
    colorClass: 'bg-gradient-to-r from-emerald-500 to-teal-700'
  },
  {
    label: 'Slate Dark',
    value: 'rgba(15, 23, 42, 0.75)',
    colorClass: 'bg-slate-900 border-slate-700'
  },
  {
    label: 'Zinc Dark',
    value: 'rgba(24, 24, 27, 0.75)',
    colorClass: 'bg-zinc-900 border-zinc-700'
  }
]

export type BackgroundPickerContentProps = {
  value: string | null | undefined
  onChange: (value: string) => void
  onSelect?: () => void
  columns?: 2 | 3
  showTitle?: boolean
}

export function BackgroundPickerContent({
  value = '',
  onChange,
  onSelect,
  columns = 2,
  showTitle = true
}: BackgroundPickerContentProps) {
  const activeVal = value || ''

  return (
    <div
      className="space-y-3 p-1 select-none"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {showTitle && (
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>Background Color Accent</span>
          {activeVal ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
                onSelect?.()
              }}
              className="text-[10px] text-muted-foreground hover:text-foreground underline cursor-pointer"
            >
              Clear
            </button>
          ) : null}
        </div>
      )}

      {/* Preset grid */}
      <div
        className={cn(
          'grid gap-1.5',
          columns === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'
        )}
      >
        {BACKGROUND_PRESETS.map((preset) => {
          const isSelected = activeVal === preset.value
          return (
            <button
              key={preset.label}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange(preset.value)
                onSelect?.()
              }}
              className={cn(
                'flex items-center gap-2 rounded-md border p-1.5 text-left text-xs transition-all cursor-pointer hover:border-primary/50',
                isSelected
                  ? 'border-primary bg-primary/10 font-medium text-primary shadow-xs ring-1 ring-primary/30'
                  : 'border-input bg-background hover:bg-muted/40'
              )}
            >
              <span
                className={cn(
                  'size-3.5 shrink-0 rounded-full border shadow-xs flex items-center justify-center text-[9px]',
                  preset.colorClass
                )}
              >
                {isSelected && <Check className="size-2.5 text-white drop-shadow-xs" />}
              </span>
              <span className="truncate text-[11px]">{preset.label}</span>
            </button>
          )
        })}
      </div>

      {/* Custom hex color input */}
      <div className="flex items-center gap-1.5 pt-1.5 border-t">
        <label className="text-xs text-muted-foreground shrink-0 font-medium">Custom:</label>
        <div className="flex items-center gap-1.5 flex-1">
          <input
            type="color"
            value={activeVal.startsWith('#') ? activeVal : '#3b82f6'}
            onChange={(e) => {
              e.stopPropagation()
              onChange(e.target.value)
            }}
            onClick={(e) => e.stopPropagation()}
            className="size-6 rounded border border-input cursor-pointer bg-transparent p-0 shrink-0"
            title="Pick custom hex color"
          />
          <Input
            placeholder="Hex color (#3b82f6)..."
            value={activeVal.startsWith('#') ? activeVal : ''}
            onChange={(e) => {
              e.stopPropagation()
              onChange(e.target.value)
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className="text-[11px] font-mono h-7 flex-1"
          />
        </div>
      </div>
    </div>
  )
}

export type BackgroundPickerProps = {
  value: string | null | undefined
  onChange: (value: string) => void
  trigger?: React.ReactElement
  columns?: 2 | 3
}

export function BackgroundPicker({
  value = '',
  onChange,
  trigger,
  columns = 2
}: BackgroundPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          trigger ? (
            trigger
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 rounded-md text-muted-foreground hover:text-foreground"
              title="Change Background Color"
            >
              <Palette className="size-3.5" />
            </Button>
          )
        }
      />
      <PopoverContent align="start" className={cn('p-2 shadow-xl', columns === 3 ? 'w-[320px]' : 'w-[245px]')}>
        <BackgroundPickerContent
          value={value}
          onChange={onChange}
          onSelect={() => setOpen(false)}
          columns={columns}
        />
      </PopoverContent>
    </Popover>
  )
}
