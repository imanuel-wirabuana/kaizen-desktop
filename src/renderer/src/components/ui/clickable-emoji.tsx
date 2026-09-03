import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { EmojiPicker, EmojiPickerSearch, EmojiPickerContent } from '@/components/ui/emoji-picker'
import { cn } from '@/lib/utils'

export type ClickableEmojiProps = {
  emoji?: string | null
  fallback?: string
  onEmojiSelect: (emoji: string) => void
  disabled?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_VARIANTS = {
  xs: 'size-5 text-xs',
  sm: 'size-6 text-sm',
  md: 'size-7 text-base',
  lg: 'size-8 text-lg'
}

export function ClickableEmoji({
  emoji,
  fallback = '📋',
  onEmojiSelect,
  disabled = false,
  size = 'md',
  className
}: ClickableEmojiProps) {
  const [open, setOpen] = useState(false)
  const displayEmoji = emoji || fallback

  if (disabled) {
    return (
      <span className={cn('inline-flex items-center justify-center shrink-0 select-none', className)}>
        {displayEmoji}
      </span>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              setOpen((prev) => !prev)
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className={cn(
              'group/emoji inline-flex items-center justify-center rounded-lg border bg-background/80 transition-all cursor-pointer hover:bg-accent hover:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary shrink-0 select-none',
              SIZE_VARIANTS[size],
              className
            )}
            title="Click to change emoji"
          >
            <span className="transition-transform group-hover/emoji:scale-115">
              {displayEmoji}
            </span>
          </button>
        }
      />
      <PopoverContent
        align="start"
        className="w-[300px] border-none bg-transparent p-0 shadow-none z-50"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <EmojiPicker
          className="h-[300px] w-full rounded-lg border bg-popover shadow-xl"
          onEmojiSelect={({ emoji: selectedEmoji }) => {
            onEmojiSelect(selectedEmoji)
            setOpen(false)
          }}
        >
          <EmojiPickerSearch />
          <EmojiPickerContent />
        </EmojiPicker>
      </PopoverContent>
    </Popover>
  )
}
