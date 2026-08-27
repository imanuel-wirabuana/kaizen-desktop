import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { LogIn } from 'lucide-react'
import { useNavigationStore } from '@/stores/navigation'

export function Navbar() {
  const navigate = useNavigationStore((s) => s.navigate)

  return (
    <nav className="fixed inset-x-0 top-0 z-30 flex items-center justify-between bg-transparent px-4 py-2 sm:px-6 md:px-12">
      <div>
        <button
          type="button"
          onClick={() => navigate({ name: 'landing' })}
          className="cursor-pointer inline-block text-left"
        >
          <h1 className="text-xl font-semibold">
            <span className="text-primary">改善</span> · Kaizen
          </h1>
        </button>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <SignedOut>
          <SignInButton mode="modal">
            <Button size="icon" variant="ghost">
              <LogIn className="size-4" />
            </Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </nav>
  )
}

export default Navbar
