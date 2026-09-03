import { useState, useEffect } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Palette, Check, Image as ImageIcon, Sliders, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type BackgroundPreset = {
  label: string
  value: string
  colorClass?: string
  style?: React.CSSProperties
}

export const FLAT_COLOR_PRESETS: BackgroundPreset[] = [
  { label: 'Slate', value: '#0f172a', colorClass: 'bg-slate-900 border-slate-700' },
  { label: 'Zinc', value: '#18181b', colorClass: 'bg-zinc-900 border-zinc-700' },
  { label: 'Neutral', value: '#171717', colorClass: 'bg-neutral-900 border-neutral-700' },
  { label: 'Red', value: '#ef4444', colorClass: 'bg-red-500 border-red-600' },
  { label: 'Orange', value: '#f97316', colorClass: 'bg-orange-500 border-orange-600' },
  { label: 'Amber', value: '#f59e0b', colorClass: 'bg-amber-500 border-amber-600' },
  { label: 'Green', value: '#22c55e', colorClass: 'bg-green-500 border-green-600' },
  { label: 'Emerald', value: '#10b981', colorClass: 'bg-emerald-500 border-emerald-600' },
  { label: 'Teal', value: '#14b8a6', colorClass: 'bg-teal-500 border-teal-600' },
  { label: 'Cyan', value: '#06b6d4', colorClass: 'bg-cyan-500 border-cyan-600' },
  { label: 'Blue', value: '#3b82f6', colorClass: 'bg-blue-500 border-blue-600' },
  { label: 'Indigo', value: '#6366f1', colorClass: 'bg-indigo-500 border-indigo-600' },
  { label: 'Violet', value: '#8b5cf6', colorClass: 'bg-violet-500 border-violet-600' },
  { label: 'Purple', value: '#a855f7', colorClass: 'bg-purple-500 border-purple-600' },
  { label: 'Fuchsia', value: '#d946ef', colorClass: 'bg-fuchsia-500 border-fuchsia-600' },
  { label: 'Rose', value: '#f43f5e', colorClass: 'bg-rose-500 border-rose-600' }
]

export const GRADIENT_PRESETS: BackgroundPreset[] = [
  {
    label: 'Sunset Accent',
    value: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(244, 63, 94, 0.25))',
    colorClass: 'bg-gradient-to-br from-amber-500/60 to-rose-500/60'
  },
  {
    label: 'Ocean Accent',
    value: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(6, 182, 212, 0.25))',
    colorClass: 'bg-gradient-to-br from-blue-500/60 to-cyan-500/60'
  },
  {
    label: 'Emerald Accent',
    value: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(20, 184, 166, 0.25))',
    colorClass: 'bg-gradient-to-br from-emerald-500/60 to-teal-500/60'
  },
  {
    label: 'Purple Accent',
    value: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(236, 72, 153, 0.25))',
    colorClass: 'bg-gradient-to-br from-purple-500/60 to-pink-500/60'
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
    label: 'Midnight Dark',
    value: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
    colorClass: 'bg-gradient-to-br from-slate-900 to-indigo-950'
  },
  {
    label: 'Aurora Blue',
    value: 'linear-gradient(135deg, #00c6ff, #0072ff)',
    colorClass: 'bg-gradient-to-r from-cyan-400 to-blue-600'
  },
  {
    label: 'Cyber Neon',
    value: 'linear-gradient(135deg, #f355da, #4e00c2)',
    colorClass: 'bg-gradient-to-r from-fuchsia-500 to-purple-800'
  },
  {
    label: 'Peach Flame',
    value: 'linear-gradient(135deg, #ff8a00, #e52e71)',
    colorClass: 'bg-gradient-to-r from-orange-500 to-pink-600'
  },
  {
    label: 'Slate Dark',
    value: 'linear-gradient(135deg, #1e293b, #0f172a)',
    colorClass: 'bg-gradient-to-br from-slate-800 to-slate-950'
  }
]

