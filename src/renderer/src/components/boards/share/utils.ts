export const getShareUrl = (code: string): string => {
  const origin =
    typeof window !== 'undefined' && window.location.origin.includes('vercel.app')
      ? window.location.origin
      : import.meta.env.VITE_APP_URL || 'https://kaizen33.space'
  return `${origin}?code=${code}`
}

export const formatExpiration = (inv: BoardInvite): string => {
  if (!inv.expires_at) return 'Never'
  const expDate = new Date(inv.expires_at)
  if (isNaN(expDate.getTime())) return 'Never'
  return expDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export const getInitials = (nameOrEmail?: string | null): string => {
  if (!nameOrEmail) return '?'
  const trimmed = nameOrEmail.trim()
  if (!trimmed) return '?'

  if (trimmed.includes('@')) {
    const handle = trimmed.split('@')[0]
    return handle.slice(0, 2).toUpperCase()
  }

  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return parts[0].slice(0, 2).toUpperCase()
}

const AVATAR_COLOR_PALETTES = [
  'bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-blue-500/20',
  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
  'bg-violet-500/15 text-violet-600 dark:text-violet-400 ring-violet-500/20',
  'bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/20',
  'bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-rose-500/20',
  'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 ring-indigo-500/20',
  'bg-teal-500/15 text-teal-600 dark:text-teal-400 ring-teal-500/20',
  'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 ring-fuchsia-500/20',
  'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 ring-cyan-500/20',
  'bg-orange-500/15 text-orange-600 dark:text-orange-400 ring-orange-500/20'
]

export const getAvatarColor = (nameOrEmail?: string | null): string => {
  if (!nameOrEmail) return AVATAR_COLOR_PALETTES[0]
  let hash = 0
  for (let i = 0; i < nameOrEmail.length; i++) {
    hash = nameOrEmail.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_COLOR_PALETTES.length
  return AVATAR_COLOR_PALETTES[index]
}
