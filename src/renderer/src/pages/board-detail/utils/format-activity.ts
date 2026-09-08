export function formatLastActivity(dateStr?: string | null): string {
  if (!dateStr) return 'No recent activity'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 'No recent activity'
  const diffMs = Date.now() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  if (diffSecs < 15) return 'Just now'
  if (diffSecs < 60) return `${diffSecs}s ago`
  const diffMins = Math.floor(diffSecs / 60)
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
