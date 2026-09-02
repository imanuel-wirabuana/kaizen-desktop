import { useState } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { useNavigationStore } from '@/stores/navigation'
import { ProfileModal } from '@/components/auth/profile-modal'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'

export function UserButton() {
  const { user, signOut } = useAuth()
  const navigate = useNavigationStore((s) => s.navigate)
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  if (!user) return null

  const fullName = user.fullName || ''
  const email = user.email || ''

  const initials = fullName
    ? fullName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : email ? email.slice(0, 2).toUpperCase() : 'U'

  const handleSignOut = async () => {
    navigate({ name: 'landing' })
    await signOut()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="relative size-8 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs p-0 overflow-hidden cursor-pointer"
            >
              {user.imageUrl ? (
                <img src={user.imageUrl} alt={fullName || 'User'} className="size-full object-cover rounded-full" />
              ) : (
                <span>{initials}</span>
              )}
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-56 p-1.5">
          <DropdownMenuLabel className="font-normal p-2">
            <div className="flex flex-col space-y-1">
              <p className="text-xs font-semibold leading-none text-foreground">{fullName || 'User'}</p>
              <p className="text-[11px] leading-none text-muted-foreground truncate">{email || 'No email'}</p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setProfileModalOpen(true)}
            className="cursor-pointer gap-2 text-xs"
          >
            <User className="size-3.5 text-muted-foreground" />
            <span>Manage Account</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            onClick={handleSignOut}
            className="cursor-pointer gap-2 text-xs"
          >
            <LogOut className="size-3.5" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileModal open={profileModalOpen} onOpenChange={setProfileModalOpen} />
    </>
  )
}
