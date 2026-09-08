import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Share2, Link, Check } from 'lucide-react'
import {
  ShareBoardModalProps,
  useShareBoard,
  ShareInviteColumn,
  ShareMembersColumn
} from './share'

export function ShareBoardModal({ board, open, onOpenChange }: ShareBoardModalProps) {
  const {
    user,
    isOwner,
    canManageMembers,
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
    copiedFooterLink,
    isGenerating,
    invites,
    members,
    filteredMembers,
    loadingData,
    searchQuery,
    setSearchQuery,
    handleGenerate,
    handleCopy,
    handleCopyLink,
    handleCopyActiveLink,
    handleCopyPrimaryLink,
    handleRevoke,
    handleMemberPermissionChange,
    handleRemoveMember
  } = useShareBoard(board, open)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl w-[95vw] lg:w-[860px] h-[580px] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col rounded-2xl border bg-card shadow-2xl">
        {/* ── Dialog Header (Google Drive Inspired) ── */}
        <DialogHeader className="px-5 py-3.5 border-b flex flex-row items-center gap-3 shrink-0 bg-card pr-10">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Share2 className="size-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <DialogTitle className="text-sm font-semibold truncate">
              Share &ldquo;{board?.title || 'Board'}&rdquo;
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground truncate">
              Manage invite links, access permissions, and collaborator roles.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* ── 2 Columns Body: Left for Code & Invites, Right for Members ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x overflow-hidden flex-1 min-h-0 bg-background/50">
          {/* Left Column: Code & Invite Links */}
          <ShareInviteColumn
            permission={permission}
            setPermission={setPermission}
            expiresOption={expiresOption}
            setExpiresOption={setExpiresOption}
            maxUsesOption={maxUsesOption}
            setMaxUsesOption={setMaxUsesOption}
            generatedCode={generatedCode}
            copiedCode={copiedCode}
            copiedLinkCode={copiedLinkCode}
            copiedActiveLinkId={copiedActiveLinkId}
            isGenerating={isGenerating}
            invites={invites}
            loadingData={loadingData}
            handleGenerate={handleGenerate}
            handleCopy={handleCopy}
            handleCopyLink={handleCopyLink}
            handleCopyActiveLink={handleCopyActiveLink}
            handleRevoke={handleRevoke}
          />

          {/* Right Column: Member List */}
          <ShareMembersColumn
            board={board}
            user={user}
            isOwner={isOwner}
            canManageMembers={canManageMembers}
            members={members}
            filteredMembers={filteredMembers}
            loadingData={loadingData}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleMemberPermissionChange={handleMemberPermissionChange}
            handleRemoveMember={handleRemoveMember}
          />
        </div>

        {/* ── Dialog Footer (Google Drive Inspired) ── */}
        <div className="px-5 py-3 border-t bg-card flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyPrimaryLink}
              className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
            >
              {copiedFooterLink ? (
                <>
                  <Check className="size-3.5 text-emerald-500" />
                  <span>Link copied</span>
                </>
              ) : (
                <>
                  <Link className="size-3.5 text-muted-foreground" />
                  <span>Copy link</span>
                </>
              )}
            </Button>
            <span className="hidden sm:inline-block text-[11px] text-muted-foreground">
              {invites.length > 0
                ? 'Copies the active invite link'
                : 'Generates and copies a share link'}
            </span>
          </div>

          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 px-4 text-xs font-semibold cursor-pointer"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
