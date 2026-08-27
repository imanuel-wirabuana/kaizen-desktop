import { ThemeProvider } from '@/components/theme-provider'
import { ViewRouter } from '@/components/view-router'

export function App() {
  return (
    <ThemeProvider>
      <ViewRouter />
    </ThemeProvider>
  )
}

export default App
