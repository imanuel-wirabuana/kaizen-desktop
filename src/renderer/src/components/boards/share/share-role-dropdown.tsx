import { ChevronDown, Check, Trash2, Eye, Pencil } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ShareRole } from './types'

type ShareRoleDropdownProps = {
  role: ShareRole
  onRoleChange: (newRole: ShareRole) => void
  onRemove: () => void
  canManage: boolean
  isRemoving?: boolean
}

export function ShareRoleDropdown({
  role,
  onRoleChange,
  onRemove,
  canManage,
  isRemoving = false
}: ShareRoleDropdownProps) {
  if (!canManage) {
    return (
      <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-1 text-xs font-medium capitalize text-muted-foreground">
        {role === 'edit' ? 'Editor' : 'Viewer'}
      </span>
    )
  }

  const roleLabel = role === 'edit' ? 'Editor' : 'Viewer'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            disabled={isRemoving}
            className="h-7 gap-1 px-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
          >
            <span>{roleLabel}</span>
            <ChevronDown className="size-3 opacity-60" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56 p-1">
        <DropdownMenuItem
          onClick={() => onRoleChange('view')}
          className="flex items-start gap-2.5 py-2 cursor-pointer"
        >
          <div className="flex size-4 items-center justify-center shrink-0 mt-0.5">
            {role === 'view' ? (
              <Check className="size-3.5 text-primary" />
            ) : (
              <Eye className="size-3.5 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">Viewer</span>
            <span className="text-[11px] text-muted-foreground">Can view boards and cards</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onRoleChange('edit')}
          className="flex items-start gap-2.5 py-2 cursor-pointer"
        >
          <div className="flex size-4 items-center justify-center shrink-0 mt-0.5">
            {role === 'edit' ? (
              <Check className="size-3.5 text-primary" />
            ) : (
              <Pencil className="size-3.5 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">Editor</span>
            <span className="text-[11px] text-muted-foreground">Can add, edit, and move cards</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuItem
          variant="destructive"
          onClick={onRemove}
          className="flex items-center gap-2.5 py-2 text-destructive cursor-pointer"
        >
          <Trash2 className="size-3.5" />
          <span className="font-medium">Remove access</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
