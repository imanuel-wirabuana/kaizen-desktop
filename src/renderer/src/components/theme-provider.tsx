import * as React from 'react'
import { useEventListener } from '@/hooks/use-event-listener'
import { THEME_PRESETS, ThemePreset } from '@/lib/themes'

type Theme = 'system' | 'dark' | 'light'

type ThemeContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
  preset: string
  setPreset: (presetId: string) => void
  presets: ThemePreset[]
  resolvedTheme: 'dark' | 'light'
}

const ThemeContext = React.createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  preset: 'default',
  setPreset: () => {},
  presets: THEME_PRESETS,
  resolvedTheme: 'dark',
})

export function useTheme() {
  return React.useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    return (localStorage.getItem('kaizen-theme') as Theme) || 'system'
  })

  const [preset, setPresetState] = React.useState<string>(() => {
    return localStorage.getItem('kaizen-theme-preset') || 'default'
  })

  const [systemTheme, setSystemTheme] = React.useState<'dark' | 'light'>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const resolvedTheme = theme === 'system' ? systemTheme : theme

  React.useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)
  }, [resolvedTheme])

  // Inject active theme preset CSS rules into document head
  React.useEffect(() => {
    const activePreset = THEME_PRESETS.find((p) => p.id === preset) || THEME_PRESETS[0]
    let styleEl = document.getElementById('shadcn-theme-preset') as HTMLStyleElement | null
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'shadcn-theme-preset'
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = activePreset.style
  }, [preset])

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('kaizen-theme', newTheme)
  }, [])

  const setPreset = React.useCallback((newPreset: string) => {
    setPresetState(newPreset)
    localStorage.setItem('kaizen-theme-preset', newPreset)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, preset, setPreset, presets: THEME_PRESETS, resolvedTheme }}>
      <ThemeHotkey />
      {children}
    </ThemeContext.Provider>
  )
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  )
}

function ThemeHotkey() {
  const { resolvedTheme, setTheme } = useTheme()

  const onKeyDown = React.useCallback(
    (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (event.key.toLowerCase() !== 'd') {
        return
      }

      if (isTypingTarget(event.target)) {
        return
      }

      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    },
    [resolvedTheme, setTheme]
  )

  useEventListener('keydown', onKeyDown)

  return null
}