import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigationStore } from '@/stores/navigation'

export function BoardNotFound() {
  const navigate = useNavigationStore((s) => s.navigate)

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <AlertCircle className="size-10 text-destructive/80" />
      <h2 className="text-lg font-semibold">Access Revoked or Board Not Found</h2>
      <p className="text-xs text-muted-foreground max-w-sm">
        You no longer have permission to access this board, or the board has been deleted by its owner.
      </p>
      <Button size="sm" onClick={() => navigate({ name: 'boards' })} className="mt-2">
        Back to Boards
      </Button>
    </div>
  )
}
