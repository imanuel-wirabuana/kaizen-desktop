import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useNavigationStore } from '@/stores/navigation'

export type AppUser = {
  id: string
  email: string
  fullName: string
  primaryEmailAddress: { emailAddress: string }
  imageUrl?: string
  user_metadata: Record<string, any>
}

type AuthContextType = {
  user: AppUser | null
  session: Session | null
  isLoaded: boolean
  isSignedIn: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoaded: false,
  isSignedIn: false,
  signOut: async () => {}
})

function formatAppUser(user: SupabaseUser | null): AppUser | null {
  if (!user) return null
  const email = user.email || ''
  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    (email ? email.split('@')[0] : 'User')
  const imageUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture

  return {
    id: user.id || '',
    email,
    fullName,
    primaryEmailAddress: { emailAddress: email },
    imageUrl,
    user_metadata: user.user_metadata || {}
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AppUser | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(formatAppUser(session?.user ?? null))
      setIsLoaded(true)
    })

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(formatAppUser(session?.user ?? null))
      setIsLoaded(true)

      if (!session) {
        useNavigationStore.getState().navigate({ name: 'landing' })
      }
    })

    // Listen for Electron deep link protocol auth callbacks (kaizen://auth/callback)
    const handleDeepLink = async (rawUrl: string) => {
      try {
        let access_token: string | null = null
        let refresh_token: string | null = null
        let code: string | null = null

        if (rawUrl.includes('#')) {
          const hash = rawUrl.split('#')[1]
          const params = new URLSearchParams(hash)
          access_token = params.get('access_token')
          refresh_token = params.get('refresh_token')
        } else if (rawUrl.includes('?')) {
          const search = rawUrl.split('?')[1]
          const params = new URLSearchParams(search)
          code = params.get('code')
          access_token = params.get('access_token')
          refresh_token = params.get('refresh_token')
        }

        if (access_token && refresh_token) {
          const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
          if (!error && data.session) {
            setSession(data.session)
            setUser(formatAppUser(data.session.user))
            useNavigationStore.getState().navigate({ name: 'boards' })
          }
        } else if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (!error && data.session) {
            setSession(data.session)
            setUser(formatAppUser(data.session.user))
            useNavigationStore.getState().navigate({ name: 'boards' })
          }
        }
      } catch (err) {
        console.error('Error processing auth callback deep link:', err)
      }
    }

    const unsubDeepLink = window.api?.onAuthCallback
      ? window.api.onAuthCallback(handleDeepLink)
      : undefined

    return () => {
      subscription.unsubscribe()
      if (unsubDeepLink) unsubDeepLink()
    }
  }, [])

  const signOut = async () => {
    useNavigationStore.getState().navigate({ name: 'landing' })
    await supabase.auth.signOut()
  }

  const isSignedIn = Boolean(user && session)

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoaded,
        isSignedIn,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useUser() {
  const { user, isLoaded, isSignedIn } = useAuth()
  return { user, isLoaded, isSignedIn }
}

export function SignedIn({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth()
  if (!isLoaded || !isSignedIn) return null
  return <>{children}</>
}

export function SignedOut({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth()
  if (!isLoaded || isSignedIn) return null
  return <>{children}</>
}
