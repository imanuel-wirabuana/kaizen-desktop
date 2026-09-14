import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  ArrowLeft,
  Check,
  Loader2,
  Palette,
  Smile,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InlineEmojiPicker } from '@/components/ui/emoji-picker'
import { BackgroundPicker } from '@/components/ui/background-picker'
import { ItemPropertiesSection } from '@/components/items/detail/item-properties-section'
import { NotionEditor } from '@/components/items/detail/notion-editor'
import { Skeleton } from '@/components/ui/skeleton'
import { useItemsStore } from '@/stores/items'
import { useLanesStore } from '@/stores/lanes'
import { useBoardsStore } from '@/stores/boards'
import { useBoardFoldersStore } from '@/stores/board-folders'
import { useNavigationStore } from '@/stores/navigation'
import { useBreadcrumbs, BreadcrumbItem } from '@/stores/dynamic-breadcrumb'
import { useBoardDetailData } from '@/pages/board-detail/hooks/use-board-detail-data'
import { getBoardBackgroundStyleAndClass } from '@/lib/board-utils'
import { cn } from '@/lib/utils'

export interface ItemDetailPageProps {
  itemId: number | string
  boardId?: number | string
}

type SaveStatus = 'idle' | 'saving' | 'saved'

export function ItemDetailPage({ itemId, boardId }: ItemDetailPageProps) {
  const navigate = useNavigationStore((s) => s.navigate)
  const goBack = useNavigationStore((s) => s.goBack)

  // Find item from store
  const item = useItemsStore((s) => s.items.find((i) => String(i.id) === String(itemId)))
  const updateItem = useItemsStore((s) => s.updateItem)

  const effectiveBoardId = boardId ?? item?.board_id ?? null

  // Ensure board data (lanes, items, permissions) is synchronized
  const { board, lanes, loading, permissions } = useBoardDetailData(
    effectiveBoardId ? String(effectiveBoardId) : ''
  )

  const folders = useBoardFoldersStore((s) => s.folders)
  const boardFolderMap = useBoardFoldersStore((s) => s.boardFolderMap)

  const [title, setTitle] = useState(item?.title || '')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  // Debounce & buffer refs for 600ms auto-save
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pendingUpdatesRef = useRef<Partial<KanbanItem>>({})
  const currentItemIdRef = useRef(itemId)

  // Sync internal title when switching or item loads
  useEffect(() => {
    currentItemIdRef.current = itemId
    if (item?.title !== undefined) {
      setTitle(item.title || '')
    }
  }, [itemId, item?.title])

  // Flush pending changes
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

  // Flush on unmount
  useEffect(() => {
    return () => {
      flushPending()
    }
  }, [flushPending])

  // Debounced auto-save scheduler (600ms)
  const scheduleDebouncedSave = useCallback(
    (updates: Partial<KanbanItem>) => {
      if (permissions.isReadOnly) return

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
    [permissions.isReadOnly, updateItem]
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

  // Dynamic breadcrumb hierarchy
  const breadcrumbItems = useMemo(() => {
    const items: BreadcrumbItem[] = [
      { label: 'Boards', view: { name: 'boards' } }
    ]

    if (effectiveBoardId) {
      const folderId = boardFolderMap[String(effectiveBoardId)]
      const folder = folderId ? folders.find((f) => String(f.id) === String(folderId)) : null

      if (folder) {
        items.push({
          label: `${folder.icon || '📁'} ${folder.name}`,
          view: { name: 'project-detail', projectId: folder.id }
        })
      }

      if (board && board.id !== undefined) {
        items.push({
          label: `${board.icon || '📋'} ${board.title || 'Untitled Board'}`,
          view: { name: 'board-detail', boardId: board.id }
        })
      }
    }

    const taskLabel = item?.title ? `${item.icon ? `${item.icon} ` : ''}${item.title}` : 'Task Detail'
    items.push({ label: taskLabel })

    return items
  }, [effectiveBoardId, board, boardFolderMap, folders, item?.title, item?.icon])

  useBreadcrumbs(breadcrumbItems)

  const handleBack = () => {
    flushPending()
    if (effectiveBoardId) {
      navigate({ name: 'board-detail', boardId: effectiveBoardId })
    } else {
      goBack()
    }
  }

  if (loading && !item) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto p-6 md:p-12 max-w-4xl mx-auto w-full space-y-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-2/3 rounded-lg" />
          <Skeleton className="h-5 w-1/3 rounded-md" />
        </div>
        <div className="space-y-2 pt-4">
          <Skeleton className="h-6 w-full rounded" />
          <Skeleton className="h-6 w-full rounded" />
          <Skeleton className="h-6 w-3/4 rounded" />
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center space-y-4">
        <p className="text-sm text-muted-foreground">Task not found or has been deleted.</p>
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="mr-1.5 size-3.5" />
          Back to Board
        </Button>
      </div>
    )
  }

  const bgProps = getBoardBackgroundStyleAndClass(item.background)
  const hasCover = Boolean(item.background && item.background.trim())

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden bg-background">
      {/* ── Top Header Action Bar ── */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b px-4 bg-muted/20 gap-2 select-none">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground gap-1 -ml-1 text-xs cursor-pointer"
            title="Back to board"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to board</span>
          </Button>
        </div>

        {/* Live Auto-Save Status */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-muted-foreground animate-pulse text-[11px]">
              <Loader2 className="size-3 animate-spin text-primary" />
              <span>Saving...</span>
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-muted-foreground/70 text-[11px]">
              <Check className="size-3 text-emerald-500" />
              <span>Saved</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Scrollable Document Canvas ── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full px-6 sm:px-12 py-6 pb-24 flex flex-col">
          {/* ── Cover Banner (if set) ── */}
          {hasCover ? (
            <div
              className={cn(
                'group relative w-full h-44 sm:h-52 rounded-xl overflow-hidden shadow-xs border border-border/40 transition-all mb-4',
                bgProps.className
              )}
              style={bgProps.style}
            >
              {bgProps.isImage && (
                <div className="absolute inset-0 bg-background/30 dark:bg-background/40 pointer-events-none" />
              )}
              {/* Cover Action Bar on Hover */}
              {!permissions.isReadOnly && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 dark:bg-background/90 backdrop-blur-xs p-1 rounded-lg shadow-sm border border-border/50">
                  <BackgroundPicker
                    value={item.background}
                    onChange={(newBg) => {
                      updateItem(item.id, { background: newBg || null })
                    }}
                    trigger={
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        <Palette className="size-3" />
                        <span>Change cover</span>
                      </button>
                    }
                  />
                  <button
                    type="button"
                    onClick={() => updateItem(item.id, { background: null })}
                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <X className="size-3" />
                    <span>Remove</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Subtle Action Bar when No Cover */
            !permissions.isReadOnly && (
              <div className="flex items-center gap-2 mb-2 text-muted-foreground/70 hover:text-muted-foreground transition-colors select-none text-xs">
                {!item.icon && (
                  <InlineEmojiPicker
                    value={null}
                    onChange={(emoji) => {
                      updateItem(item.id, { icon: emoji })
                    }}
                    trigger={
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Smile className="size-3.5" />
                        <span>Add icon</span>
                      </button>
                    }
                  />
                )}
                <BackgroundPicker
                  value={item.background}
                  onChange={(newBg) => {
                    updateItem(item.id, { background: newBg || null })
                  }}
                  trigger={
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Palette className="size-3.5" />
                      <span>Add cover</span>
                    </button>
                  }
                />
              </div>
            )
          )}

          {/* ── Unified Inline Header (Icon + Title + Properties Inline) ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/30 mb-4 select-none">
            {/* 1. Inline Icon & Title */}
            <div className="flex items-center gap-2.5 min-w-[240px] flex-1">
              {/* Page Icon */}
              {!permissions.isReadOnly ? (
                <InlineEmojiPicker
                  value={item.icon}
                  onChange={(emoji) => {
                    updateItem(item.id, { icon: emoji })
                  }}
                  onClear={() => {
                    updateItem(item.id, { icon: null })
                  }}
                  trigger={
                    item.icon ? (
                      <button
                        type="button"
                        className="text-2xl sm:text-3xl leading-none hover:scale-105 active:scale-95 transition-transform cursor-pointer p-1 -ml-1 rounded-lg hover:bg-muted/40 shrink-0"
                        title="Change icon"
                      >
                        {item.icon}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-muted/50 cursor-pointer text-muted-foreground hover:text-foreground transition-colors border border-dashed border-border/60 shrink-0"
                        title="Add icon"
                      >
                        <Smile className="size-4" />
                      </button>
                    )
                  }
                />
              ) : (
                item.icon && <span className="text-2xl sm:text-3xl leading-none shrink-0">{item.icon}</span>
              )}

              {/* Page Title */}
              <input
                type="text"
                value={title}
                disabled={permissions.isReadOnly}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                placeholder="Untitled Task"
                className={cn(
                  'w-full bg-transparent text-2xl sm:text-3xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/30 outline-none border-none p-0 focus:ring-0 leading-tight select-text',
                  permissions.isReadOnly ? 'cursor-default' : 'cursor-text'
                )}
              />
            </div>

            {/* 2. Inline Properties (Status, Assignee, Dates, Priority, Column, Cover) */}
            <ItemPropertiesSection
              item={item}
              boardId={effectiveBoardId}
              lanes={lanes}
              readOnly={permissions.isReadOnly}
              onUpdate={(updates) => {
                updateItem(item.id, updates)
              }}
              layout="inline"
              className="shrink-0"
            />
          </div>

          {/* ── TipTap Markdown Editor ── */}
          <div className="flex-1 min-h-[300px] pt-1">
            <NotionEditor
              key={item.id}
              content={item.content || ''}
              onChange={handleContentChange}
              readOnly={permissions.isReadOnly}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItemDetailPage
