import { useSyncState } from '@/hooks/use-sync-state'
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SyncStatusBadge() {
  const { status, pendingCount, flushNow } = useSyncState()

  if (status === 'synced' && pendingCount === 0) {
    return (
      <button
        type="button"
        onClick={() => flushNow()}
        title="All changes saved locally & synced to cloud"
        className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-muted-foreground/70 hover:text-foreground transition-colors rounded-md hover:bg-muted/50 cursor-pointer"
      >
        <CheckCircle2 className="size-3 text-emerald-500" />
        <span className="hidden sm:inline">Synced</span>
      </button>
    )
  }

  if (status === 'syncing') {
    return (
      <div
        title="Syncing bulk changes to cloud..."
        className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-amber-500/90 bg-amber-500/10 rounded-md animate-pulse"
      >
        <RefreshCw className="size-3 animate-spin text-amber-500" />
        <span className="hidden sm:inline">Syncing...</span>
      </div>
    )
  }

  if (status === 'offline') {
    return (
      <button
        type="button"
        onClick={() => flushNow()}
        title="Working offline. All changes are saved safely in IndexedDB."
        className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-md cursor-pointer hover:bg-amber-500/20 transition-colors"
      >
        <CloudOff className="size-3" />
        <span>Offline ({pendingCount})</span>
      </button>
    )
  }

  if (status === 'error') {
    return (
      <button
        type="button"
        onClick={() => flushNow()}
        title="Sync failed. Click to retry."
        className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-rose-500 bg-rose-500/10 rounded-md cursor-pointer hover:bg-rose-500/20 transition-colors"
      >
        <AlertCircle className="size-3" />
        <span>Retry Sync ({pendingCount})</span>
      </button>
    )
  }

  // Pending
  return (
    <button
      type="button"
      onClick={() => flushNow()}
      title={`${pendingCount} pending local changes. Click to sync now.`}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium rounded-md cursor-pointer transition-colors',
        'text-blue-500 bg-blue-500/10 hover:bg-blue-500/20'
      )}
    >
      <Cloud className="size-3" />
      <span>{pendingCount} pending</span>
    </button>
  )
}
