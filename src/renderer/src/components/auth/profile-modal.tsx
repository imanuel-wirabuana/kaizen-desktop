import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/providers/auth-provider'
import { useNavigationStore } from '@/stores/navigation'
import { supabase } from '@/lib/supabase'
import { User, Mail, LogOut, Loader2, Check, Shield } from 'lucide-react'

type ProfileModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigationStore((s) => s.navigate)

  const [fullName, setFullName] = useState(user?.fullName || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '')
    }
  }, [user])

  if (!user) return null

  const userFullName = user.fullName || 'User'
  const userEmail = user.email || ''
  const userId = user.id || ''

  const initials = userFullName
    ? userFullName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : userEmail ? userEmail.slice(0, 2).toUpperCase() : 'U'

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || isUpdating) return

    setIsUpdating(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() }
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to update profile.' })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSignOut = async () => {
    onOpenChange(false)
    navigate({ name: 'landing' })
    await signOut()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 space-y-4">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <User className="size-5 text-primary" /> Account Profile
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Manage your personal profile and account settings.
          </DialogDescription>
        </DialogHeader>

        {/* User Card Header */}
        <div className="flex items-center gap-3.5 rounded-xl border bg-card p-3.5 shadow-2xs">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-base overflow-hidden">
            {user.imageUrl ? (
              <img src={user.imageUrl} alt={userFullName} className="size-full object-cover rounded-full" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <h4 className="text-sm font-semibold truncate text-foreground">{userFullName}</h4>
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <Mail className="size-3 shrink-0" /> {userEmail || 'No email'}
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`rounded-lg p-2.5 text-xs font-medium ${
              message.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-destructive/15 text-destructive'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Edit Profile Form */}
        <form onSubmit={handleUpdateProfile} className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Full Name</label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              disabled={isUpdating}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email Address</label>
            <Input value={userEmail} disabled className="h-9 text-xs opacity-70 bg-muted" />
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              size="sm"
              disabled={isUpdating || !fullName.trim() || fullName === userFullName}
              className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="size-3.5" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Account Info & Actions */}
        <div className="border-t pt-3 space-y-3">
          <div className="rounded-lg bg-muted/40 p-2.5 text-[11px] text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>User ID:</span>
              <span className="font-mono text-foreground">
                {userId ? `${userId.slice(0, 18)}...` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Auth Provider:</span>
              <span className="capitalize text-foreground font-medium flex items-center gap-1">
                <Shield className="size-3 text-primary" /> Supabase Auth
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="destructive"
            onClick={handleSignOut}
            className="w-full h-9 text-xs font-semibold gap-2 cursor-pointer"
          >
            <LogOut className="size-4" /> Sign Out & Return to Landing Page
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
