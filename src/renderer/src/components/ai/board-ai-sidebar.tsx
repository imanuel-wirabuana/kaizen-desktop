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
  Square,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { streamKaizenChat } from '@/lib/ai/ai-provider'
import {
  buildSystemPrompt,
  extractProposalFromContent,
  cleanContentForDisplay,
  splitStreamingContent,
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

const EMPTY_MESSAGES: BoardAiMessage[] = []

export function BoardAiSidebar({ board, lanes, items }: BoardAiSidebarProps) {
  const isOpen = useBoardAiStore((s) => s.isOpen)
  const isFullScreen = useBoardAiStore((s) => s.isFullScreen)
  const toggleFullScreen = useBoardAiStore((s) => s.toggleFullScreen)
  const setIsFullScreen = useBoardAiStore((s) => s.setIsFullScreen)
  const close = useBoardAiStore((s) => s.closeSidebar)
  const isGenerating = useBoardAiStore((s) => s.isGenerating)
  const setIsGenerating = useBoardAiStore((s) => s.setIsGenerating)
  const addMessage = useBoardAiStore((s) => s.addMessage)
  const clearBoardChat = useBoardAiStore((s) => s.clearBoardChat)
  const openPreviewModal = useBoardAiStore((s) => s.openPreviewModal)

  const [input, setInput] = useState('')
  const [streamingText, setStreamingText] = useState<string | null>(null)
  const messagesScrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Listen for Escape key to exit full screen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullScreen, setIsFullScreen])

  const boardId = board?.id ? String(board.id) : null

  // Reactive selector for messages belonging to this board
  const messages =
    useBoardAiStore((s) => (boardId ? s.chatsByBoard[boardId] : undefined)) || EMPTY_MESSAGES

  // Direct auto-scroll to bottom without smooth-scroll animation queue lag
  const scrollToBottom = (force = false) => {
    if (messagesScrollRef.current) {
      const container = messagesScrollRef.current
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 160
      if (force || isNearBottom) {
        container.scrollTop = container.scrollHeight
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingText, isGenerating])

  // Cleanup abort controller on unmount or board switch
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      setIsGenerating(false)
      setStreamingText(null)
    }
  }, [boardId, setIsGenerating])

  if (!board) return null

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }

  const handleSendMessage = async (userPrompt?: string) => {
    const text = (userPrompt ?? input).trim()
    if (!text || !boardId || isGenerating) return

    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // 1. Add user message to store
    const userMsg: BoardAiMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: Date.now()
    }
    addMessage(boardId, userMsg)

    // 2. Initialize live streaming state
    setIsGenerating(true)
    setStreamingText('')
    scrollToBottom(true)

    const controller = new AbortController()
    abortControllerRef.current = controller
    let accumulatedText = ''

    try {
      // Build conversation history for API
      const chatHistory = [...messages, userMsg].map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))

      const fullContent = await streamKaizenChat({
        system: buildSystemPrompt(board, lanes, items),
        messages: chatHistory,
        signal: controller.signal,
        onDelta: (_delta, accumulated) => {
          accumulatedText = accumulated
          setStreamingText(accumulated)
          scrollToBottom()
        }
      })

      // 3. After streaming completes, detect and extract any proposal
      const proposal = extractProposalFromContent(fullContent)
      const displayContent = proposal ? cleanContentForDisplay(fullContent) : fullContent

      const assistantMsg: BoardAiMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: displayContent,
        createdAt: Date.now(),
        proposal: proposal || undefined
      }
      addMessage(boardId, assistantMsg)
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        console.log('AI streaming stopped by user')
        if (accumulatedText.trim()) {
          const proposal = extractProposalFromContent(accumulatedText)
          const displayContent = proposal ? cleanContentForDisplay(accumulatedText) : accumulatedText
          addMessage(boardId, {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: `${displayContent}\n\n*(Generation stopped by user)*`,
            createdAt: Date.now(),
            proposal: proposal || undefined
          })
        }
      } else {
        console.error('AI streaming error:', err)
        addMessage(boardId, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: accumulatedText
            ? `${accumulatedText}\n\n*(Generation interrupted: ${err?.message || 'connection error'})*`
            : `Error: ${err?.message || 'Failed to connect to Kaizen AI.'}`,
          createdAt: Date.now()
        })
      }
    } finally {
      setIsGenerating(false)
      setStreamingText(null)
      abortControllerRef.current = null
      scrollToBottom(true)
    }
  }

  const handleOpenProposalReview = (proposal: BoardMutationProposal, messageId: string) => {
    openPreviewModal(proposal)
    sessionStorage.setItem('pending_ai_message_id', messageId)
  }

  return (
    <>
      {/* Dimmed backdrop when in full screen mode */}
      {isOpen && isFullScreen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsFullScreen(false)}
        />
      )}

      <aside
        className={cn(
          'flex flex-col text-card-foreground select-none transition-all duration-300 ease-in-out',
          isFullScreen
            ? 'fixed inset-2 sm:inset-4 z-50 rounded-2xl border border-border/80 bg-card/98 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200'
            : 'h-full rounded-2xl bg-card/95 backdrop-blur-md shadow-md overflow-hidden relative z-10 shrink-0 border border-border/80',
          isOpen
            ? isFullScreen
              ? 'opacity-100'
              : 'w-88 opacity-100 translate-x-0'
            : 'w-0 opacity-0 translate-x-6 border-0 shadow-none pointer-events-none -ml-3'
        )}
      >
        <div className={cn('flex h-full flex-col min-h-0', isFullScreen ? 'w-full min-w-0' : 'w-88 min-w-[350px]')}>
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
                  className="rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-semibold text-primary truncate max-w-[150px]"
                  title={board.title || 'Board'}
                >
                  {board.icon ? `${board.icon} ` : ''}
                  {board.title || 'Board'}
                </span>
                {isFullScreen && (
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded-md bg-muted text-[10px] font-medium text-muted-foreground border shrink-0">
                    Full Screen View
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearBoardChat(boardId!)}
                  disabled={isGenerating}
                  className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer disabled:opacity-40"
                  title="Clear Conversation"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={toggleFullScreen}
                className={cn(
                  'flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer',
                  isFullScreen && 'text-primary hover:text-primary bg-primary/10'
                )}
                title={isFullScreen ? 'Exit Full Screen (Esc)' : 'Full Screen'}
              >
                {isFullScreen ? (
                  <Minimize2 className="size-3.5" />
                ) : (
                  <Maximize2 className="size-3.5" />
                )}
              </button>

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
          <div
            ref={messagesScrollRef}
            className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 custom-scrollbar"
          >
            <div className={cn('space-y-3', isFullScreen && 'max-w-4xl mx-auto w-full px-2 sm:px-4 py-2')}>
              {messages.length === 0 && !isGenerating ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-2 py-8 space-y-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
                    <Bot className="size-6" />
                  </div>
                  <div className="space-y-1 max-w-md">
                    <h4 className="text-sm font-bold text-foreground">
                      Kaizen Board Co-Pilot
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Ask me to break down goals, plan sprint columns, or suggest tasks tailored to{' '}
                      <span className="font-semibold text-foreground">
                        {board.title || 'this board'}
                      </span>.
                    </p>
                  </div>

                  {/* Quick suggestions */}
                  <div className={cn(
                    'w-full pt-3 text-left',
                    isFullScreen ? 'max-w-2xl grid grid-cols-1 sm:grid-cols-3 gap-2' : 'space-y-1.5'
                  )}>
                    {!isFullScreen && (
                      <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1">
                        <HelpCircle className="size-2.5" /> Try asking:
                      </div>
                    )}
                    {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(suggestion)}
                        disabled={isGenerating}
                        className="w-full text-left p-2.5 rounded-xl border bg-card/60 hover:bg-card hover:border-primary/40 text-[11px] text-muted-foreground hover:text-foreground transition-all cursor-pointer leading-snug shadow-2xs"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex gap-2.5 text-xs',
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
                          'rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-2xs',
                          isFullScreen ? 'max-w-[85%] sm:max-w-[78%]' : 'max-w-[90%]',
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
                  ))}

                  {/* Active Real-Time Streaming Assistant Bubble */}
                  {isGenerating && streamingText !== null && (
                    <div className="flex gap-2.5 text-xs justify-start">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                        <Bot className="size-3.5" />
                      </div>

                      <div
                        className={cn(
                          'rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-2xs bg-muted/50 border border-border/70 text-foreground rounded-bl-xs space-y-2',
                          isFullScreen ? 'max-w-[85%] sm:max-w-[78%]' : 'max-w-[90%]'
                        )}
                      >
                        {streamingText.trim() === '' ? (
                          <div className="flex items-center gap-1.5 py-1 text-muted-foreground text-[11px]">
                            <Loader2 className="size-3 animate-spin text-primary" />
                            <span>Thinking...</span>
                          </div>
                        ) : (
                          <>
                            {(() => {
                              const { display, hasProposalBlock } = splitStreamingContent(streamingText)
                              return (
                                <>
                                  <div className="relative">
                                    <AiMarkdown content={display || streamingText} />
                                    <span className="inline-block w-1.5 h-3.5 bg-primary/80 align-middle ml-0.5 animate-pulse rounded-xs" />
                                  </div>

                                  {hasProposalBlock && (
                                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-primary font-medium animate-pulse">
                                      <Sparkles className="size-3 shrink-0" />
                                      <span>Structuring board changes...</span>
                                    </div>
                                  )}
                                </>
                              )
                            })()}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Footer */}
          <div className="p-2.5 border-t bg-muted/20 shrink-0">
            <div className={cn(isFullScreen && 'max-w-4xl mx-auto w-full px-2 sm:px-4')}>
              <div className="flex flex-col gap-1.5 rounded-xl border bg-card p-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all shadow-2xs">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value)
                    if (textareaRef.current) {
                      textareaRef.current.style.height = 'auto'
                      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  rows={1}
                  placeholder={isGenerating ? "Kaizen Assistant is generating..." : "Ask assistant to plan, update, or delete..."}
                  disabled={isGenerating}
                  className="w-full min-h-[36px] max-h-[140px] text-xs bg-transparent border-0 resize-none focus:outline-none custom-scrollbar leading-relaxed text-foreground placeholder:text-muted-foreground disabled:opacity-60"
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
        </div>
      </aside>
    </>
  )
}

