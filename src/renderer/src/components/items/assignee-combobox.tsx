import * as React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator
} from '@/components/ui/command'
import { UserPlus, Check, X, Crown } from 'lucide-react'
import { useBoardMembersQuery } from '@/queries/members'
import { useUser } from '@/providers/auth-provider'
import { useBoardsStore } from '@/stores/boards'
import { useItemsStore } from '@/stores/items'
import { cn } from '@/lib/utils'

export type AssigneeComboboxProps = {
  value?: string | null
  onChange: (assignee: string | null) => void
  boardId?: number | string | null
  placeholder?: string
  className?: string
  disabled?: boolean
}

export type MemberListItem = {
  id: string
  label: string
  cleanName: string
  email?: string
  isOwner?: boolean
  isMe?: boolean
}

export function AssigneeCombobox({
  value,
  onChange,
  boardId,
  placeholder = 'Assignee (optional)...',
  className,
  disabled = false
}: AssigneeComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  const { user } = useUser()
  const effectiveBoardId = boardId ?? useItemsStore.getState().boardId
  const { data: members = [] } = useBoardMembersQuery(effectiveBoardId ? String(effectiveBoardId) : '')
  const boards = useBoardsStore((s) => s.boards)

  const board = React.useMemo(() => {
    if (!effectiveBoardId) return null
    return boards.find((b) => String(b.id) === String(effectiveBoardId)) || null
  }, [boards, effectiveBoardId])

  // Build members list with Board Owner first, Current User, and Board Members
  const memberList = React.useMemo(() => {
    const list: MemberListItem[] = []
    const seen = new Set<string>()

    const isCurrentUserId = (id?: string | null) => Boolean(user?.id && id && user.id === id)
    const isCurrentUserEmail = (email?: string | null) =>
      Boolean(user?.email && email && user.email.toLowerCase() === email.toLowerCase())

    // 1. Board Owner first (always include owner)
    if (board) {
      const ownerInfo = board.owner_info
      const isOwnerMe =
        isCurrentUserId(board.owner) ||
        isCurrentUserId(ownerInfo?.id) ||
        isCurrentUserEmail(ownerInfo?.email) ||
        board.role === 'owner'

      const rawOwnerName =
        ownerInfo?.name ||
        (isOwnerMe
          ? user?.fullName || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0]
          : null) ||
        (ownerInfo?.email ? ownerInfo.email.split('@')[0] : null) ||
        'Board Owner'

      const ownerEmail = ownerInfo?.email || (isOwnerMe ? user?.email : undefined) || undefined
      const ownerLabel = isOwnerMe ? `${rawOwnerName} (Me, Owner)` : `${rawOwnerName} (Owner)`

      const keyName = rawOwnerName.toLowerCase()
      seen.add(keyName)
      if (ownerEmail) seen.add(ownerEmail.toLowerCase())

      list.push({
        id: ownerInfo?.id || board.owner || (isOwnerMe ? user?.id || 'owner' : 'owner'),
        label: ownerLabel,
        cleanName: rawOwnerName,
        email: ownerEmail,
        isOwner: true,
        isMe: isOwnerMe
      })
    }

    // 2. Current User (if not already added as Owner)
    if (user?.email) {
      const userLabel =
        user.fullName || user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0]
      const keyName = userLabel.toLowerCase()
      const keyEmail = user.email.toLowerCase()

      if (!seen.has(keyName) && !seen.has(keyEmail)) {
        seen.add(keyName)
        seen.add(keyEmail)
        list.push({
          id: user.id,
          label: `${userLabel} (Me)`,
          cleanName: userLabel,
          email: user.email,
          isOwner: false,
          isMe: true
        })
      }
    }

    // 3. Board Collaborators
    for (const m of members) {
      const rawName = m.user_name || m.user_email || `Member ${m.id}`
      const keyName = rawName.toLowerCase()
      const keyEmail = m.user_email ? m.user_email.toLowerCase() : null

      if (!seen.has(keyName) && (!keyEmail || !seen.has(keyEmail))) {
        seen.add(keyName)
        if (keyEmail) seen.add(keyEmail)
        list.push({
          id: String(m.id),
          label: rawName,
          cleanName: rawName,
          email: m.user_email || undefined,
          isOwner: false,
          isMe: false
        })
      }
    }

    return list
  }, [board, members, user])

  const handleSelect = (selectedItem: MemberListItem | string | null) => {
    if (!selectedItem) {
      onChange(null)
    } else if (typeof selectedItem === 'string') {
      const clean = selectedItem.replace(/\s*\((Me,\s*Owner|Me|Owner)\)$/i, '').trim()
      onChange(clean || selectedItem)
    } else {
      onChange(selectedItem.cleanName)
    }
    setOpen(false)
    setSearch('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }

  const hasExactMatch = React.useMemo(() => {
    if (!search.trim()) return true
    const term = search.trim().toLowerCase()
    return memberList.some(
      (m) =>
        m.label.toLowerCase() === term ||
        m.cleanName.toLowerCase() === term ||
        m.email?.toLowerCase() === term
    )
  }, [search, memberList])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              'flex items-center justify-between text-left font-normal h-7 text-xs px-2.5 rounded-md border border-border/70 bg-transparent hover:bg-muted/40 hover:border-border/80 transition-colors shadow-none group/combobox cursor-pointer w-full',
              !value && 'text-muted-foreground',
              value && 'text-foreground font-medium border-primary/40',
              className
            )}
          >
            <div className="flex items-center gap-1.5 truncate">
              {value ? (
                <div className="size-4 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 text-[9px] font-bold">
                  {value.charAt(0).toUpperCase()}
                </div>
              ) : (
                <UserPlus className="size-3.5 text-muted-foreground shrink-0" />
              )}
              <span className="truncate">{value || placeholder}</span>
            </div>
            {value && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="size-3.5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted ml-1 transition-colors"
                title="Unassign"
              >
                <X className="size-2.5" />
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent
        align="start"
        side="bottom"
        className="w-[230px] p-0 shadow-2xl rounded-xl border border-border/80 overflow-hidden text-xs"
      >
        <Command>
          <CommandInput
            placeholder="Search or type name..."
            value={search}
            onValueChange={setSearch}
            className="h-7 text-[11px] px-2"
          />
          <CommandList className="max-h-52 p-0.5 text-[11px]">
            <CommandEmpty className="py-1.5 px-2 text-[10.5px] text-muted-foreground">
              {search.trim() ? (
                <div
                  role="button"
                  onClick={() => handleSelect(search.trim())}
                  className="flex items-center gap-1.5 p-1 rounded-md hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors"
                >
                  <UserPlus className="size-3 text-primary shrink-0" />
                  <span className="truncate">Assign to "{search.trim()}"</span>
                </div>
              ) : (
                'No members found'
              )}
            </CommandEmpty>

            {/* Unassign Option */}
            <CommandGroup>
              <CommandItem
                onSelect={() => handleSelect(null)}
                className="flex items-center justify-between text-[11px] cursor-pointer py-1 px-1.5 rounded-md gap-1.5"
              >
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <X className="size-2.5" />
                  <span>Unassigned</span>
                </div>
                {!value && <Check className="size-2.5 text-primary" />}
              </CommandItem>
            </CommandGroup>

            <CommandSeparator className="my-0.5" />

            {/* Board Members & Owner Group */}
            {memberList.length > 0 && (
              <CommandGroup
                heading="Board Members & Owner"
                className="[&_[cmdk-group-heading]]:text-[9.5px] [&_[cmdk-group-heading]]:px-1.5 [&_[cmdk-group-heading]]:py-0.5 [&_[cmdk-group-heading]]:text-muted-foreground/70"
              >
                {memberList.map((m) => {
                  const isSelected = Boolean(
                    value &&
                      (value === m.label ||
                        value === m.cleanName ||
                        value === m.email ||
                        (m.cleanName && value.toLowerCase() === m.cleanName.toLowerCase()))
                  )

                  return (
                    <CommandItem
                      key={m.id}
                      onSelect={() => handleSelect(m)}
                      className="flex items-center justify-between text-[11px] cursor-pointer py-1.5 px-1.5 rounded-md gap-1.5"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <div
                          className={cn(
                            'size-4 rounded-full flex items-center justify-center shrink-0 text-[8px] font-bold border',
                            m.isOwner
                              ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                              : 'bg-muted text-muted-foreground border-border/60'
                          )}
                        >
                          {m.cleanName.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="truncate font-medium">{m.cleanName}</span>
                            {m.isOwner && (
                              <span className="inline-flex items-center gap-0.5 text-[8.5px] font-semibold text-amber-500 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/25 shrink-0 leading-tight">
                                <Crown className="size-2" />
                                Owner
                              </span>
                            )}
                            {m.isMe && (
                              <span className="text-[8.5px] font-medium text-primary bg-primary/10 px-1 py-0.2 rounded border border-primary/20 shrink-0 leading-tight">
                                Me
                              </span>
                            )}
                          </div>
                          {m.email && m.cleanName !== m.email && (
                            <span className="text-[9.5px] text-muted-foreground truncate leading-tight">
                              {m.email}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check className="size-2.5 text-primary shrink-0 ml-1" />}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {/* Custom Assignee Option if typed name is not an exact match */}
            {search.trim() && !hasExactMatch && (
              <>
                <CommandSeparator className="my-0.5" />
                <CommandGroup
                  heading="Custom Assignee"
                  className="[&_[cmdk-group-heading]]:text-[9.5px] [&_[cmdk-group-heading]]:px-1.5 [&_[cmdk-group-heading]]:py-0.5 [&_[cmdk-group-heading]]:text-muted-foreground/70"
                >
                  <CommandItem
                    onSelect={() => handleSelect(search.trim())}
                    className="flex items-center gap-1.5 text-[11px] cursor-pointer py-1 px-1.5 rounded-md text-primary font-medium"
                  >
                    <UserPlus className="size-3 shrink-0" />
                    <span className="truncate">Assign to "{search.trim()}"</span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
