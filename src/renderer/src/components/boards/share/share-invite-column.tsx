import { KeyRound, Loader2, Copy, Check, Link, Globe, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatExpiration } from './utils'
import {
  ShareRole,
  ExpirationOption,
  MaxUsesOption,
  ROLE_OPTIONS,
  EXPIRES_OPTIONS,
  MAX_USES_OPTIONS
} from './types'

type ShareInviteColumnProps = {
  permission: ShareRole
  setPermission: (role: ShareRole) => void
  expiresOption: ExpirationOption
  setExpiresOption: (opt: ExpirationOption) => void
  maxUsesOption: MaxUsesOption
  setMaxUsesOption: (opt: MaxUsesOption) => void
  generatedCode: string | null
  copiedCode: boolean
  copiedLinkCode: boolean
  copiedActiveLinkId: number | null
  isGenerating: boolean
  invites: BoardInvite[]
  loadingData: boolean
  handleGenerate: () => void
  handleCopy: (code: string) => void
  handleCopyLink: (code: string) => void
  handleCopyActiveLink: (inviteId: number, code: string) => void
  handleRevoke: (inviteId: number) => void
}

export function ShareInviteColumn({
  permission,
  setPermission,
  expiresOption,
  setExpiresOption,
  maxUsesOption,
  setMaxUsesOption,
  generatedCode,
  copiedCode,
  copiedLinkCode,
  copiedActiveLinkId,
  isGenerating,
  invites,
  loadingData,
  handleGenerate,
  handleCopy,
  handleCopyLink,
  handleCopyActiveLink,
  handleRevoke
}: ShareInviteColumnProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden p-4 sm:p-5 space-y-4">
      {/* Column Header: Google Drive General Access */}
      <div className="flex items-start gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
          <Globe className="size-4" />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-foreground">General Access & Invite Links</h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Generate temporary invite codes or shareable links for your team.
          </p>
        </div>
      </div>

      {/* Generator Form Card */}
      <div className="rounded-xl border bg-card/80 p-3.5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <KeyRound className="size-3.5 text-muted-foreground" />
            Create Invite Link
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          {/* Permission */}
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Role</label>
            <Select
              items={ROLE_OPTIONS}
              value={permission}
              onValueChange={(val: string) => setPermission(val as ShareRole)}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue>
                  {(val) => ROLE_OPTIONS.find((o) => o.value === val)?.label ?? val}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Expires */}
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Expires</label>
            <Select
              items={EXPIRES_OPTIONS}
              value={expiresOption}
              onValueChange={(val: string) => setExpiresOption(val as ExpirationOption)}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue>
                  {(val) => EXPIRES_OPTIONS.find((o) => o.value === val)?.label ?? val}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {EXPIRES_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Max uses */}
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Max uses</label>
            <Select
              items={MAX_USES_OPTIONS}
              value={maxUsesOption}
              onValueChange={(val: string) => setMaxUsesOption(val as MaxUsesOption)}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue>
                  {(val) => MAX_USES_OPTIONS.find((o) => o.value === val)?.label ?? val}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MAX_USES_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          size="sm"
          className="w-full h-8 text-xs font-semibold gap-1.5 cursor-pointer"
        >
          {isGenerating ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> Generating...
            </>
          ) : (
            'Generate Code & Link'
          )}
        </Button>

        {/* Recently Generated Code Display */}
        {generatedCode && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                Invite Code Generated
              </span>
            </div>
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
                      <Check className="size-3 text-emerald-500" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" /> Code
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
                      <Check className="size-3 text-primary-foreground" /> Copied
                    </>
                  ) : (
                    <>
                      <Link className="size-3" /> Link
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Invites List */}
      <div className="flex flex-col flex-1 min-h-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Shield className="size-3.5 text-muted-foreground" /> Active Invites
          </span>
          <span className="text-[11px] text-muted-foreground">
            {invites.length} active
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-28 max-h-52">
          {loadingData ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between gap-2 rounded-lg border bg-muted/20 p-2.5 text-xs">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-3 w-36 rounded-md" />
                  </div>
                  <Skeleton className="h-7 w-16 rounded-md" />
                </div>
              ))}
            </div>
          ) : invites.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground/70 h-full min-h-28">
              <KeyRound className="size-6 text-muted-foreground/40 mb-1.5" />
              <p className="font-medium text-foreground/80">No active invite codes</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Generate one above to invite teammates.
              </p>
            </div>
          ) : (
            invites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between gap-2 rounded-lg border bg-card/60 hover:bg-accent/40 transition-colors p-2.5 text-xs shadow-2xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold tracking-wider text-foreground">
                      {inv.code}
                    </span>
                    <span className="capitalize text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-medium">
                      {inv.permission === 'edit' ? 'Editor' : 'Viewer'}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                    <span>Expires: {formatExpiration(inv)}</span>
                    <span>•</span>
                    <span>
                      Uses: {inv.use_count} / {inv.max_uses ?? '∞'}
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
            ))
          )}
        </div>
      </div>
    </div>
  )
}
