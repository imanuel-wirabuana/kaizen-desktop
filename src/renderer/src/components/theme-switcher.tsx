import { useState } from 'react'
import { Moon, Sun, SunMoon, Check, Palette, Sparkles } from 'lucide-react'
import { useTheme } from './theme-provider'
import { useMounted } from '@/hooks/use-mounted'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme, preset, setPreset, presets, resolvedTheme } = useTheme()
  const mounted = useMounted()
  const [open, setOpen] = useState(false)

  const activePreset = presets.find((p) => p.id === preset) || presets[0]

  const Icon = !mounted
    ? SunMoon
    : theme === 'system'
      ? SunMoon
      : resolvedTheme === 'dark'
        ? Moon
        : Sun

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Theme & Appearance Options"
            className={cn('relative cursor-pointer hover:bg-muted/80', className)}
            title={`Active Theme: ${activePreset.label} (${theme})`}
          >
            <Icon className="size-4" />
            <span
              className="absolute -top-0.5 -right-0.5 size-2 rounded-full ring-2 ring-background shadow-xs transition-colors"
              style={{ backgroundColor: activePreset.color }}
            />
          </Button>
        }
      />
      <PopoverContent align="end" className="w-64 p-3 shadow-xl border border-border/80 bg-popover/95 backdrop-blur-md space-y-3 z-50">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Palette className="size-3.5 text-primary" />
            <span>Theme & Appearance</span>
          </div>
          <span className="text-[10px] font-medium text-muted-foreground capitalize bg-muted px-1.5 py-0.5 rounded-md">
            {activePreset.label}
          </span>
        </div>

        {/* Mode Selector (System / Dark / Light) */}
        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Mode</span>
          <div className="grid grid-cols-3 gap-1 bg-muted/40 p-1 rounded-xl border border-border/40">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={cn(
                'flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer select-none',
                theme === 'light'
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
              )}
            >
              <Sun className="size-3" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={cn(
                'flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer select-none',
                theme === 'dark'
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
              )}
            >
              <Moon className="size-3" />
              <span>Dark</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={cn(
                'flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer select-none',
                theme === 'system'
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
              )}
            >
              <SunMoon className="size-3" />
              <span>Auto</span>
            </button>
          </div>
        </div>

        {/* Color Theme Presets Grid */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Theme Preset</span>
          <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
            {presets.map((p) => {
              const isSelected = preset === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPreset(p.id)}
                  className={cn(
                    'flex items-center justify-between p-1.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer select-none',
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary font-semibold shadow-2xs'
                      : 'border-border/60 bg-background/60 hover:bg-muted/80 text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="size-3.5 rounded-full shrink-0 shadow-2xs ring-1 ring-border/50"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="truncate text-[11px]">{p.label}</span>
                  </div>
                  {isSelected && <Check className="size-3 shrink-0 text-primary" />}
                </button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
