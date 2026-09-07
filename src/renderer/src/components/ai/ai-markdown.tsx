import { useMemo } from 'react'
import { Markdown, type MarkdownComponents } from '@tanstack/markdown/react'
import { streamingMarkdownExtension } from '@tanstack/markdown/extensions/streaming'
import { cn } from '@/lib/utils'

interface AiMarkdownProps {
  content: string
  isUser?: boolean
  className?: string
}

export function AiMarkdown({ content, isUser = false, className }: AiMarkdownProps) {
  const extensions = useMemo(() => [streamingMarkdownExtension()], [])

  const components: MarkdownComponents = useMemo(() => {
    if (isUser) {
      return {
        p: (props) => <p className="my-1 first:mt-0 last:mb-0 leading-relaxed" {...props} />,
        code: (props) => (
          <code
            className="rounded bg-primary-foreground/20 px-1 py-0.5 font-mono text-[11px] text-primary-foreground"
            {...props}
          />
        ),
        a: (props) => (
          <a
            className="underline underline-offset-2 text-primary-foreground hover:opacity-90"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          />
        ),
        ul: (props) => <ul className="my-1 list-disc pl-4 space-y-0.5" {...props} />,
        ol: (props) => <ol className="my-1 list-decimal pl-4 space-y-0.5" {...props} />,
        li: (props) => <li className="leading-relaxed" {...props} />
      }
    }

    return {
      h1: (props) => (
        <h1 className="text-xs font-bold text-foreground mt-2.5 mb-1 tracking-tight" {...props} />
      ),
      h2: (props) => (
        <h2 className="text-xs font-bold text-foreground mt-2 mb-1 tracking-tight" {...props} />
      ),
      h3: (props) => (
        <h3 className="text-xs font-semibold text-foreground mt-1.5 mb-0.5 tracking-tight" {...props} />
      ),
      h4: (props) => (
        <h4 className="text-[11px] font-semibold text-muted-foreground mt-1 mb-0.5" {...props} />
      ),
      p: (props) => (
        <p className="my-1.5 first:mt-0 last:mb-0 leading-relaxed select-text" {...props} />
      ),
      ul: (props) => (
        <ul className="my-1.5 list-disc pl-4 space-y-1 select-text" {...props} />
      ),
      ol: (props) => (
        <ol className="my-1.5 list-decimal pl-4 space-y-1 select-text" {...props} />
      ),
      li: (props) => (
        <li className="leading-relaxed" {...props} />
      ),
      blockquote: (props) => (
        <blockquote
          className="border-l-2 border-primary/50 pl-2.5 py-0.5 my-1.5 italic text-muted-foreground select-text"
          {...props}
        />
      ),
      pre: (props) => (
        <pre
          className="rounded-lg bg-background/90 border border-border/80 p-2.5 my-2 overflow-x-auto font-mono text-[11px] leading-snug select-text shadow-2xs"
          {...props}
        />
      ),
      code: (props) => {
        // If inside a <pre>, the pre already styles it; otherwise style inline code
        return (
          <code
            className="rounded-md bg-background/80 border border-border/60 px-1.5 py-0.5 font-mono text-[11px] text-foreground"
            {...props}
          />
        )
      },
      a: (props) => (
        <a
          className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity cursor-pointer"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        />
      ),
      strong: (props) => (
        <strong className="font-semibold text-foreground" {...props} />
      ),
      em: (props) => (
        <em className="italic text-foreground/90" {...props} />
      ),
      hr: (props) => (
        <hr className="my-2 border-border/60" {...props} />
      ),
      table: (props) => (
        <div className="my-2 w-full overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-left text-[11px] border-collapse" {...props} />
        </div>
      ),
      th: (props) => (
        <th className="border-b border-border/80 bg-muted/30 px-2 py-1 font-semibold text-foreground" {...props} />
      ),
      td: (props) => (
        <td className="border-b border-border/40 px-2 py-1" {...props} />
      )
    }
  }, [isUser])

  if (!content) return null

  return (
    <div className={cn('text-xs select-text break-words', className)}>
      <Markdown components={components} extensions={extensions}>
        {content}
      </Markdown>
    </div>
  )
}
