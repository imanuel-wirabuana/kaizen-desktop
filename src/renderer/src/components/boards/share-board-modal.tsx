import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  createInvite,
  getInvitesByBoardId,
  revokeInvite,
  subscribeBoardInvites,
  ExpirationOption,
  MaxUsesOption
} from '@/services/invites'
import {
  getBoardMembers,
  updateMemberPermission,
  removeMember,
  subscribeBoardMembers
} from '@/services/members'
import { useUser } from '@/providers/auth-provider'
import { supabase } from '@/lib/supabase'
import { broadcastSyncEvent, onSyncEvent } from '@/lib/realtime'
import { Skeleton } from '@/components/ui/skeleton'
import { Copy, Check, Share2, Trash2, Users, KeyRound, Shield, Loader2, Link } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

type ShareBoardModalProps = {
  board: Board | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const getShareUrl = (code: string) => {
  const origin =
    typeof window !== 'undefined' && window.location.origin.includes('vercel.app')
      ? window.location.origin
      : 'https://kaizen33.vercel.app'
  return `${origin}?code=${code}`
}

export function ShareBoardModal({ board, open, onOpenChange }: ShareBoardModalProps) {
  const { user } = useUser()

  const [permission, setPermission] = useState<'view' | 'edit'>('view')
  const [expiresOption, setExpiresOption] = useState<ExpirationOption>('7_days')
  const [maxUsesOption, setMaxUsesOption] = useState<MaxUsesOption>('unlimited')

  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLinkCode, setCopiedLinkCode] = useState(false)
  const [copiedActiveLinkId, setCopiedActiveLinkId] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const [invites, setInvites] = useState<BoardInvite[]>([])
  const [members, setMembers] = useState<BoardMember[]>([])
  const [loadingData, setLoadingData] = useState(false)

  const fetchInvitesAndMembers = async () => {
    if (!board?.id) return
    setLoadingData(true)
    try {
      const [invList, memList] = await Promise.all([
        getInvitesByBoardId(board.id),
        getBoardMembers(board.id)
      ])
      setInvites(invList.filter((i) => !i.revoked))
      setMembers(memList)
    } catch (err) {
      console.error('Error loading invites or members:', err)
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (open && board?.id) {
      const boardId = board.id
      setGeneratedCode(null)
      fetchInvitesAndMembers()

      const memChannel = subscribeBoardMembers(boardId, () => {
        getBoardMembers(boardId).then(setMembers)
      })

      const invChannel = subscribeBoardInvites(boardId, () => {
        getInvitesByBoardId(boardId).then((invList) => {
          setInvites(invList.filter((i) => !i.revoked))
        })
      })

      const unsubBroadcast = onSyncEvent((event) => {
        if (event === 'members') {
          getBoardMembers(boardId).then(setMembers)
        }
      })

      return () => {
        supabase.removeChannel(memChannel)
        supabase.removeChannel(invChannel)
        unsubBroadcast()
      }
    }
    return undefined
  }, [open, board?.id])

  const handleGenerate = async () => {
    if (!board?.id || !user?.id) return
    setIsGenerating(true)

    try {
      const newInvite = await createInvite({
        boardId: board.id,
        permission,
        expiresOption,
        maxUsesOption,
        createdBy: user.id
      })

      if (newInvite?.code) {
        setGeneratedCode(newInvite.code)
        await fetchInvitesAndMembers()
      }
    } catch (err) {
      console.error('Failed to generate invite code:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleCopyLink = (code: string) => {
    navigator.clipboard.writeText(getShareUrl(code))
    setCopiedLinkCode(true)
    setTimeout(() => setCopiedLinkCode(false), 2000)
  }

  const handleCopyActiveLink = (inviteId: number, code: string) => {
    navigator.clipboard.writeText(getShareUrl(code))
    setCopiedActiveLinkId(inviteId)
    setTimeout(() => setCopiedActiveLinkId(null), 2000)
  }

  const handleRevoke = async (inviteId: number) => {
    const ok = await revokeInvite(inviteId)
    if (ok) {
      setInvites((prev) => prev.filter((i) => i.id !== inviteId))
    }
  }

  const handleMemberPermissionChange = async (memberId: number, newPerm: 'view' | 'edit') => {
    const ok = await updateMemberPermission(memberId, newPerm)
    if (ok) {
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, permission: newPerm } : m)))
      broadcastSyncEvent('members', { boardId: board?.id })
      broadcastSyncEvent('boards')
    }
  }

  const handleRemoveMember = async (memberId: number) => {
    const ok = await removeMember(memberId)
    if (ok) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
      broadcastSyncEvent('members', { boardId: board?.id })
      broadcastSyncEvent('boards')
    }
  }

  const formatExpiration = (inv: BoardInvite) => {
    if (!inv.expires_at) return 'Never'
    const expDate = new Date(inv.expires_at)
    if (isNaN(expDate.getTime())) return 'Never'
    return expDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Share2 className="size-4" />
            </div>
            <DialogTitle>Share Board</DialogTitle>
          </div>
          <DialogDescription>
            Invite teammates to{' '}
            <span className="font-semibold text-foreground">{board?.title}</span> using temporary
            invite codes.
          </DialogDescription>
        </DialogHeader>

        {/* ── Generate Invite Section ── */}
        <div className="rounded-xl border bg-card p-3.5 space-y-3 shadow-2xs">
          <h4 className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
            <KeyRound className="size-3.5 text-muted-foreground" /> Generate Invite Code
          </h4>

          <div className="grid grid-cols-3 gap-2 text-xs">
            {/* Permission Selector */}
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium">Permission:</label>
              <Select
                value={permission}
                onValueChange={(val: string) => setPermission(val as 'view' | 'edit')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Expires Selector */}
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium">Expires:</label>
              <Select
                value={expiresOption}
                onValueChange={(val: string) => setExpiresOption(val as ExpirationOption)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="1_hour">1 hour</SelectItem>
                  <SelectItem value="1_day">1 day</SelectItem>
                  <SelectItem value="7_days">7 days</SelectItem>
                  <SelectItem value="30_days">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Maximum Uses Selector */}
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium">Maximum uses:</label>
              <Select
                value={maxUsesOption}
                onValueChange={(val: string) => setMaxUsesOption(val as MaxUsesOption)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                  <SelectItem value="1">1 use</SelectItem>
                  <SelectItem value="5">5 uses</SelectItem>
                  <SelectItem value="10">10 uses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full h-8 text-xs font-semibold gap-1.5 cursor-pointer mt-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Generating...
              </>
            ) : (
              'Generate Invite Code'
            )}
          </Button>

          {/* Generated Code Display Box */}
          {generatedCode && (
            <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Invite Code Generated
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-base font-bold tracking-widest text-primary">
                  {generatedCode}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(generatedCode)}
                    className="h-7 gap-1 text-xs font-medium cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="size-3.5 text-emerald-500" /> Copied Code
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" /> Copy Code
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleCopyLink(generatedCode)}
                    className="h-7 gap-1 text-xs font-medium cursor-pointer"
                  >
                    {copiedLinkCode ? (
                      <>
                        <Check className="size-3.5 text-primary-foreground" /> Copied Link
                      </>
                    ) : (
                      <>
                        <Link className="size-3.5" /> Copy Link
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Active Invites Section ── */}
        <div className="space-y-2 pt-1">
          <h4 className="text-xs font-semibold flex items-center justify-between text-foreground">
            <span className="flex items-center gap-1.5">
              <Shield className="size-3.5 text-muted-foreground" /> Active Invites
            </span>
            <span className="text-[11px] text-muted-foreground font-normal">
              {invites.length} active
            </span>
          </h4>

          {loadingData ? (
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between gap-2 rounded-lg border bg-muted/20 p-2 text-xs">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-24 rounded-md" />
                      <Skeleton className="h-3.5 w-12 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-36 rounded-md" />
                  </div>
                  <Skeleton className="h-7 w-14 rounded-md" />
                </div>
              ))}
            </div>
          ) : invites.length === 0 ? (
            <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground/70">
              No active invite codes. Generate one above.
            </div>
          ) : (
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {invites.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-2 rounded-lg border bg-muted/20 p-2 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold tracking-wider text-foreground">
                        {inv.code}
                      </span>
                      <span className="capitalize text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                        {inv.permission}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground flex gap-2">
                      <span>Expires: {formatExpiration(inv)}</span>
                      <span>•</span>
                      <span>
                        Uses: {inv.use_count} / {inv.max_uses ?? 'Unlimited'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => inv.code && handleCopyActiveLink(inv.id, inv.code)}
                      className="h-7 gap-1 text-[11px] font-medium px-2 text-foreground hover:bg-accent cursor-pointer"
                      title="Copy share link"
                    >
                      {copiedActiveLinkId === inv.id ? (
                        <>
                          <Check className="size-3 text-emerald-500" /> Copied
                        </>
                      ) : (
                        <>
                          <Link className="size-3 text-muted-foreground" /> Link
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(inv.id)}
                      className="h-7 text-[11px] text-destructive hover:bg-destructive/10 hover:text-destructive px-2 cursor-pointer"
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Board Members ("Shared With") Section ── */}
        <div className="space-y-2 pt-1 border-t">
          <h4 className="text-xs font-semibold flex items-center justify-between text-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5 text-muted-foreground" /> Shared With
            </span>
            <span className="text-[11px] text-muted-foreground font-normal">
              {members.length + 1} members
            </span>
          </h4>

          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {loadingData ? (
              <>
                <div className="flex items-center justify-between gap-2 rounded-lg border bg-accent/30 p-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Skeleton className="size-6 rounded-full shrink-0" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-3.5 w-24 rounded-md" />
                      <Skeleton className="h-2.5 w-32 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-12 rounded-md" />
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg border bg-background p-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Skeleton className="size-6 rounded-full shrink-0" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-3.5 w-28 rounded-md" />
                      <Skeleton className="h-2.5 w-36 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-md" />
                </div>
              </>
            ) : (
              <>
                {/* Owner Row */}
            <div className="flex items-center justify-between gap-2 rounded-lg border bg-accent/30 p-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  👑
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate font-medium text-foreground">
                    {board?.owner === user?.id ? `${user?.fullName || 'You'} (You)` : 'Board Owner'}
                  </span>
                  <span className="truncate text-[10px] text-muted-foreground">
                    {board?.owner === user?.id
                      ? user?.email
                      : board?.owner
                        ? `ID: ${board.owner.slice(0, 16)}...`
                        : ''}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-primary px-2 py-0.5 rounded-md bg-primary/10">
                Owner
              </span>
            </div>

            {/* Joined Members */}
            {members.map((mem) => {
              const isCurrentUser = mem.user_id === user?.id
              const memberEmail = isCurrentUser ? user?.email : mem.user_email || mem.email
              const memberName = isCurrentUser
                ? `${user?.fullName || 'You'} (You)`
                : mem.user_name ||
                  mem.full_name ||
                  (memberEmail ? memberEmail.split('@')[0] : 'Member')
              const displayEmail =
                memberEmail || (mem.user_id ? `ID: ${mem.user_id.slice(0, 16)}...` : '')

              return (
                <div
                  key={mem.id}
                  className="flex items-center justify-between gap-2 rounded-lg border bg-background p-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                      👤
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-medium text-foreground">{memberName}</span>
                      {displayEmail && (
                        <span className="truncate text-[10px] text-muted-foreground">
                          {displayEmail}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Select
                      value={mem.permission || 'view'}
                      onValueChange={(val: string) =>
                        handleMemberPermissionChange(mem.id, val as 'view' | 'edit')
                      }
                    >
                      <SelectTrigger className="h-6 w-auto min-w-16 rounded border bg-background px-1.5 text-[11px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="view">View</SelectItem>
                        <SelectItem value="edit">Edit</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(mem.id)}
                      className="h-6 size-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Remove access"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
