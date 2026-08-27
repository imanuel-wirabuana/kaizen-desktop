import { useNavigationStore } from '@/stores/navigation'
import { LandingPage } from '@/pages/landing-page'
import { BoardsPage } from '@/pages/boards-page'
import { BoardDetailPage } from '@/pages/board-detail-page'
import { BoardsLayout } from '@/layouts/boards-layout'

export function ViewRouter() {
  const currentView = useNavigationStore((s) => s.currentView)

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
