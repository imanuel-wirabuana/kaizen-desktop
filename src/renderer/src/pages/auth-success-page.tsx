import { useEffect, useState } from 'react'
import { CheckCircle2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AuthSuccessPage() {
  const [deepLinkUrl, setDeepLinkUrl] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const target = 'kaizen://auth/callback' + window.location.search + window.location.hash
      setDeepLinkUrl(target)
      
      // Auto-trigger deep link redirect to open desktop app
      const timer = setTimeout(() => {
        window.location.href = target
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [])

  const handleOpenApp = () => {
    if (deepLinkUrl) {
      window.location.href = deepLinkUrl
    }
  }

  return (
    <div className="flex h-dvh w-full items-center justify-center bg-background p-6 select-none">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border/60 bg-card p-8 text-center shadow-xl backdrop-blur-md">
        <div className="mx-auto flex items-center justify-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 p-3 border border-border/40 shadow-inner">
            <img src="/icon.ico" alt="Kaizen Icon" className="h-10 w-10 object-contain" />
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-inner">
            <CheckCircle2 className="h-9 w-9" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Authentication Successful
          </h1>
          <p className="text-sm text-muted-foreground">
            Your Google login was verified. Launching Kaizen Desktop App...
          </p>
        </div>

        <div className="pt-2 space-y-3">
          <Button
            onClick={handleOpenApp}
            className="w-full gap-2 font-medium shadow-md transition-all hover:scale-[1.01]"
            size="lg"
          >
            <ExternalLink className="h-4 w-4" />
            Open Kaizen Desktop
          </Button>

          <p className="text-xs text-muted-foreground/80">
            You can safely close this browser window once Kaizen opens.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthSuccessPage
