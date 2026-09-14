import { useState, useEffect, useRef, useCallback } from 'react'
import {
  X,
  Check,
  Loader2,
  Smile,
  PanelBottom,
  PanelRight,
  Maximize2,
  Palette
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InlineEmojiPicker } from '@/components/ui/emoji-picker'
import { BackgroundPicker } from '@/components/ui/background-picker'
import { useItemsStore } from '@/stores/items'
import { useLanesStore } from '@/stores/lanes'
import { useItemDetailStore } from '@/stores/item-detail'
import { useNavigationStore } from '@/stores/navigation'
import { getBoardBackgroundStyleAndClass } from '@/lib/board-utils'
import { ItemPropertiesSection } from './item-properties-section'
import { NotionEditor } from './notion-editor'
import { cn } from '@/lib/utils'

export interface ItemDetailPanelProps {
  itemId: number | string
  boardId: number | string
  readOnly?: boolean
  onClose: () => void
}

type SaveStatus = 'idle' | 'saving' | 'saved'

export function ItemDetailPanel({
  itemId,
  boardId,
  readOnly = false,
  onClose
}: ItemDetailPanelProps) {
  const item = useItemsStore((s) => s.items.find((i) => String(i.id) === String(itemId)))
  const updateItem = useItemsStore((s) => s.updateItem)
  const lanes = useLanesStore((s) => s.lanes)

  const orientation = useItemDetailStore((s) => s.orientation)
  const toggleOrientation = useItemDetailStore((s) => s.toggleOrientation)
  const navigate = useNavigationStore((s) => s.navigate)

  const [title, setTitle] = useState(item?.title || '')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  // Debounce & buffer refs for 600ms auto-save
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pendingUpdatesRef = useRef<Partial<KanbanItem>>({})
  const currentItemIdRef = useRef(itemId)

  // Sync internal title when switching to a different item
  useEffect(() => {
    currentItemIdRef.current = itemId
    setTitle(item?.title || '')
    pendingUpdatesRef.current = {}
    setSaveStatus('idle')
  }, [itemId, item?.title])

  // Flush pending changes immediately
  const flushPending = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    const updates = pendingUpdatesRef.current
    if (Object.keys(updates).length > 0) {
      const targetId = currentItemIdRef.current
      pendingUpdatesRef.current = {}
      updateItem(targetId, updates)
      setSaveStatus('saved')
    }
  }, [updateItem])

  // Flush on unmount or before switching
  useEffect(() => {
    return () => {
      flushPending()
    }
  }, [flushPending])

  // Debounced save scheduler (600ms)
  const scheduleDebouncedSave = useCallback(
    (updates: Partial<KanbanItem>) => {
      if (readOnly) return

      pendingUpdatesRef.current = {
        ...pendingUpdatesRef.current,
        ...updates
      }

      setSaveStatus('saving')

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        const toSave = pendingUpdatesRef.current
        pendingUpdatesRef.current = {}
        const targetId = currentItemIdRef.current
        updateItem(targetId, toSave)
        setSaveStatus('saved')
        debounceTimerRef.current = null
      }, 600)
    },
    [readOnly, updateItem]
  )

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setTitle(val)
    scheduleDebouncedSave({ title: val.trim() || 'Untitled Task' })
  }

  const handleTitleBlur = () => {
    flushPending()
  }

  const handleContentChange = (markdown: string) => {
    scheduleDebouncedSave({ content: markdown })
  }

  const handleClose = () => {
    flushPending()
    onClose()
  }

  const handleOpenFullPage = () => {
    flushPending()
    navigate({ name: 'item-detail', itemId, boardId })
    onClose()
  }

  if (!item) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6 text-sm text-muted-foreground">
        Task not found or has been deleted.
      </div>
    )
  }

  const bgProps = getBoardBackgroundStyleAndClass(item.background)
  const hasCover = Boolean(item.background && item.background.trim())

  return (
    <aside
      className={cn(
        'flex h-full w-full flex-col bg-card/95 backdrop-blur-md select-none overflow-hidden',
        orientation === 'horizontal' ? 'border-l border-border min-w-[300px]' : '',
        orientation === 'vertical' ? 'border-t border-border min-h-[180px]' : ''
      )}
    >
      {/* ── Ultra-Compact Top Bar (h-9 / 36px) ── */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b px-3 bg-muted/20 gap-2">
        {/* Left: Emoji + Title + Save Indicator */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* Item Emoji Picker */}
          {!readOnly ? (
            <InlineEmojiPicker
              value={item.icon}
              onChange={(emoji) => {
                updateItem(item.id, { icon: emoji })
              }}
              onClear={() => {
                updateItem(item.id, { icon: null })
              }}
              align="start"
              side="bottom"
              title="Change icon"
              trigger={
                item.icon ? (
                  <button
                    type="button"
                    className="text-base shrink-0 leading-none hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                    title="Change icon"
                  >
                    {item.icon}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="inline-flex text-muted-foreground/40 hover:text-foreground transition-colors p-0.5 rounded hover:bg-muted cursor-pointer shrink-0"
                    title="Add icon"
                  >
                    <Smile className="size-3.5" />
                  </button>
                )
              }
            />
          ) : (
            item.icon && <span className="text-base shrink-0 leading-none">{item.icon}</span>
          )}

          {/* Inline Seamless Document Title */}
          <input
            type="text"
            value={title}
            disabled={readOnly}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            placeholder="Untitled Task"
            className={cn(
              'bg-transparent text-sm font-bold tracking-tight text-foreground placeholder:text-muted-foreground/40 outline-none border-none p-0 focus:ring-0 truncate flex-1 min-w-[100px] leading-none',
              readOnly ? 'cursor-default' : 'cursor-text'
            )}
          />

          {/* Live Save Status Indicator */}
          <div className="flex items-center gap-1 text-[10px] font-medium shrink-0 pr-1">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-muted-foreground animate-pulse">
                <Loader2 className="size-2.5 animate-spin text-primary" />
                <span className="hidden sm:inline">Saving...</span>
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-muted-foreground/60">
                <Check className="size-2.5 text-emerald-500" />
                <span className="hidden sm:inline">Saved</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Header Actions: Orientation Toggle, Open Full Page, Close Button */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Open as Full Page Button */}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleOpenFullPage}
            className="size-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            title="Open as full page"
          >
            <Maximize2 className="size-3" />
          </Button>

          {/* Orientation Toggle Button */}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={toggleOrientation}
            className="size-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            title={
              orientation === 'vertical'
                ? 'Dock to right side panel'
                : 'Dock to bottom panel'
            }
          >
            {orientation === 'vertical' ? (
              <PanelRight className="size-3" />
            ) : (
              <PanelBottom className="size-3" />
            )}
          </Button>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleClose}
            className="size-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            title="Close panel (Esc)"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Scrollable Document Canvas Area ── */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        {/* Cover Banner (if set) */}
        {hasCover && (
          <div
            className={cn(
              'group relative w-full h-24 sm:h-28 overflow-hidden shadow-2xs border-b border-border/40 transition-all shrink-0',
              bgProps.className
            )}
            style={bgProps.style}
          >
            {bgProps.isImage && (
              <div className="absolute inset-0 bg-background/30 dark:bg-background/40 pointer-events-none" />
            )}
            {!readOnly && (
              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 dark:bg-background/90 backdrop-blur-xs p-0.5 rounded-md shadow-xs border border-border/50">
                <BackgroundPicker
                  value={item.background}
                  onChange={(newBg) => {
                    updateItem(item.id, { background: newBg || null })
                  }}
                  trigger={
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Palette className="size-2.5" />
                      <span>Change cover</span>
                    </button>
                  }
                />
                <button
                  type="button"
                  onClick={() => updateItem(item.id, { background: null })}
                  className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <X className="size-2.5" />
                  <span>Remove</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Draggable Notion Properties Section */}
        <ItemPropertiesSection
          item={item}
          boardId={boardId}
          lanes={lanes}
          readOnly={readOnly}
          onUpdate={(updates) => {
            updateItem(item.id, updates)
          }}
          className="px-3 py-2 border-b border-border/30 shrink-0"
        />

        {/* TipTap Markdown Editor */}
        <div className="flex-1 min-h-[220px] flex flex-col pt-1">
          <NotionEditor
            key={item.id}
            content={item.content || ''}
            onChange={handleContentChange}
            readOnly={readOnly}
          />
        </div>
      </div>
    </aside>
  )
}

export default ItemDetailPanel
