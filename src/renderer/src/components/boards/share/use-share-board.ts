import { useState, useEffect, useMemo, useCallback } from 'react'
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
import { useBoardsStore } from '@/stores/boards'
import { supabase } from '@/lib/supabase'
import { broadcastSyncEvent, onSyncEvent } from '@/lib/realtime'
import { getShareUrl } from './utils'
import { ShareRole, PermissionRole } from './types'

export function useShareBoard(
  board: Board | null,
  open: boolean,
  permissionRoleProp?: PermissionRole
) {
  const { user } = useUser()

  const [permission, setPermission] = useState<ShareRole>('view')
  const [expiresOption, setExpiresOption] = useState<ExpirationOption>('7_days')
  const [maxUsesOption, setMaxUsesOption] = useState<MaxUsesOption>('unlimited')

  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLinkCode, setCopiedLinkCode] = useState(false)
  const [copiedActiveLinkId, setCopiedActiveLinkId] = useState<number | null>(null)
  const [copiedFooterLink, setCopiedFooterLink] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const [invites, setInvites] = useState<BoardInvite[]>([])
  const [members, setMembers] = useState<BoardMember[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchInvitesAndMembers = useCallback(async () => {
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
  }, [board?.id])

  useEffect(() => {
    if (open && board?.id) {
      const boardId = board.id
      setGeneratedCode(null)
      setSearchQuery('')
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
  }, [open, board?.id, fetchInvitesAndMembers])

  // Derive effective role prioritizing actual database membership over in-flight defaults
  const effectiveRole = useMemo<PermissionRole>(() => {
    // 1. Explicit board owner
    if (user?.id && board?.owner === user.id) return 'owner'
    if (board && !board.owner) return 'owner'

    // 2. Direct database member record from loaded members (authoritative ground truth!)
    if (user?.id && members.length > 0) {
      const myMembership = members.find((m) => String(m.user_id) === String(user.id))
      if (myMembership?.permission === 'edit') return 'edit'
      if (myMembership?.permission === 'view') return 'view'
      if (myMembership?.permission === 'owner') return 'owner'
    }

    // 3. Explicit prop passed from caller
    if (permissionRoleProp) return permissionRoleProp

    // 4. Role directly on board object
    if (board?.role) return board.role

    // 5. Look in boards store
    if (board?.id !== undefined) {
      const fromStore = useBoardsStore.getState().boards.find((b) => String(b.id) === String(board.id))
      if (fromStore?.role) return fromStore.role
    }

    return 'view'
  }, [permissionRoleProp, user?.id, board?.owner, board?.role, board?.id, board, members])

  const isOwner = effectiveRole === 'owner'
  const isEditor = effectiveRole === 'edit'
  const isReadOnly = effectiveRole === 'view'
  const canManageInvites = isOwner || isEditor
  const canManageOtherMembers = isOwner || isEditor

  const handleGenerate = async () => {
    if (isReadOnly || !board?.id || !user?.id) return null
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
        return newInvite
      }
    } catch (err) {
      console.error('Failed to generate invite code:', err)
    } finally {
      setIsGenerating(false)
    }
    return null
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
    if (isReadOnly) return
    const ok = await revokeInvite(inviteId)
    if (ok) {
      setInvites((prev) => prev.filter((i) => i.id !== inviteId))
    }
  }

  const handleMemberPermissionChange = async (memberId: number, newPerm: ShareRole) => {
    if (isReadOnly) return
    const target = members.find((m) => m.id === memberId)
    if (!target) return
    // Editors cannot modify their own permission or the board owner
    if (isEditor && user?.id && String(target.user_id) === String(user.id)) return
    if (isEditor && board?.owner && String(target.user_id) === String(board.owner)) return

    const ok = await updateMemberPermission(memberId, newPerm)
    if (ok) {
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, permission: newPerm } : m)))
      broadcastSyncEvent('members', { boardId: board?.id })
      broadcastSyncEvent('boards')
    }
  }

  const handleRemoveMember = async (memberId: number) => {
    if (isReadOnly) return
    const target = members.find((m) => m.id === memberId)
    if (!target) return
    // Editors cannot remove themselves or the board owner
    if (isEditor && user?.id && String(target.user_id) === String(user.id)) return
    if (isEditor && board?.owner && String(target.user_id) === String(board.owner)) return

    const ok = await removeMember(memberId)
    if (ok) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
      broadcastSyncEvent('members', { boardId: board?.id })
      broadcastSyncEvent('boards')
    }
  }

  const handleCopyPrimaryLink = async () => {
    const firstActive = invites[0]
    if (firstActive?.code) {
      navigator.clipboard.writeText(getShareUrl(firstActive.code))
      setCopiedFooterLink(true)
      setTimeout(() => setCopiedFooterLink(false), 2000)
      return
    }

    // Viewers cannot generate new invites
    if (isReadOnly) return

    // Auto-generate if no active invite exists and user is owner/editor
    const created = await handleGenerate()
    if (created?.code) {
      navigator.clipboard.writeText(getShareUrl(created.code))
      setCopiedFooterLink(true)
      setTimeout(() => setCopiedFooterLink(false), 2000)
    }
  }

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members
    const q = searchQuery.toLowerCase().trim()
    return members.filter((m) => {
      const name = (m.user_name || m.full_name || '').toLowerCase()
      const email = (m.user_email || m.email || '').toLowerCase()
      return name.includes(q) || email.includes(q)
    })
  }, [members, searchQuery])

  return {
    user,
    effectiveRole,
    isOwner,
    isEditor,
    isReadOnly,
    canManageInvites,
    canManageOtherMembers,
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
  }
}
