import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { SignedIn, SignedOut } from '@/providers/auth-provider'
import { ArrowRight } from 'lucide-react'
import { useNavigationStore } from '@/stores/navigation'
import { useAuthModalStore } from '@/stores/auth-modal'
import { useTheme } from '@/components/theme-provider'
import { GradientWaves } from '@/components/ui/gradient-waves'

export function LandingPage() {
  const navigate = useNavigationStore((s) => s.navigate)
  const openAuthModal = useAuthModalStore((s) => s.openModal)
  const { resolvedTheme, preset } = useTheme()

  const isDark = resolvedTheme === 'dark'

  return (
    <div className="relative flex h-dvh max-h-dvh flex-col overflow-hidden bg-background">
      <div className="absolute inset-0 z-0">
        <GradientWaves
          key={`${resolvedTheme}-${preset}`}
          horizonColor="var(--background)"
          waveColor="var(--primary)"
          crestColor={ 'var(--accent)' }
          opacity={0.9}
          brightness={0.8}
          speed={0.8}
          amplitude={3.3}
          waveScale={0.8}
          waveRatio={0.8}
          detail="medium"
          grainIntensity={0.11}
          tilt={1.11}
          className="size-full"
        />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <Navbar />
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 sm:px-12">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex items-center justify-center">
              <img src="/icon.ico" alt="Kaizen Logo" className="h-16 w-16 sm:h-33 sm:w-33 object-contain drop-shadow-md" />
            </div>

            <div className="max-w-lg space-y-3 sm:max-w-xl">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
                Small moves. Steady ship.
              </h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Change the course by degrees. Trust the process, learn from the journey, and keep the ship moving.
              </p>
            </div>

            <div>
              <SignedIn>
                <Button
                  size="lg"
                  className="font-semibold cursor-pointer shadow-lg"
                  onClick={() => navigate({ name: 'boards' })}
                >
                  Open Boards <ArrowRight className="ml-2 size-4" />
                </Button>
              </SignedIn>
              <SignedOut>
                <Button
                  size="lg"
                  className="font-semibold cursor-pointer shadow-lg"
                  onClick={() => openAuthModal('signup')}
                >
                  Get started <ArrowRight className="ml-2 size-4" />
                </Button>
              </SignedOut>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default LandingPage

