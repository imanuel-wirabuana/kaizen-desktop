import { useEffect } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { useNavigationStore } from '@/stores/navigation'
import { LandingPage } from '@/pages/landing-page'
import { BoardsPage } from '@/pages/boards-page'
import { BoardDetailPage } from '@/pages/board-detail-page'
import { AuthSuccessPage } from '@/pages/auth-success-page'
import { BoardsLayout } from '@/layouts/boards-layout'
import { Skeleton } from '@/components/ui/skeleton'

export function ViewRouter() {
  const currentView = useNavigationStore((s) => s.currentView)
  const navigate = useNavigationStore((s) => s.navigate)
  const { isLoaded, isSignedIn } = useAuth()

  const isSuccessRoute =
    typeof window !== 'undefined' &&
    (window.location.pathname === '/success' || window.location.pathname.startsWith('/success'))

  useEffect(() => {
    if (isSuccessRoute) return

    if (isLoaded) {
      if (!isSignedIn && currentView.name !== 'landing') {
        navigate({ name: 'landing' })
      } else if (isSignedIn && currentView.name === 'landing') {
        navigate({ name: 'boards' })
      }
    }
  }, [isLoaded, isSignedIn, currentView.name, navigate, isSuccessRoute])

  if (isSuccessRoute || currentView.name === 'success') {
    return <AuthSuccessPage />
  }

  if (!isLoaded && currentView.name !== 'landing') {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-background p-6">
        <div className="space-y-3 text-center">
          <Skeleton className="h-8 w-48 mx-auto rounded-lg" />
          <Skeleton className="h-4 w-32 mx-auto rounded-md" />
        </div>
      </div>
    )
  }

  if (isLoaded && !isSignedIn) {
    return <LandingPage />
  }

  switch (currentView.name) {
    case 'landing':
      return <LandingPage />
    case 'boards':
      return (
        <BoardsLayout>
          <BoardsPage />
        </BoardsLayout>
      )
    case 'board-detail':
      return (
        <BoardsLayout>
          <BoardDetailPage boardId={currentView.boardId} />
        </BoardsLayout>
      )
    default:
      return <LandingPage />
  }
}

export default ViewRouter

