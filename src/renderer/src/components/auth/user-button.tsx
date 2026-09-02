import { useAuth } from '@/providers/auth-provider'
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

  if (!user) return null

  const initials = user.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : user.email.slice(0, 2).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="relative size-8 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs p-0 overflow-hidden cursor-pointer"
          >
            {user.imageUrl ? (
              <img src={user.imageUrl} alt={user.fullName} className="size-full object-cover rounded-full" />
            ) : (
              <span>{initials}</span>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56 p-1.5">
        <DropdownMenuLabel className="font-normal p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-xs font-semibold leading-none text-foreground">{user.fullName}</p>
            <p className="text-[11px] leading-none text-muted-foreground truncate">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => signOut()}
          className="cursor-pointer gap-2 text-xs"
        >
          <LogOut className="size-3.5" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
