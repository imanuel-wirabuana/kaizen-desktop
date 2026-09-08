import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InlineEmojiPicker } from '@/components/ui/emoji-picker'
import { useBoardFoldersStore, BoardFolder } from '@/stores/board-folders'
import { useUser } from '@/providers/auth-provider'
import { FolderIcon, AlertTriangle } from 'lucide-react'

export type FolderModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  folderToEdit?: BoardFolder | null
  onSuccess?: (folder: BoardFolder) => void
}

export function FolderModal({
  open,
  onOpenChange,
  folderToEdit,
  onSuccess
}: FolderModalProps) {
  const isEditing = !!folderToEdit
  const { user } = useUser()
  const createFolder = useBoardFoldersStore((s) => s.createFolder)
  const updateFolder = useBoardFoldersStore((s) => s.updateFolder)

  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📁')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (folderToEdit) {
        setName(folderToEdit.name)
        setIcon(folderToEdit.icon || '📁')
      } else {
        setName('')
        setIcon('📁')
      }
      setError(null)
    }
  }, [open, folderToEdit])

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Project name is required')
      return
    }

    if (isEditing && folderToEdit) {
      updateFolder(folderToEdit.id, {
        name: trimmed,
        icon
      })
      onOpenChange(false)
      if (onSuccess) {
        onSuccess({
          ...folderToEdit,
          name: trimmed,
          icon
        })
      }
    } else {
      const created = createFolder(trimmed, icon, undefined, user?.id || null)
      onOpenChange(false)
      if (onSuccess) {
        onSuccess(created)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg text-sm bg-muted/60">
              {icon || <FolderIcon className="size-4" />}
            </span>
            <span>{isEditing ? 'Edit Project' : 'New Project'}</span>
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the project title or icon.'
              : 'Group and organize your boards into a project.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Project Name</label>
            <div className="flex items-center gap-2">
              <InlineEmojiPicker
                value={icon}
                onChange={(emoji) => setIcon(emoji)}
                align="start"
                side="bottom"
                title="Choose Emoji"
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="size-8 shrink-0 p-0 text-lg cursor-pointer"
                    title="Choose Emoji"
                  >
                    {icon}
                  </Button>
                }
              />

              <Input
                placeholder="e.g. Work, Personal, Marketing..."
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (error) setError(null)
                }}
                autoFocus
                className="h-8 text-xs font-medium flex-1"
              />
            </div>
            {error && <p className="text-[11px] text-destructive">{error}</p>}
          </div>

          <DialogFooter className="pt-2">
            <DialogClose render={<Button type="button" variant="outline" size="sm">Cancel</Button>} />
            <Button type="submit" size="sm" className="cursor-pointer">
              {isEditing ? 'Save Changes' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export type DeleteFolderDialogProps = {
  folder: BoardFolder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteFolderDialog({
  folder,
  open,
  onOpenChange,
  onSuccess
}: DeleteFolderDialogProps) {
  const deleteFolder = useBoardFoldersStore((s) => s.deleteFolder)

  const handleDelete = () => {
    if (!folder) return
    deleteFolder(folder.id)
    onOpenChange(false)
    if (onSuccess) onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <DialogTitle>Delete Project</DialogTitle>
          </div>
          <DialogDescription className="space-y-2 pt-2">
            <span>
              Are you sure you want to delete project{' '}
              <span className="font-semibold text-foreground">
                {folder?.icon} {folder?.name}
              </span>
              ?
            </span>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-[11px] text-foreground/80 leading-relaxed">
              💡 <strong>Don&apos;t worry:</strong> Any boards organized in this project will{' '}
              <strong>not</strong> be deleted. They will automatically be moved back to{' '}
              <strong>My Boards</strong> or <strong>Shared Boards</strong>.
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-2">
          <DialogClose render={<Button type="button" variant="outline" size="sm">Cancel</Button>} />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="cursor-pointer"
          >
            Delete Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
