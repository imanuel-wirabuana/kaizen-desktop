import { useEffect } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { ViewRouter } from '@/components/view-router'
import { JoinBoardModal } from '@/components/boards'
import { initGlobalRealtimeSync } from '@/lib/realtime'
import { useJoinModalStore } from '@/stores/join-modal'

export function App() {
  useEffect(() => {
    initGlobalRealtimeSync()

    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      let code = searchParams.get('code') || searchParams.get('invite')

      if (!code && window.location.hash.includes('?')) {
        const hashQuery = window.location.hash.split('?')[1]
        const hashParams = new URLSearchParams(hashQuery)
        code = hashParams.get('code') || hashParams.get('invite')
      }

      if (code) {
        useJoinModalStore.getState().openModal(code)
        const url = new URL(window.location.href)
        url.searchParams.delete('code')
        url.searchParams.delete('invite')
        const newUrl = url.pathname + (url.search ? url.search : '') + url.hash
        window.history.replaceState({}, '', newUrl || '/')
      }
    }
  }, [])

  return (
    <ThemeProvider>
      <ViewRouter />
      <JoinBoardModal />
    </ThemeProvider>
  )
}

export default App

