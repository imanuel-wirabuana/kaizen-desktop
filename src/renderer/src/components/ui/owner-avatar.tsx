import * as React from 'react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import {
  getOwnerDisplayName,
  getOwnerAvatarUrl,
  getOwnerInitials
} from '@/lib/owner-info'
import { cn } from '@/lib/utils'

export type OwnerAvatarProps = {
  ownerInfo?: OwnerInfo
  fallbackLabel?: string
  className?: string
  avatarClassName?: string
  size?: 'xs' | 'sm' | 'md'
  showName?: boolean
  prefix?: string
}

export function OwnerAvatar({
  ownerInfo,
  fallbackLabel,
  className,
  avatarClassName,
  size = 'xs',
  showName = false,
  prefix = 'Created by'
}: OwnerAvatarProps) {
  const [imageError, setImageError] = React.useState(false)

  if (!ownerInfo && !fallbackLabel) return null

  const displayName = getOwnerDisplayName(ownerInfo, fallbackLabel || 'Unknown')
  const avatarUrl = getOwnerAvatarUrl(ownerInfo)
  const initials = getOwnerInitials(displayName)

  const sizeClasses = {
    xs: 'size-4 text-[9px]',
    sm: 'size-5 text-[10px]',
    md: 'size-6 text-xs'
  }[size]

  const avatar = (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden font-semibold select-none border border-border/60 bg-muted text-muted-foreground',
        sizeClasses,
        avatarClassName
      )}
    >
      {avatarUrl && !imageError ? (
        <img
          src={avatarUrl}
          alt={displayName}
          onError={() => setImageError(true)}
          className="size-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )

  const tooltipText = ownerInfo?.email
    ? `${prefix}: ${displayName} (${ownerInfo.email})`
    : `${prefix}: ${displayName}`

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            className={cn('inline-flex items-center gap-1.5 cursor-default', className)}
            onClick={(e) => e.stopPropagation()}
          />
        }
      >
        {avatar}
        {showName && (
          <span className="text-xs font-medium text-muted-foreground truncate max-w-[120px]">
            {displayName}
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  )
}
