import { useState, useEffect, useRef } from 'react'
import { Pencil, Loader2 } from 'lucide-react'
import { useBoardsStore } from '@/stores/boards'
import { cn } from '@/lib/utils'

export interface InlineEditBoardTitleProps {
  board: Board
  canEdit: boolean
  className?: string
}

export function InlineEditBoardTitle({
  board,
  canEdit,
  className
}: InlineEditBoardTitleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(board.title || '')
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const updateBoard = useBoardsStore((s) => s.updateBoard)

  // Keep local title in sync with external board title changes when not actively editing
  useEffect(() => {
    if (!isEditing) {
      setTitle(board.title || '')
    }
  }, [board.title, isEditing])

  // Focus and select title text when entering edit mode
  useEffect(() => {
    if (isEditing) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isEditing])

  const handleSave = async () => {
    if (!canEdit || board.id === undefined || isSaving) {
      setIsEditing(false)
      return
    }

    const trimmed = title.trim()
    if (!trimmed) {
      // Revert if empty
      setTitle(board.title || '')
      setIsEditing(false)
      return
    }

    if (trimmed === board.title) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await updateBoard(board.id, { title: trimmed })
    } catch (err) {
      console.error('Failed to update board title:', err)
      setTitle(board.title || '')
    } finally {
      setIsSaving(false)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setTitle(board.title || '')
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      handleCancel()
    }
  }

  if (isEditing && canEdit) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSave()
        }}
        className="flex items-center min-w-0 shrink-0"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.stopPropagation()}
      >
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            disabled={isSaving}
            className={cn(
              'h-7 text-xs sm:text-sm font-bold tracking-tight text-foreground bg-background',
              'px-2 py-0.5 rounded-md border border-primary/50 focus:outline-none focus:ring-1.5 focus:ring-primary/40',
              'shadow-2xs select-text w-[180px] sm:w-[260px] md:w-[320px] transition-all',
              isSaving && 'opacity-70 cursor-wait'
            )}
            placeholder="Board title..."
          />
          {isSaving && (
            <Loader2 className="size-3 animate-spin text-primary absolute right-2 pointer-events-none" />
          )}
        </div>
      </form>
    )
  }

  return (
    <div
      role={canEdit ? 'button' : undefined}
      tabIndex={canEdit ? 0 : undefined}
      onClick={() => {
        if (canEdit) setIsEditing(true)
      }}
      onKeyDown={(e) => {
        if (canEdit && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          setIsEditing(true)
        }
      }}
      className={cn(
        'group/title flex items-center gap-1.5 min-w-0 shrink-0 max-w-[240px] sm:max-w-[340px] md:max-w-[420px] rounded-md transition-all select-none',
        canEdit
          ? 'cursor-pointer hover:bg-muted/70 px-1.5 py-0.5 -mx-1.5 active:scale-[0.99]'
          : 'cursor-default',
        className
      )}
      title={canEdit ? 'Click to rename board' : undefined}
    >
      <h1 className="text-xs sm:text-sm font-bold tracking-tight text-foreground truncate">
        {board.title || 'Untitled Board'}
      </h1>
      {canEdit && (
        <Pencil className="size-2.5 text-muted-foreground/0 group-hover/title:text-muted-foreground/60 transition-opacity shrink-0" />
      )}
    </div>
  )
}
