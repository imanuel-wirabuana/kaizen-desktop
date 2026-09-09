import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { SignedIn, SignedOut } from '@/providers/auth-provider'
import { UserButton } from '@/components/auth/user-button'
import { LogIn } from 'lucide-react'
import { useNavigationStore } from '@/stores/navigation'
import { useAuthModalStore } from '@/stores/auth-modal'

export function Navbar() {
  const navigate = useNavigationStore((s) => s.navigate)
  const openAuthModal = useAuthModalStore((s) => s.openModal)

  return (
    <nav className="fixed inset-x-0 top-0 z-30 flex items-center justify-between bg-transparent px-4 py-2 sm:px-6 md:px-12">
      <div>
        <button
          type="button"
          onClick={() => navigate({ name: 'landing' })}
          className="cursor-pointer flex items-center gap-2 text-left"
        >
          <img src="/icon.ico" alt="Kaizen" className="size-6 object-contain rounded-md shadow-sm" />
          <h1 className="font-brand text-xl tracking-wide text-foreground/75">kaizen33</h1>
        </button>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <SignedOut>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => openAuthModal('signin')}
            className="cursor-pointer"
            title="Sign In"
          >
            <LogIn className="size-4" />
          </Button>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </nav>
  )
}

export default Navbar
