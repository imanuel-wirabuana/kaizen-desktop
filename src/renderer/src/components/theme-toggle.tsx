import { Moon, Sun, SunMoon } from 'lucide-react'
import { useTheme } from './theme-provider'
import { useMounted } from '@/hooks/use-mounted'
import { Button } from '@/components/ui/button'

const order = ['system', 'dark', 'light'] as const
type Mode = (typeof order)[number]

function nextMode(current: Mode): Mode {
  const i = order.indexOf(current)
  return order[(i + 1) % order.length]
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const mounted = useMounted()

  const safeTheme: Mode = (order as readonly string[]).includes(theme ?? '')
    ? (theme as Mode)
    : 'system'

  const Icon = !mounted
    ? SunMoon
    : safeTheme === 'system'
      ? SunMoon
      : resolvedTheme === 'dark'
        ? Moon
        : Sun

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Theme: ${safeTheme}. Click to switch.`}
      onClick={() => setTheme(nextMode(safeTheme))}
      className={className}
    >
      <Icon className="size-4" />
    </Button>
  )
}

export default ThemeToggle