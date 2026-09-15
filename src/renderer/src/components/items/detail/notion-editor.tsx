import { useEffect, useState, useRef, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Link } from '@tiptap/extension-link'
import { Markdown } from 'tiptap-markdown'
import {
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  List,
  ListOrdered,
  Code,
  Quote,
  Minus,
  Bold,
  Italic,
  Strikethrough,
  Code2,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotionEditorProps {
  content: string
  onChange: (markdown: string) => void
  readOnly?: boolean
  className?: string
}

interface SlashCommandItem {
  id: string
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  action: (editor: any) => void
}

const COMMAND_ITEMS: SlashCommandItem[] = [
  {
    id: 'h1',
    title: 'Heading 1',
    subtitle: 'Large section heading',
    icon: Heading1,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run()
  },
  {
    id: 'h2',
    title: 'Heading 2',
    subtitle: 'Medium section heading',
    icon: Heading2,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run()
  },
  {
    id: 'h3',
    title: 'Heading 3',
    subtitle: 'Small section heading',
    icon: Heading3,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run()
  },
  {
    id: 'task',
    title: 'To-do list',
    subtitle: 'Track tasks with interactive checkboxes',
    icon: CheckSquare,
    action: (editor) => editor.chain().focus().toggleTaskList().run()
  },
  {
    id: 'bullet',
    title: 'Bullet list',
    subtitle: 'Create a simple bulleted list',
    icon: List,
    action: (editor) => editor.chain().focus().toggleBulletList().run()
  },
  {
    id: 'ordered',
    title: 'Numbered list',
    subtitle: 'Create an ordered sequence',
    icon: ListOrdered,
    action: (editor) => editor.chain().focus().toggleOrderedList().run()
  },
  {
    id: 'code',
    title: 'Code block',
    subtitle: 'Capture a code snippet with formatting',
    icon: Code,
    action: (editor) => editor.chain().focus().toggleCodeBlock().run()
  },
  {
    id: 'quote',
    title: 'Quote',
    subtitle: 'Capture a quote or key callout',
    icon: Quote,
    action: (editor) => editor.chain().focus().toggleBlockquote().run()
  },
  {
    id: 'divider',
    title: 'Divider',
    subtitle: 'Visual horizontal separator',
    icon: Minus,
    action: (editor) => editor.chain().focus().setHorizontalRule().run()
  }
]

export function NotionEditor({
  content,
  onChange,
  readOnly = false,
  className
}: NotionEditorProps) {
  const [slashMenuOpen, setSlashMenuOpen] = useState(false)
  const [slashMenuQuery, setSlashMenuQuery] = useState('')
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 })
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Floating bubble toolbar state
  const [bubbleMenuVisible, setBubbleMenuVisible] = useState(false)
  const [bubbleMenuPos, setBubbleMenuPos] = useState({ top: 0, left: 0 })

  const editorContainerRef = useRef<HTMLDivElement>(null)
  const isInternalUpdateRef = useRef(false)
  const lastEmittedRef = useRef(content || '')

  const editor = useEditor({
    editable: !readOnly,
    content: content || '',
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'bg-muted/80 text-foreground font-mono text-xs p-3 rounded-lg my-2 border border-border overflow-x-auto'
          }
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc list-outside ml-4 space-y-0.5 my-1'
          }
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal list-outside ml-4 space-y-0.5 my-1'
          }
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-2 border-primary/70 pl-3 my-2 text-muted-foreground italic'
          }
        },
        horizontalRule: {
          HTMLAttributes: {
            class: 'border-t border-border my-4'
          }
        }
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list not-prose space-y-1.5 my-1 pl-0'
        }
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'flex items-start gap-2.5 my-0.5 text-sm leading-relaxed'
        }
      }),
      Placeholder.configure({
        placeholder: ({ editor: ed }) => {
          if (!ed.isEditable) return ''
          return "Type '/' for commands, or write in markdown..."
        },
        emptyEditorClass: 'is-editor-empty'
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline font-medium hover:text-primary/80 cursor-pointer'
        }
      }),
      Markdown
    ],
    onUpdate: ({ editor: ed }) => {
      // Get serialized markdown
      const md = (ed.storage as any)?.markdown?.getMarkdown?.() ?? ed.getText()
      lastEmittedRef.current = md
      isInternalUpdateRef.current = true
      onChange(md)
    },
    onSelectionUpdate: ({ editor: ed }) => {
      // 1. Check for text selection to show bubble menu
      const { from, to } = ed.state.selection
      if (from !== to && !ed.state.selection.empty && !readOnly) {
        try {
          const coords = ed.view.coordsAtPos(from)
          const container = editorContainerRef.current?.getBoundingClientRect()
          if (container) {
            setBubbleMenuPos({
              top: coords.top - container.top - 42,
              left: Math.max(12, coords.left - container.left)
            })
            setBubbleMenuVisible(true)
          }
        } catch {
          setBubbleMenuVisible(false)
        }
      } else {
        setBubbleMenuVisible(false)
      }

      // 2. Check for slash command invocation
      if (from === to && !readOnly) {
        const textBefore = ed.state.doc.textBetween(Math.max(0, from - 20), from, '\n', '\0')
        const slashIndex = textBefore.lastIndexOf('/')
        if (slashIndex !== -1) {
          const query = textBefore.slice(slashIndex + 1)
          if (!query.includes(' ') && !query.includes('\n')) {
            try {
              const coords = ed.view.coordsAtPos(from)
              const container = editorContainerRef.current?.getBoundingClientRect()
              if (container) {
                setSlashMenuPos({
                  top: coords.bottom - container.top + 8,
                  left: Math.min(
                    Math.max(12, coords.left - container.left),
                    container.width - 240
                  )
                })
                setSlashMenuQuery(query.toLowerCase())
                setSlashMenuOpen(true)
                setSelectedIndex(0)
                return
              }
            } catch {
              // fallback
            }
          }
        }
      }

      setSlashMenuOpen(false)
    }
  })

  // Sync external content changes if editor is not actively editing
  useEffect(() => {
    if (!editor) return
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false
      return
    }

    const currentMd = (editor.storage as any)?.markdown?.getMarkdown?.() ?? ''
    if (content !== currentMd && content !== lastEmittedRef.current) {
      editor.commands.setContent(content || '', { emitUpdate: false })
      lastEmittedRef.current = content || ''
    }
  }, [content, editor])

  // Sync TipTap editable state if readOnly prop changes dynamically
  useEffect(() => {
    if (editor && editor.isEditable !== !readOnly) {
      editor.setEditable(!readOnly)
    }
  }, [editor, readOnly])

  // Filter commands by slash query
  const filteredCommands = COMMAND_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(slashMenuQuery) ||
    item.subtitle.toLowerCase().includes(slashMenuQuery) ||
    item.id.includes(slashMenuQuery)
  )

  const executeCommand = useCallback(
    (item: SlashCommandItem) => {
      if (!editor) return
      const { from } = editor.state.selection
      const textBefore = editor.state.doc.textBetween(Math.max(0, from - 20), from, '\n', '\0')
      const slashIndex = textBefore.lastIndexOf('/')

      if (slashIndex !== -1) {
        const deleteCount = textBefore.length - slashIndex
        editor
          .chain()
          .focus()
          .deleteRange({ from: from - deleteCount, to: from })
          .run()
      }

      item.action(editor)
      setSlashMenuOpen(false)
    },
    [editor]
  )

  // Keyboard navigation for slash menu
  useEffect(() => {
    if (!slashMenuOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + (filteredCommands.length || 1)) % (filteredCommands.length || 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setSlashMenuOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [slashMenuOpen, selectedIndex, filteredCommands, executeCommand])

  const handleContentClick = (e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest('a')
    if (target && target.href) {
      e.preventDefault()
      e.stopPropagation()
      if ((window as any).api?.openExternalUrl) {
        ;(window as any).api.openExternalUrl(target.href)
      } else {
        window.open(target.href, '_blank')
      }
    }
  }

  return (
    <div
      ref={editorContainerRef}
      className={cn('relative flex flex-col flex-1 min-h-0 w-full', className)}
    >
      {/* Floating Selection Bubble Toolbar */}
      {bubbleMenuVisible && editor && (
        <div
          style={{ top: `${bubbleMenuPos.top}px`, left: `${bubbleMenuPos.left}px` }}
          className="absolute z-50 flex items-center gap-0.5 rounded-lg border bg-popover/95 p-1 shadow-lg backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              'size-7 rounded flex items-center justify-center text-xs transition-colors hover:bg-muted',
              editor.isActive('bold') ? 'bg-primary/20 text-primary font-bold' : 'text-foreground'
            )}
            title="Bold (Ctrl+B)"
          >
            <Bold className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              'size-7 rounded flex items-center justify-center text-xs transition-colors hover:bg-muted',
              editor.isActive('italic') ? 'bg-primary/20 text-primary font-bold' : 'text-foreground'
            )}
            title="Italic (Ctrl+I)"
          >
            <Italic className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(
              'size-7 rounded flex items-center justify-center text-xs transition-colors hover:bg-muted',
              editor.isActive('strike') ? 'bg-primary/20 text-primary font-bold' : 'text-foreground'
            )}
            title="Strikethrough"
          >
            <Strikethrough className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(
              'size-7 rounded flex items-center justify-center text-xs transition-colors hover:bg-muted font-mono',
              editor.isActive('code') ? 'bg-primary/20 text-primary font-bold' : 'text-foreground'
            )}
            title="Inline Code"
          >
            <Code2 className="size-3.5" />
          </button>
          <div className="h-4 w-px bg-border mx-0.5" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn(
              'size-7 rounded flex items-center justify-center text-xs font-semibold transition-colors hover:bg-muted',
              editor.isActive('heading', { level: 1 }) ? 'bg-primary/20 text-primary' : 'text-foreground'
            )}
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(
              'size-7 rounded flex items-center justify-center text-xs font-semibold transition-colors hover:bg-muted',
              editor.isActive('heading', { level: 2 }) ? 'bg-primary/20 text-primary' : 'text-foreground'
            )}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={cn(
              'size-7 rounded flex items-center justify-center text-xs transition-colors hover:bg-muted',
              editor.isActive('taskList') ? 'bg-primary/20 text-primary' : 'text-foreground'
            )}
            title="To-do list"
          >
            <CheckSquare className="size-3.5" />
          </button>
        </div>
      )}

      {/* Slash Command Autocomplete Popover */}
      {slashMenuOpen && filteredCommands.length > 0 && (
        <div
          style={{ top: `${slashMenuPos.top}px`, left: `${slashMenuPos.left}px` }}
          className="absolute z-50 w-64 max-h-72 overflow-y-auto rounded-xl border bg-popover/95 p-1 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 mb-1">
            Blocks
          </div>
          {filteredCommands.map((item, idx) => {
            const Icon = item.icon
            const isSelected = idx === selectedIndex
            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => executeCommand(item)}
                className={cn(
                  'w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer',
                  isSelected ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted/70'
                )}
              >
                <div
                  className={cn(
                    'flex size-6 items-center justify-center rounded-md border text-xs shrink-0',
                    isSelected ? 'border-primary-foreground/30 bg-primary-foreground/20 text-primary-foreground' : 'border-border bg-muted/50 text-muted-foreground'
                  )}
                >
                  <Icon className="size-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium leading-tight truncate">{item.title}</span>
                  <span
                    className={cn(
                      'text-[10px] truncate leading-tight',
                      isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                    )}
                  >
                    {item.subtitle}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Editor Content Area */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-4 py-2 text-foreground font-sans"
        onClick={handleContentClick}
      >
        {readOnly && (!content || !content.trim()) ? (
          <div className="py-6 text-sm text-muted-foreground/60 italic select-none">
            No additional notes or description provided.
          </div>
        ) : (
          <EditorContent
            editor={editor}
            className={cn(
              'notion-prosemirror-container min-h-full pb-20 focus:outline-none',
              readOnly && 'read-only-editor select-text'
            )}
          />
        )}
      </div>
    </div>
  )
}
