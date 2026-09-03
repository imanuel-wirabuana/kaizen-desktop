import { useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { SignedIn, SignedOut } from '@/providers/auth-provider'
import { UserButton } from '@/components/auth/user-button'
import { AuthModal } from '@/components/auth/auth-modal'
import { LogIn } from 'lucide-react'
import { useNavigationStore } from '@/stores/navigation'

export function Navbar() {
  const navigate = useNavigationStore((s) => s.navigate)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-30 flex items-center justify-between bg-transparent px-4 py-2 sm:px-6 md:px-12">
        <div>
          <button
            type="button"
            onClick={() => navigate({ name: 'landing' })}
            className="cursor-pointer flex items-center gap-2 text-left"
          >
            <img src="/icon.ico" alt="Kaizen" className="size-6 object-contain rounded-md shadow-sm" />
            <h1 className="text-xl font-semibold">Kaizen</h1>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SignedOut>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setAuthModalOpen(true)}
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

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  )
}

export default Navbar
