import { useEffect } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { ViewRouter } from '@/components/view-router'
import { initGlobalRealtimeSync } from '@/lib/realtime'

export function App() {
  useEffect(() => {
    initGlobalRealtimeSync()
  }, [])

  return (
    <ThemeProvider>
      <ViewRouter />
    </ThemeProvider>
  )
}

export default App
