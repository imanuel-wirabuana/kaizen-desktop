import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  X,
  Send,
  Trash2,
  Bot,
  User,
  Loader2,
  HelpCircle,
  Square
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { streamKaizenChat } from '@/lib/ai/ai-provider'
import {
  buildSystemPrompt,
  extractProposalFromContent,
  cleanContentForDisplay,
  BoardMutationProposal
} from '@/lib/ai/ai-tools'
import { useBoardAiStore, BoardAiMessage } from '@/stores/board-ai'
import { AiProposalCard } from './ai-proposal-card'
import { AiMarkdown } from './ai-markdown'


interface BoardAiSidebarProps {
  board: Board | null
  lanes: Lane[]
  items: KanbanItem[]
}

const QUICK_SUGGESTIONS = [
  'Break this board into a 4-stage sprint workflow',
  'Rename column or move tasks between lanes',
  'Add testing tasks and clean up completed items'
]

export function BoardAiSidebar({ board, lanes, items }: BoardAiSidebarProps) {
  const isOpen = useBoardAiStore((s) => s.isOpen)
  const close = useBoardAiStore((s) => s.closeSidebar)
  const isGenerating = useBoardAiStore((s) => s.isGenerating)
  const setIsGenerating = useBoardAiStore((s) => s.setIsGenerating)
  const getBoardMessages = useBoardAiStore((s) => s.getBoardMessages)
  const addMessage = useBoardAiStore((s) => s.addMessage)
  const updateLastAssistantMessage = useBoardAiStore((s) => s.updateLastAssistantMessage)
  const clearBoardChat = useBoardAiStore((s) => s.clearBoardChat)
  const openPreviewModal = useBoardAiStore((s) => s.openPreviewModal)

  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const boardId = board?.id ? String(board.id) : null
  const messages = boardId ? getBoardMessages(boardId) : []

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isGenerating])

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  if (!board) return null

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsGenerating(false)
    }
  }

  const handleSendMessage = async (userPrompt?: string) => {
    const text = (userPrompt ?? input).trim()
    if (!text || !boardId || isGenerating) return

    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // 1. Add user message
    const userMsg: BoardAiMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: Date.now()
    }
    addMessage(boardId, userMsg)

    // 2. Add assistant placeholder
    const assistantMsgId = `assistant-${Date.now()}`
    const assistantMsg: BoardAiMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      createdAt: Date.now()
    }
    addMessage(boardId, assistantMsg)
    setIsGenerating(true)

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      // Build conversation history
      const chatHistory = [...messages, userMsg].map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))

      const fullContent = await streamKaizenChat({
        system: buildSystemPrompt(board, lanes, items),
        messages: chatHistory,
        signal: controller.signal,
        onDelta: (_delta, accumulated) => {
          // Token-by-token live streaming updates!
          updateLastAssistantMessage(boardId, (prev) => ({
            ...prev,
            content: accumulated
          }))
        }
      })

      // After streaming completes, detect and extract any proposal
      const proposal = extractProposalFromContent(fullContent)
      const displayContent = proposal ? cleanContentForDisplay(fullContent) : fullContent

      updateLastAssistantMessage(boardId, (prev) => ({
        ...prev,
        content: displayContent,
        proposal: proposal || undefined
      }))
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        console.log('AI streaming stopped by user')
      } else {
        console.error('AI streaming error:', err)
        updateLastAssistantMessage(boardId, (prev) => ({
          ...prev,
          content: prev.content
            ? `${prev.content}\n\n*(Generation interrupted: ${err?.message || 'connection error'})*`
            : `Error: ${err?.message || 'Failed to connect to Kaizen AI.'}`
        }))
      }
    } finally {
      setIsGenerating(false)
      abortControllerRef.current = null
    }
  }

  const handleOpenProposalReview = (proposal: BoardMutationProposal, messageId: string) => {
    openPreviewModal(proposal)
    // Store message ID to mark as applied when user confirms changes
    sessionStorage.setItem('pending_ai_message_id', messageId)
  }

  return (
    <aside
      className={cn(
        'flex h-full flex-col rounded-2xl bg-card/95 backdrop-blur-md text-card-foreground shadow-md transition-all duration-300 ease-in-out overflow-hidden relative select-none z-10 shrink-0 border border-border/80',
        isOpen
          ? 'w-88 opacity-100 translate-x-0'
          : 'w-0 opacity-0 translate-x-6 border-0 shadow-none pointer-events-none -ml-3'
      )}
    >
      <div className="w-88 flex h-full flex-col min-w-[350px]">
        {/* Header */}
        <div className="flex h-11 shrink-0 items-center justify-between border-b px-3 bg-muted/30">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
              <Sparkles className="size-3.5" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="text-xs font-bold tracking-tight text-foreground truncate">
                AI Assistant
              </h3>
              <span
                className="rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-semibold text-primary truncate max-w-[120px]"
                title={board.title || 'Board'}
              >
                {board.icon ? `${board.icon} ` : ''}
                {board.title || 'Board'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => clearBoardChat(boardId!)}
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                title="Clear Conversation"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={close}
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Close Assistant"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-2 py-6 space-y-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
                <Bot className="size-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground">
                  Kaizen Board Co-Pilot
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Ask me to break down goals, plan sprint columns, or suggest tasks tailored to{' '}
                  <span className="font-semibold text-foreground">
                    {board.title || 'this board'}
                  </span>.
                </p>
              </div>

              {/* Quick suggestions */}
              <div className="w-full space-y-1.5 pt-2 text-left">
                <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1">
                  <HelpCircle className="size-2.5" /> Try asking:
                </div>
                {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(suggestion)}
                    disabled={isGenerating}
                    className="w-full text-left p-2 rounded-xl border bg-card/60 hover:bg-card hover:border-primary/40 text-[11px] text-muted-foreground hover:text-foreground transition-all cursor-pointer leading-snug shadow-2xs"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-2 text-xs',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                    <Bot className="size-3.5" />
                  </div>
                )}

                <div
                  className={cn(
                    'rounded-2xl px-3 py-2 max-w-[90%] leading-relaxed shadow-2xs',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground font-medium rounded-br-xs'
                      : 'bg-muted/50 border border-border/70 text-foreground rounded-bl-xs'
                  )}
                >
                  {msg.content && (
                    <AiMarkdown
                      content={msg.content}
                      isUser={msg.role === 'user'}
                    />
                  )}

                  {/* Proposal Card if emitted */}
                  {msg.proposal && (
                    <AiProposalCard
                      proposal={msg.proposal}
                      applied={msg.applied}
                      onReview={() => handleOpenProposalReview(msg.proposal!, msg.id)}
                    />
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground mt-0.5">
                    <User className="size-3.5" />
                  </div>
                )}
              </div>
            ))
          )}

          {isGenerating && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bot className="size-3.5" />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted/40 border border-border/50 text-[11px]">
                <Loader2 className="size-3 animate-spin text-primary" />
                <span>Kaizen Assistant is streaming...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-2.5 border-t bg-muted/20 shrink-0">
          <div className="flex flex-col gap-1.5 rounded-xl border bg-card p-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all shadow-2xs">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto'
                  textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              rows={1}
              placeholder="Ask assistant to plan, update, or delete..."
              disabled={isGenerating}
              className="w-full min-h-[36px] max-h-[120px] text-xs bg-transparent border-0 resize-none focus:outline-none custom-scrollbar leading-relaxed text-foreground placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
              <span>Shift + Enter for new line</span>
              {isGenerating ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleStopGeneration}
                  className="h-6 px-2 text-[10px] gap-1 rounded-lg shrink-0 cursor-pointer text-destructive hover:bg-destructive/10 border-destructive/30"
                  title="Stop generation"
                >
                  <Square className="size-2.5 fill-current" /> Stop
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim()}
                  className="h-6 px-2 text-[10px] gap-1 rounded-lg shrink-0 cursor-pointer font-semibold"
                  title="Send message (Enter)"
                >
                  <Send className="size-3" /> Send
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
