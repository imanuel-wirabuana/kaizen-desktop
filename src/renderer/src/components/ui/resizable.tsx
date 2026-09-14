import * as React from 'react'
import { GripVertical } from 'lucide-react'
import {
  PanelGroup,
  Panel,
  PanelResizeHandle
} from 'react-resizable-panels'
import { cn } from '@/lib/utils'

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof PanelGroup>) {
  return (
    <PanelGroup
      data-slot="resizable-panel-group"
      className={cn(
        'flex h-full w-full data-[panel-group-direction=vertical]:flex-col',
        className
      )}
      {...props}
    />
  )
}

function ResizablePanel({
  className,
  ...props
}: React.ComponentProps<typeof Panel>) {
  return (
    <Panel
      data-slot="resizable-panel"
      className={cn(className)}
      {...props}
    />
  )
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof PanelResizeHandle> & {
  withHandle?: boolean
}) {
  return (
    <PanelResizeHandle
      data-slot="resizable-handle"
      className={cn(
        'relative flex items-center justify-center bg-transparent hover:bg-primary/20 active:bg-primary/30 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring select-none z-20',
        'w-1.5 cursor-col-resize after:absolute after:inset-y-0 after:left-1/2 after:w-3 after:-translate-x-1/2',
        'data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:h-2 data-[panel-group-direction=vertical]:cursor-row-resize data-[panel-group-direction=vertical]:after:inset-x-0 data-[panel-group-direction=vertical]:after:top-1/2 data-[panel-group-direction=vertical]:after:h-3 data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0',
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-7 w-3.5 items-center justify-center rounded-sm border bg-card/95 backdrop-blur-xs shadow-2xs hover:border-primary/50 transition-colors data-[panel-group-direction=vertical]:h-3.5 data-[panel-group-direction=vertical]:w-8 [&[data-panel-group-direction=vertical]>svg]:rotate-90">
          <GripVertical className="size-2.5 text-muted-foreground/70" />
        </div>
      )}
    </PanelResizeHandle>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
