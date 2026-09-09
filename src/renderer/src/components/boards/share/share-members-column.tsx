import { Users, Search, Crown, X, UserCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ShareRoleDropdown } from './share-role-dropdown'
import { getAvatarColor, getInitials } from './utils'
import { ShareRole } from './types'
import { AppUser } from '@/providers/auth-provider'

type ShareMembersColumnProps = {
  board: Board | null
  user: AppUser | null
  isOwner: boolean
  isEditor?: boolean
  isReadOnly?: boolean
  canManageMembers?: boolean
  members: BoardMember[]
  filteredMembers: BoardMember[]
  loadingData: boolean
  searchQuery: string
  setSearchQuery: (q: string) => void
  handleMemberPermissionChange: (memberId: number, newPerm: ShareRole) => void
  handleRemoveMember: (memberId: number) => void
}

export function ShareMembersColumn({
  board,
  user,
  isOwner,
  isEditor = false,
  isReadOnly = false,
  members,
  filteredMembers,
  loadingData,
  searchQuery,
  setSearchQuery,
  handleMemberPermissionChange,
  handleRemoveMember
}: ShareMembersColumnProps) {
  const isCurrentUserOwner = Boolean(user?.id && board?.owner === user?.id)
  const boardOwnerInfo = board?.owner_info

  const ownerName = isCurrentUserOwner
    ? `${user?.fullName || boardOwnerInfo?.name || 'You'} (You)`
    : boardOwnerInfo?.name || 'Board Owner'

  const ownerEmail = isCurrentUserOwner
    ? user?.email || boardOwnerInfo?.email || ''
    : boardOwnerInfo?.email || (board?.owner ? `ID: ${board.owner.slice(0, 16)}...` : 'Owner')

  const ownerAvatarUrl = isCurrentUserOwner
    ? user?.imageUrl || boardOwnerInfo?.avatar_url || null
    : boardOwnerInfo?.avatar_url || null

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 sm:p-5 space-y-4">
      {/* Column Header: Google Drive People with access */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
            <Users className="size-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-foreground">People with access</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {isReadOnly
                ? 'View member roles and permissions for this board.'
                : 'Manage member roles and permissions for this board.'}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground shrink-0">
          {members.length + 1} {members.length + 1 === 1 ? 'person' : 'people'}
        </span>
      </div>

      {/* Member Search Bar (if more than 1 collaborator, or when search active) */}
      {(members.length > 1 || searchQuery) && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter people by name or email..."
            className="h-8 pl-8 pr-7 text-xs bg-muted/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      )}

      {/* Member List Container */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
        {loadingData ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2.5 rounded-lg border bg-muted/20 p-2.5 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <Skeleton className="size-8 rounded-full shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-24 rounded-md" />
                    <Skeleton className="h-2.5 w-36 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16 rounded-md" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Owner Row (always on top unless filtered out by search) */}
            {(!searchQuery ||
              ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (ownerEmail && ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()))) && (
              <div className="flex items-center justify-between gap-2.5 rounded-xl border bg-primary/5 border-primary/20 p-2.5 text-xs transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar size="default" className="size-8">
                      {ownerAvatarUrl && (
                        <AvatarImage src={ownerAvatarUrl} alt={ownerName} />
                      )}
                      <AvatarFallback
                        className={`text-xs font-semibold ring-1 ring-inset ${getAvatarColor(
                          ownerName
                        )}`}
                      >
                        {getInitials(ownerName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs">
                      <Crown className="size-2 text-white" />
                    </div>
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-medium text-foreground">{ownerName}</span>
                    </div>
                    {ownerEmail && (
                      <span className="truncate text-[11px] text-muted-foreground">
                        {ownerEmail}
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-[11px] font-semibold text-primary px-2.5 py-0.5 rounded-md bg-primary/10 shrink-0">
                  Owner
                </span>
              </div>
            )}

            {/* Collaborators List */}
            {filteredMembers.map((mem) => {
              const isCurrentUser = Boolean(user?.id && String(mem.user_id) === String(user.id))
              const isBoardOwner = Boolean(board?.owner && String(mem.user_id) === String(board.owner))
              const memberEmail = isCurrentUser ? user?.email : mem.user_email || mem.email
              const memberName = isCurrentUser
                ? `${user?.fullName || 'You'} (You)`
                : mem.user_name ||
                  mem.full_name ||
                  (memberEmail ? memberEmail.split('@')[0] : 'Member')
              const displayEmail =
                memberEmail || (mem.user_id ? `ID: ${mem.user_id.slice(0, 16)}...` : '')
              const role = (mem.permission as ShareRole) || 'view'

              // Editor can change permissions of other users other than himself (and not board owner)
              const canManageThisMember =
                !isReadOnly &&
                (isOwner || (isEditor && !isCurrentUser && !isBoardOwner))

              return (
                <div
                  key={mem.id}
                  className="flex items-center justify-between gap-2.5 rounded-xl border bg-card/60 hover:bg-accent/40 p-2.5 text-xs transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar size="default" className="size-8 shrink-0">
                      {isCurrentUser && user?.imageUrl && (
                        <AvatarImage src={user.imageUrl} alt={memberName} />
                      )}
                      <AvatarFallback
                        className={`text-xs font-semibold ring-1 ring-inset ${getAvatarColor(
                          memberName
                        )}`}
                      >
                        {getInitials(memberName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-medium text-foreground">{memberName}</span>
                      {displayEmail && (
                        <span className="truncate text-[11px] text-muted-foreground">
                          {displayEmail}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <ShareRoleDropdown
                      role={role}
                      onRoleChange={(newRole) => handleMemberPermissionChange(mem.id, newRole)}
                      onRemove={() => handleRemoveMember(mem.id)}
                      canManage={canManageThisMember}
                      canRemove={isOwner}
                    />
                  </div>
                </div>
              )
            })}

            {/* Empty Search Results */}
            {searchQuery && filteredMembers.length === 0 && (
              <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                No members found matching &ldquo;{searchQuery}&rdquo;.
              </div>
            )}

            {/* Empty Members State */}
            {!searchQuery && members.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground/70 min-h-36">
                <UserCheck className="size-6 text-muted-foreground/40 mb-1.5" />
                <p className="font-medium text-foreground/80">No other collaborators yet</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[220px]">
                  Share an invite link or code from the left to collaborate with teammates.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
