import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'
import { ArrowRight } from 'lucide-react'
import { useNavigationStore } from '@/stores/navigation'

export function LandingPage() {
  const navigate = useNavigationStore((s) => s.navigate)

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-[url(/blob-scene-haikei-light.svg)] bg-cover bg-center dark:bg-[url(/blob-scene-haikei-dark.svg)]">
      <Navbar />
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 sm:px-12">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="max-w-lg space-y-3 sm:max-w-xl">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
              Small moves. Steady ship.
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              A kanban for continuous improvement. Drag a card across columns — every commit is one
              tiny, deliberate step forward.
            </p>
          </div>

          <div>
            <SignedIn>
              <Button
                size="lg"
                className="font-semibold"
                onClick={() => navigate({ name: 'boards' })}
              >
                Open Boards <ArrowRight className="ml-2 size-4" />
              </Button>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button size="lg" className="font-semibold">
                  Get started <ArrowRight className="ml-2 size-4" />
                </Button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </main>
    </div>
  )
}

export default LandingPage
