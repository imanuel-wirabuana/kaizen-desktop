import { useEffect } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { ViewRouter } from '@/components/view-router'
import { JoinBoardModal } from '@/components/boards'
import { AuthModal } from '@/components/auth/auth-modal'
import { initGlobalRealtimeSync } from '@/lib/realtime'
import { useJoinModalStore } from '@/stores/join-modal'
import { useAuthModalStore } from '@/stores/auth-modal'
import { useUser } from '@/providers/auth-provider'

export function App() {
  const { user, isLoaded, isSignedIn } = useUser()

  useEffect(() => {
    initGlobalRealtimeSync()
  }, [])

  // 1. On mount: extract invite code from query parameters or hash, preserve it, and clean URL
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Never process or strip params on /success auth callback route
    if (window.location.pathname.startsWith('/success')) return

    const searchParams = new URLSearchParams(window.location.search)
    let rawCode = searchParams.get('code') || searchParams.get('invite')

    if (!rawCode && window.location.hash.includes('?')) {
      const hashQuery = window.location.hash.split('?')[1]
      const hashParams = new URLSearchParams(hashQuery)
      rawCode = hashParams.get('code') || hashParams.get('invite')
    }

    if (!rawCode) return

    const trimmed = rawCode.trim()
    const isExplicitInvite = Boolean(searchParams.get('invite'))
    const isInviteCodeFormat = /^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/.test(trimmed)

    if (isExplicitInvite || isInviteCodeFormat) {
      // Store and preserve invite code in store & localStorage
      useJoinModalStore.getState().setPendingInviteCode(trimmed)

      // Clean query parameters from address bar
      const url = new URL(window.location.href)
      url.searchParams.delete('code')
      url.searchParams.delete('invite')
      const newUrl = url.pathname + (url.search ? url.search : '') + url.hash
      window.history.replaceState({}, '', newUrl || '/')
    }
  }, [])

  // 2. React to auth state and handle pending invite code
  useEffect(() => {
    if (!isLoaded) return

    // Do not pop auth/join modal on /success route
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/success')) return

    const pendingCode = useJoinModalStore.getState().pendingInviteCode

    if (pendingCode) {
      if (isSignedIn && user) {
        // User is authenticated -> show join board dialog with preserved code and clear pending
        useAuthModalStore.getState().closeModal()
        useJoinModalStore.getState().openModal(pendingCode)
        useJoinModalStore.getState().setPendingInviteCode(null)
      } else {
        // User is NOT yet logged in -> show login dialog, keep invite code preserved
        useAuthModalStore.getState().openModal('signin')
      }
    }
  }, [isLoaded, isSignedIn, user])

  return (
    <ThemeProvider>
      <ViewRouter />
      <JoinBoardModal />
      <AuthModal />
    </ThemeProvider>
  )
}

export default App
