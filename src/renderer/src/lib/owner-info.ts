import type { AppUser } from '@/providers/auth-provider'

/**
 * Extracts a normalized OwnerInfo JSON snapshot from the active AppUser.
 */
export function getOwnerInfoFromUser(user: AppUser | null | undefined): OwnerInfo {
  if (!user) return null

  const name =
    user.fullName ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    (user.email ? user.email.split('@')[0] : null)

  const avatarUrl =
    user.imageUrl ||
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null

  return {
    id: user.id || undefined,
    name: name || null,
    email: user.email || null,
    avatar_url: avatarUrl
  }
}

/**
 * Returns a human-friendly display name for an OwnerInfo object.
 */
export function getOwnerDisplayName(ownerInfo?: OwnerInfo, fallback = 'Unknown User'): string {
  if (!ownerInfo) return fallback
  if (ownerInfo.name && ownerInfo.name.trim()) return ownerInfo.name.trim()
  if (ownerInfo.email && ownerInfo.email.trim()) {
    return ownerInfo.email.split('@')[0]
  }
  return fallback
}

/**
 * Returns the avatar URL if present.
 */
export function getOwnerAvatarUrl(ownerInfo?: OwnerInfo): string | null {
  if (!ownerInfo) return null
  return ownerInfo.avatar_url || ownerInfo.imageUrl || ownerInfo.picture || null
}

/**
 * Returns 1 or 2 uppercase initials for avatar fallbacks.
 */
export function getOwnerInitials(nameOrEmail?: string | null): string {
  if (!nameOrEmail || !nameOrEmail.trim()) return '?'
  const clean = nameOrEmail.trim()
  const parts = clean.split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return clean.slice(0, 2).toUpperCase()
}
