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
import { User, UserPlus, Check, X, UserCheck } from 'lucide-react'
import { useBoardMembersQuery } from '@/queries/members'
import { useUser } from '@/providers/auth-provider'
import { cn } from '@/lib/utils'

export type AssigneeComboboxProps = {
  value?: string | null
  onChange: (assignee: string | null) => void
  boardId?: number | string | null
  placeholder?: string
  className?: string
  disabled?: boolean
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
  const { data: members = [] } = useBoardMembersQuery(boardId ? String(boardId) : '')

  // Build members list with unique display names/emails
  const memberList = React.useMemo(() => {
    const list: { id: string; label: string; email?: string }[] = []
    const seen = new Set<string>()

    // Current user first
    if (user?.email) {
      const userLabel = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0]
      seen.add(userLabel.toLowerCase())
      if (user.email) seen.add(user.email.toLowerCase())
      list.push({
        id: user.id,
        label: `${userLabel} (Me)`,
        email: user.email
      })
    }

    // Board members
    for (const m of members) {
      const label = m.user_name || m.user_email || `Member ${m.id}`
      const key = label.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        if (m.user_email) seen.add(m.user_email.toLowerCase())
        list.push({
          id: String(m.id),
          label: m.user_name || m.user_email || 'Member',
          email: m.user_email || undefined
        })
      }
    }

    return list
  }, [members, user])

  const handleSelect = (selectedName: string | null) => {
    onChange(selectedName)
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
    return memberList.some((m) => m.label.toLowerCase() === term || m.email?.toLowerCase() === term)
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
              'flex items-center justify-between text-left font-normal h-8 text-xs px-2.5 rounded-lg border-border/80 bg-background hover:bg-muted/60 transition-colors shadow-2xs group/combobox cursor-pointer',
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
                className="size-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted ml-1 transition-colors"
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
        className="w-[230px] p-0 shadow-2xl rounded-xl border border-border/80 overflow-hidden"
      >
        <Command>
          <CommandInput
            placeholder="Search or type name..."
            value={search}
            onValueChange={setSearch}
            className="h-8 text-xs"
          />
          <CommandList className="max-h-56 p-1 text-xs">
            <CommandEmpty className="py-2 px-3 text-xs text-muted-foreground">
              {search.trim() ? (
                <div
                  role="button"
                  onClick={() => handleSelect(search.trim())}
                  className="flex items-center gap-2 p-1.5 rounded-md hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors"
                >
                  <UserPlus className="size-3.5 text-primary" />
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
                className="flex items-center justify-between text-xs cursor-pointer py-1.5 px-2 rounded-md"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <X className="size-3" />
                  <span>Unassigned</span>
                </div>
                {!value && <Check className="size-3 text-primary" />}
              </CommandItem>
            </CommandGroup>

            <CommandSeparator className="my-1" />

            {/* Board Members Group */}
            {memberList.length > 0 && (
              <CommandGroup heading="Board Members">
                {memberList.map((m) => {
                  const isSelected =
                    value === m.label ||
                    (m.label.endsWith(' (Me)') && value === m.label.replace(' (Me)', '')) ||
                    value === m.email

                  return (
                    <CommandItem
                      key={m.id}
                      onSelect={() => {
                        // If it's Me, save the clean name without (Me)
                        const cleanName = m.label.endsWith(' (Me)')
                          ? m.label.replace(' (Me)', '')
                          : m.label
                        handleSelect(cleanName)
                      }}
                      className="flex items-center justify-between text-xs cursor-pointer py-1.5 px-2 rounded-md"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="size-5 rounded-full bg-muted flex items-center justify-center shrink-0 text-[9px] font-bold text-muted-foreground border border-border/60">
                          {m.label.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate flex flex-col">
                          <span className="truncate font-medium">{m.label}</span>
                          {m.email && m.label !== m.email && (
                            <span className="text-[10px] text-muted-foreground truncate leading-tight">
                              {m.email}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check className="size-3 text-primary shrink-0 ml-1" />}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {/* Custom Assignee Option if typed name is not an exact match */}
            {search.trim() && !hasExactMatch && (
              <>
                <CommandSeparator className="my-1" />
                <CommandGroup heading="Custom Assignee">
                  <CommandItem
                    onSelect={() => handleSelect(search.trim())}
                    className="flex items-center gap-2 text-xs cursor-pointer py-1.5 px-2 rounded-md text-primary font-medium"
                  >
                    <UserPlus className="size-3.5 shrink-0" />
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
