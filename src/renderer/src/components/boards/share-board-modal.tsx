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
  ExpirationOption,
  MaxUsesOption
} from '@/services/invites'
import {
  getBoardMembers,
  updateMemberPermission,
  removeMember
} from '@/services/members'
import { useUser } from '@clerk/clerk-react'
import {
  Copy,
  Check,
  Share2,
  Trash2,
  Users,
  KeyRound,
  Shield,
  Loader2
} from 'lucide-react'

type ShareBoardModalProps = {
  board: Board | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareBoardModal({ board, open, onOpenChange }: ShareBoardModalProps) {
  const { user } = useUser()

  const [permission, setPermission] = useState<'view' | 'edit'>('view')
  const [expiresOption, setExpiresOption] = useState<ExpirationOption>('7_days')
  const [maxUsesOption, setMaxUsesOption] = useState<MaxUsesOption>('unlimited')

  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
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
      setGeneratedCode(null)
      fetchInvitesAndMembers()
    }
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

  const handleRevoke = async (inviteId: number) => {
    const ok = await revokeInvite(inviteId)
    if (ok) {
      setInvites((prev) => prev.filter((i) => i.id !== inviteId))
    }
  }

  const handleMemberPermissionChange = async (
    memberId: number,
    newPerm: 'view' | 'edit'
  ) => {
    const ok = await updateMemberPermission(memberId, newPerm)
    if (ok) {
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, permission: newPerm } : m))
      )
    }
  }

  const handleRemoveMember = async (memberId: number) => {
    const ok = await removeMember(memberId)
    if (ok) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
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
            Invite teammates to <span className="font-semibold text-foreground">{board?.title}</span> using temporary invite codes.
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
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
                className="w-full h-8 rounded-lg border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="view">View</option>
                <option value="edit">Edit</option>
              </select>
            </div>

            {/* Expires Selector */}
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium">Expires:</label>
              <select
                value={expiresOption}
                onChange={(e) => setExpiresOption(e.target.value as ExpirationOption)}
                className="w-full h-8 rounded-lg border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="never">Never</option>
                <option value="1_hour">1 hour</option>
                <option value="1_day">1 day</option>
                <option value="7_days">7 days</option>
                <option value="30_days">30 days</option>
              </select>
            </div>

            {/* Maximum Uses Selector */}
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium">Maximum uses:</label>
              <select
                value={maxUsesOption}
                onChange={(e) => setMaxUsesOption(e.target.value as MaxUsesOption)}
                className="w-full h-8 rounded-lg border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="unlimited">Unlimited</option>
                <option value="1">1 use</option>
                <option value="5">5 uses</option>
                <option value="10">10 uses</option>
              </select>
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(generatedCode)}
                  className="h-7 gap-1 text-xs font-medium cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="size-3.5 text-emerald-500" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" /> Copy Code
                    </>
                  )}
                </Button>
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
            <div className="p-3 text-center text-xs text-muted-foreground">Loading invites...</div>
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

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(inv.id)}
                    className="h-7 text-[11px] text-destructive hover:bg-destructive/10 hover:text-destructive px-2"
                  >
                    Revoke
                  </Button>
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
            {/* Owner Row */}
            <div className="flex items-center justify-between gap-2 rounded-lg border bg-accent/30 p-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  👑
                </div>
                <span className="truncate font-medium text-foreground">
                  {board?.owner === user?.id ? 'You (Owner)' : board?.owner || 'Owner'}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-primary px-2 py-0.5 rounded-md bg-primary/10">
                Owner
              </span>
            </div>

            {/* Joined Members */}
            {members.map((mem) => (
              <div
                key={mem.id}
                className="flex items-center justify-between gap-2 rounded-lg border bg-background p-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                    👤
                  </div>
                  <span className="truncate font-medium text-foreground">
                    {mem.user_id === user?.id ? `${mem.user_id} (You)` : mem.user_id}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={mem.permission || 'view'}
                    onChange={(e) =>
                      handleMemberPermissionChange(mem.id, e.target.value as 'view' | 'edit')
                    }
                    className="h-6 rounded border bg-background px-1.5 text-[11px] capitalize focus:outline-none"
                  >
                    <option value="view">View</option>
                    <option value="edit">Edit</option>
                  </select>

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
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
