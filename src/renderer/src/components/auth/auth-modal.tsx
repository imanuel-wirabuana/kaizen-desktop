import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { Loader2, LogIn, UserPlus } from 'lucide-react'

type AuthModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: 'signin' | 'signup'
}

export function AuthModal({ open, onOpenChange, defaultTab = 'signin' }: AuthModalProps) {
  const [tab, setTab] = useState<'signin' | 'signup'>(defaultTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setFullName('')
    setError(null)
    setSuccessMessage(null)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return

    setLoading(true)
    setError(null)

    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (err) {
        setError(err.message)
      } else {
        handleOpenChange(false)
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim() || email.split('@')[0]
          }
        }
      })

      if (err) {
        setError(err.message)
      } else if (data.session) {
        // Auto-confirmed signup
        handleOpenChange(false)
      } else {
        // Confirmation email sent or requires verification
        setSuccessMessage('Account created! Please check your email to confirm your account, or sign in.')
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-center">
            {tab === 'signin' ? 'Welcome back' : 'Create an account'}
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground">
            {tab === 'signin'
              ? 'Sign in to access your Kanban boards'
              : 'Start organizing your tasks with Kaizen'}
          </DialogDescription>
        </DialogHeader>

        {/* Tab switch buttons */}
        <div className="grid grid-cols-2 rounded-lg bg-muted p-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setTab('signin')
              setError(null)
              setSuccessMessage(null)
            }}
            className={`rounded-md py-1.5 font-medium transition-all cursor-pointer ${
              tab === 'signin'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup')
              setError(null)
              setSuccessMessage(null)
            }}
            className={`rounded-md py-1.5 font-medium transition-all cursor-pointer ${
              tab === 'signup'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/15 p-3 text-xs font-medium text-destructive">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-lg bg-emerald-500/15 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {successMessage}
          </div>
        )}

        {tab === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full font-semibold gap-2 cursor-pointer mt-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Signing in...
                </>
              ) : (
                <>
                  <LogIn className="size-4" /> Sign In
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Full Name</label>
              <Input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full font-semibold gap-2 cursor-pointer mt-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="size-4" /> Create Account
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
