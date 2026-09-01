import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { AppSidebar } from '@/components/app-sidebar'
import { DynamicBreadcrumb } from '@/components/dynamic-breadcrumb'
import { ThemeToggle } from '@/components/theme-toggle'
import { useBoardsInit } from '@/hooks/use-boards'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { SearchCommand } from '@/components/search-command'
import { SignedIn, UserButton } from '@clerk/clerk-react'
import { DraftSidebar, TaskCardPreview } from '@/components/items'
import { LaneColumnPreview } from '@/components/lanes'
import { useLanesStore } from '@/stores/lanes'
import { useItemsStore } from '@/stores/items'

export function BoardsLayout({ children }: { children: React.ReactNode }) {
  useBoardsInit()

  const handleKanbanDragEnd = (event: any) => {
    const { source, target } = event.operation || {}
    if (!source || !target) return

    // Defer state updates to microtask queue so @dnd-kit completes its DOM event handling first
    queueMicrotask(() => {
      // 1. Lane Column Reordering
      if (source.type === 'lane') {
        const sourceLaneId = String(source.id)
        if (sourceLaneId === 'draft-lane-virtual' || sourceLaneId === 'null') return

        const realLanes = useLanesStore.getState().lanes.filter((l) => l.id !== null)

        // Primary path: sortable initialIndex vs current index from @dnd-kit
        const initialIdx = source.initialIndex
        const currentIdx = source.index

        if (
          initialIdx !== undefined &&
          currentIdx !== undefined &&
          initialIdx !== currentIdx &&
          initialIdx >= 0 &&
          initialIdx < realLanes.length &&
          currentIdx >= 0 &&
          currentIdx < realLanes.length
        ) {
          const reordered = [...realLanes]
          const [moved] = reordered.splice(initialIdx, 1)
          reordered.splice(currentIdx, 0, moved)
          useLanesStore.getState().reorderLanes(reordered)
          return
        }

        // Fallback path: target ID resolution
        let targetLaneId: string | null = null

        if (typeof target.id === 'string' && target.id.startsWith('lane-drop-target-')) {
          targetLaneId = target.id.replace('lane-drop-target-', '')
        } else if (target.type === 'lane') {
          targetLaneId = String(target.id)
        } else if (target.type === 'item') {
          const allItems = useItemsStore.getState().items
          const targetItem = allItems.find((i) => String(i.id) === String(target.id))
          if (targetItem && targetItem.lane_id !== null) {
            targetLaneId = String(targetItem.lane_id)
          }
        } else if (target.data?.laneId !== undefined && target.data.laneId !== null) {
          targetLaneId = String(target.data.laneId)
        }

        if (
          targetLaneId &&
          targetLaneId !== 'draft-lane-virtual' &&
          targetLaneId !== 'null' &&
          targetLaneId !== sourceLaneId
        ) {
          const oldIndex = realLanes.findIndex((l) => String(l.id) === sourceLaneId)
          const newIndex = realLanes.findIndex((l) => String(l.id) === targetLaneId)

          if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            const reordered = [...realLanes]
            const [moved] = reordered.splice(oldIndex, 1)
            reordered.splice(newIndex, 0, moved)
            useLanesStore.getState().reorderLanes(reordered)
          }
        }
        return
      }

      // 2. Task Item Drag Reordering & Cross-Lane Transfers
      if (source.type === 'item') {
        const itemId = Number(source.id)
        const allItems = useItemsStore.getState().items
        const activeItem = allItems.find((i) => String(i.id) === String(source.id))
        if (!activeItem) return

        // Determine the final lane from the sortable's group property
        let finalLaneId: number | null = null
        let finalIndex: number = 0
        let usedSortableState = false

        // Check if source has sortable group/index properties (cross-container move handled by dnd-kit)
        const finalGroup = source.group ?? source.initialGroup
        const sortableIndex = source.index

        if (finalGroup !== undefined && sortableIndex !== undefined) {
          usedSortableState = true
          if (finalGroup === 'draft' || finalGroup === null || finalGroup === undefined) {
            finalLaneId = null
          } else {
            finalLaneId = Number(finalGroup)
          }
          finalIndex = sortableIndex

          const initialGroup = source.initialGroup
          const initialIndex = source.initialIndex
          const initialLaneId = initialGroup === 'draft' || initialGroup === null || initialGroup === undefined
            ? null
            : Number(initialGroup)

          if (initialLaneId === finalLaneId && initialIndex === finalIndex) {
            usedSortableState = false
          }
        }

        if (usedSortableState) {
          const siblingItems = allItems
            .filter((i) =>
              String(i.id) !== String(source.id) &&
              ((finalLaneId === null && i.lane_id === null) || (finalLaneId !== null && i.lane_id === finalLaneId))
            )
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

          let newOrder: number
          if (siblingItems.length === 0) {
            newOrder = 100
          } else if (finalIndex <= 0) {
            newOrder = (siblingItems[0].order ?? 100) - 100
          } else if (finalIndex >= siblingItems.length) {
            newOrder = (siblingItems[siblingItems.length - 1].order ?? 0) + 100
          } else {
            const prevOrder = siblingItems[finalIndex - 1].order ?? 0
            const nextOrder = siblingItems[finalIndex].order ?? prevOrder + 200
            newOrder = (prevOrder + nextOrder) / 2
          }

          useItemsStore.getState().moveItem(itemId, finalLaneId, newOrder)
          return
        }

        // Fallback: target is a droppable zone (empty column body, draft sidebar)
        let targetLaneId: number | null = null

        if (target.id === 'draft-sidebar-drop-target' || target.id === 'draft-lane-virtual') {
          targetLaneId = null
        } else if (typeof target.id === 'string' && target.id.startsWith('lane-drop-target-')) {
          const rawId = target.id.replace('lane-drop-target-', '')
          targetLaneId = rawId === 'null' || rawId === 'undefined' ? null : Number(rawId)
        } else if (target.type === 'lane') {
          targetLaneId = target.id === null || target.id === 'draft-lane-virtual' ? null : Number(target.id)
        } else if (target.type === 'item') {
          const targetItem = allItems.find((i) => String(i.id) === String(target.id))
          if (targetItem) {
            targetLaneId = targetItem.lane_id ?? null

            const siblingItems = allItems
              .filter((i) =>
                String(i.id) !== String(source.id) &&
                ((targetLaneId === null && i.lane_id === null) || (targetLaneId !== null && i.lane_id === targetLaneId))
              )
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

            const targetIdx = siblingItems.findIndex((i) => String(i.id) === String(targetItem.id))
            if (targetIdx !== -1) {
              const currOrder = siblingItems[targetIdx].order ?? 100
              const prevOrder = targetIdx > 0 ? (siblingItems[targetIdx - 1].order ?? 0) : currOrder - 100
              useItemsStore.getState().moveItem(itemId, targetLaneId, (prevOrder + currOrder) / 2)
              return
            }
          }
        } else if (target.data?.laneId !== undefined) {
          targetLaneId = target.data.laneId !== null ? Number(target.data.laneId) : null
        }

        // Append to end of target lane
        const targetLaneItems = allItems
          .filter((i) =>
            String(i.id) !== String(source.id) &&
            ((targetLaneId === null && i.lane_id === null) || (targetLaneId !== null && i.lane_id === targetLaneId))
          )
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

        const maxOrder = targetLaneItems.length > 0 ? Math.max(...targetLaneItems.map((i) => i.order ?? 0)) : 0
        useItemsStore.getState().moveItem(itemId, targetLaneId, maxOrder + 100)
      }
    })
  }

  return (
    <SidebarProvider className="h-svh overflow-hidden flex w-full">
      {/* Left Navigation Sidebar (Independent Provider inside NavSidebarBoards) */}
      <AppSidebar />

      {/* Dedicated Kanban Workspace Provider (Encloses Center Canvas & Right Draft Sidebar) */}
      <DragDropProvider onDragEnd={handleKanbanDragEnd}>
        {/* Center Content Workspace Area */}
        <SidebarInset className="flex h-svh min-h-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b bg-background/80 px-3 backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <SidebarTrigger className="-ml-1 size-7" />
              <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
              <DynamicBreadcrumb />
            </div>

            <div className="flex items-center gap-2">
              <SearchCommand />
              <ThemeToggle />
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </header>
          <div className="flex flex-1 min-h-0 flex-col overflow-hidden p-2.5">{children}</div>
        </SidebarInset>

        {/* Kanban Drag Overlay */}
        <DragOverlay dropAnimation={null}>
          {(source) => {
            if (!source) return null

            if (source.type === 'lane') {
              const lanes = useLanesStore.getState().lanes.filter((l) => l.id !== null)
              const activeLane = lanes.find((l) => String(l.id) === String(source.id))
              if (!activeLane) return null
              const width = source.element ? source.element.getBoundingClientRect().width : undefined
              return (
                <div style={{ width: width ? `${width}px` : undefined }}>
                  <LaneColumnPreview lane={activeLane} />
                </div>
              )
            }

            if (source.type === 'item') {
              const items = useItemsStore.getState().items
              const activeItem = items.find((i) => String(i.id) === String(source.id))
              if (!activeItem) return null
              const width = source.element ? source.element.getBoundingClientRect().width : undefined
              return (
                <div style={{ width: width ? `${width}px` : undefined }}>
                  <TaskCardPreview item={activeItem} />
                </div>
              )
            }

            return null
          }}
        </DragOverlay>
      </DragDropProvider>
    </SidebarProvider>
  )
}

export default BoardsLayout