// Backwards compatibility export
export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { label: 'Default / None', value: '', colorClass: 'bg-muted/40 border-muted' },
  ...GRADIENT_PRESETS
]

export const SAMPLE_IMAGE_PRESETS = [
  {
    label: 'Abstract Mesh',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2560&q=90'
  },
  {
    label: 'Dark Aurora',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=2560&q=90'
  },
  {
    label: 'Neon Mesh',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=2560&q=90'
  },
  {
    label: 'Cosmic Sky',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2560&q=90'
  }
]

export type BackgroundPickerContentProps = {
  value: string | null | undefined
  onChange: (value: string) => void
  onSelect?: () => void
  columns?: 2 | 3
  showTitle?: boolean
}

type TabType = 'presets' | 'gradient' | 'image' | 'solid'

export function BackgroundPickerContent({
  value = '',
  onChange,
  onSelect,
  showTitle = true
}: BackgroundPickerContentProps) {
  const activeVal = value || ''

  // Determine initial active tab based on activeVal
  const getInitialTab = (): TabType => {
    if (!activeVal) return 'presets'
    if (
      /^(https?:\/\/|data:image\/|blob:|\/|\.\/|\.\.\/)/i.test(activeVal) ||
      /\.(png|jpg|jpeg|webp|svg|gif|avif)/i.test(activeVal)
    ) {
      return 'image'
    }
    if (/gradient/i.test(activeVal)) {
      return 'gradient'
    }
    if (activeVal.startsWith('#') || activeVal.startsWith('rgb') || activeVal.startsWith('hsl')) {
      return 'solid'
    }
    return 'presets'
  }

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab)

  // Custom Gradient State
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear')
  const [color1, setColor1] = useState('#3b82f6')
  const [color2, setColor2] = useState('#8b5cf6')
  const [angle, setAngle] = useState(135)

  // Image URL state
  const [imageUrl, setImageUrl] = useState(
    /^(https?:\/\/|data:image\/|blob:|\/|\.\/|\.\.\/)/i.test(activeVal) ? activeVal : ''
  )

  // Custom Solid State
  const [solidColor, setSolidColor] = useState(
    activeVal.startsWith('#') ? activeVal : '#3b82f6'
  )

  useEffect(() => {
    if (activeTab === 'image' && imageUrl.trim()) {
      setImageUrl(activeVal)
    }
  }, [activeVal])

  const computedCustomGradient =
    gradientType === 'linear'
      ? `linear-gradient(${angle}deg, ${color1}, ${color2})`
      : `radial-gradient(circle, ${color1}, ${color2})`

  const applyCustomGradient = () => {
    onChange(computedCustomGradient)
    onSelect?.()
  }

  const applyImageUrl = (urlToApply?: string) => {
    const target = urlToApply !== undefined ? urlToApply : imageUrl
    if (target.trim()) {
      onChange(target.trim())
      onSelect?.()
    }
  }

  const applySolidColor = (hexToApply?: string) => {
    const target = hexToApply !== undefined ? hexToApply : solidColor
    if (target.trim()) {
      onChange(target.trim())
      onSelect?.()
    }
  }

  return (
    <div
      className="space-y-3 p-1 select-none w-full"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {showTitle && (
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground pb-0.5">
          <span>Background Settings</span>
          {activeVal ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
                onSelect?.()
              }}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            >
              <X className="size-3" />
              Clear
            </button>
          ) : null}
        </div>
      )}

      {/* Tab Navigation Header */}
      <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted/50 p-1 border border-border/40 text-[11px] font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={cn(
            'flex items-center justify-center gap-1 rounded-md py-1 transition-all cursor-pointer',
            activeTab === 'presets'
              ? 'bg-background text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Sparkles className="size-3" />
          Presets
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('gradient')}
          className={cn(
            'flex items-center justify-center gap-1 rounded-md py-1 transition-all cursor-pointer',
            activeTab === 'gradient'
              ? 'bg-background text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Sliders className="size-3" />
          Gradient
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('image')}
          className={cn(
            'flex items-center justify-center gap-1 rounded-md py-1 transition-all cursor-pointer',
            activeTab === 'image'
              ? 'bg-background text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <ImageIcon className="size-3" />
          Image
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('solid')}
          className={cn(
            'flex items-center justify-center gap-1 rounded-md py-1 transition-all cursor-pointer',
            activeTab === 'solid'
              ? 'bg-background text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Palette className="size-3" />
          Solid
        </button>
      </div>

      {/* Tab 1: Presets (Flat Colors & Gradient Colors) */}
      {activeTab === 'presets' && (
        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-0.5 custom-scrollbar">
          {/* Default / Clear Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
              onSelect?.()
            }}
            className={cn(
              'flex w-full items-center justify-between rounded-md border p-1.5 text-xs transition-all cursor-pointer',
              !activeVal
                ? 'border-primary bg-primary/10 font-medium text-primary shadow-xs ring-1 ring-primary/30'
                : 'border-input bg-background hover:bg-muted/40'
            )}
          >
            <div className="flex items-center gap-2">
              <span className="size-3.5 rounded-full border border-muted-foreground/30 bg-muted/40" />
              <span className="text-[11px]">Default / None</span>
            </div>
            {!activeVal && <Check className="size-3 text-primary" />}
          </button>

          {/* Tailwind Flat Colors Section */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              Flat Colors
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {FLAT_COLOR_PRESETS.map((preset) => {
                const isSelected = activeVal === preset.value
                return (
                  <button
                    key={preset.label}
                    type="button"
                    title={preset.label}
                    onClick={(e) => {
                      e.stopPropagation()
                      onChange(preset.value)
                      onSelect?.()
                    }}
                    className={cn(
                      'flex items-center justify-center gap-1 rounded-md border p-1.5 transition-all cursor-pointer hover:scale-105',
                      preset.colorClass,
                      isSelected ? 'ring-2 ring-primary ring-offset-1 shadow-md' : 'opacity-90 hover:opacity-100'
                    )}
                  >
                    {isSelected && <Check className="size-3 text-white drop-shadow-md" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tailwind Gradient Colors Section */}
          <div className="space-y-1.5 pt-1 border-t border-border/40">
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              Gradients
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {GRADIENT_PRESETS.map((preset) => {
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
                        'size-3.5 shrink-0 rounded-full border border-black/10 shadow-xs flex items-center justify-center text-[9px]',
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
          </div>
        </div>
      )}

      {/* Tab 2: Custom Gradient Studio */}
      {activeTab === 'gradient' && (
        <div className="space-y-3">
          {/* Live Gradient Preview Box */}
          <div
            className="h-14 w-full rounded-lg border border-border/60 shadow-inner flex items-end justify-end p-2 transition-all"
            style={{ background: computedCustomGradient }}
          >
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
              {computedCustomGradient}
            </span>
          </div>

          {/* Gradient Type (Linear / Radial) */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Type:</span>
            <div className="flex items-center gap-1 rounded-md bg-muted p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setGradientType('linear')}
                className={cn(
                  'px-2 py-0.5 rounded text-[11px] cursor-pointer transition-all',
                  gradientType === 'linear' ? 'bg-background font-semibold shadow-xs' : 'text-muted-foreground'
                )}
              >
                Linear
              </button>
              <button
                type="button"
                onClick={() => setGradientType('radial')}
                className={cn(
                  'px-2 py-0.5 rounded text-[11px] cursor-pointer transition-all',
                  gradientType === 'radial' ? 'bg-background font-semibold shadow-xs' : 'text-muted-foreground'
                )}
              >
                Radial
              </button>
            </div>
          </div>

          {/* Color 1 & Color 2 Selectors */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-[10px] font-medium text-muted-foreground">Color 1</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={color1}
                  onChange={(e) => setColor1(e.target.value)}
                  className="size-6 rounded border border-input cursor-pointer bg-transparent p-0 shrink-0"
                />
                <Input
                  value={color1}
                  onChange={(e) => setColor1(e.target.value)}
                  className="h-7 text-[11px] font-mono p-1"
                />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-medium text-muted-foreground">Color 2</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={color2}
                  onChange={(e) => setColor2(e.target.value)}
                  className="size-6 rounded border border-input cursor-pointer bg-transparent p-0 shrink-0"
                />
                <Input
                  value={color2}
                  onChange={(e) => setColor2(e.target.value)}
                  className="h-7 text-[11px] font-mono p-1"
                />
              </div>
            </div>
          </div>

          {/* Angle controls (for Linear gradient) */}
          {gradientType === 'linear' && (
            <div className="space-y-1.5 pt-1 border-t border-border/40">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Angle: {angle}°</span>
                <div className="flex items-center gap-1">
                  {[45, 90, 135, 180].map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAngle(a)}
                      className={cn(
                        'px-1.5 py-0.5 text-[10px] rounded border cursor-pointer transition-all',
                        angle === a ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-input hover:bg-muted'
                      )}
                    >
                      {a}°
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          )}

          <Button
            type="button"
            size="sm"
            onClick={applyCustomGradient}
            className="w-full h-8 text-xs font-semibold cursor-pointer shadow-xs"
          >
            Apply Gradient
          </Button>
        </div>
      )}

      {/* Tab 3: Image URL */}
      {activeTab === 'image' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Image URL</span>
            <div className="flex gap-1.5">
              <Input
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    applyImageUrl()
                  }
                }}
                className="h-8 text-xs flex-1"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => applyImageUrl()}
                className="h-8 text-xs px-3 cursor-pointer"
              >
                Apply
              </Button>
            </div>
          </div>

          {/* Live Thumbnail Preview */}
          {imageUrl.trim() ? (
            <div className="space-y-1">
              <span className="text-[10px] font-medium text-muted-foreground">Preview:</span>
              <div className="h-16 w-full rounded-lg border overflow-hidden relative shadow-xs bg-muted/40">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLElement).style.display = 'none'
                  }}
                />
              </div>
            </div>
          ) : null}

          {/* Preset Sample Wallpaper Grid */}
          <div className="space-y-1.5 pt-1 border-t border-border/40">
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              Sample Wallpapers
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {SAMPLE_IMAGE_PRESETS.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setImageUrl(sample.url)
                    applyImageUrl(sample.url)
                  }}
                  className="group relative h-12 w-full rounded-md border overflow-hidden text-left cursor-pointer transition-all hover:border-primary"
                >
                  <img
                    src={sample.url}
                    alt={sample.label}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/40 p-1 flex items-end">
                    <span className="text-[10px] font-medium text-white truncate drop-shadow-xs">
                      {sample.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Custom Solid Color */}
      {activeTab === 'solid' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={solidColor.startsWith('#') ? solidColor : '#3b82f6'}
              onChange={(e) => setSolidColor(e.target.value)}
              className="size-8 rounded border border-input cursor-pointer bg-transparent p-0 shrink-0"
            />
            <Input
              placeholder="#3b82f6 or rgb(...)"
              value={solidColor}
              onChange={(e) => setSolidColor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  applySolidColor()
                }
              }}
              className="h-8 text-xs font-mono flex-1"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => applySolidColor()}
              className="h-8 text-xs px-3 cursor-pointer"
            >
              Apply
            </Button>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-border/40">
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              Quick Swatches
            </span>
            <div className="grid grid-cols-6 gap-1.5">
              {['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#0f172a', '#18181b'].map((hex) => (
                <button
                  key={hex}
                  type="button"
                  style={{ backgroundColor: hex }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSolidColor(hex)
                    applySolidColor(hex)
                  }}
                  className={cn(
                    'h-6 rounded border border-black/10 transition-all cursor-pointer hover:scale-110 shadow-xs',
                    activeVal === hex ? 'ring-2 ring-primary ring-offset-1' : ''
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      )}
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
      <PopoverContent align="start" className={cn('p-2.5 shadow-2xl z-50', columns === 3 ? 'w-[350px]' : 'w-[320px]')}>
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
