import { useState } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from '@/components/ui/sidebar'
import { NavSidebarBoards, CreateBoardDrawer, JoinBoardModal } from '@/components/boards'
import { usePinnedBoards, useUnpinnedBoards } from '@/hooks/use-boards'
import { useNavigationStore } from '@/stores/navigation'
import { LogIn } from 'lucide-react'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pinnedBoards = usePinnedBoards()
  const unpinnedBoards = useUnpinnedBoards()
  const navigate = useNavigationStore((s) => s.navigate)
  const [joinModalOpen, setJoinModalOpen] = useState(false)

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="gap-1.5 p-2">
        <SidebarMenu>
          <SidebarMenuItem className="px-1 py-1">
            <button
              type="button"
              onClick={() => navigate({ name: 'landing' })}
              className="flex w-full cursor-pointer items-center gap-1.5 text-left"
            >
              <span className="flex size-6 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                改
              </span>
              <span className="text-sm font-semibold tracking-tight">Kaizen</span>
            </button>
          </SidebarMenuItem>
          <SidebarMenuItem className="flex items-center gap-1">
            <div className="flex-1">
              <CreateBoardDrawer />
            </div>
            <SidebarMenuButton
              onClick={() => setJoinModalOpen(true)}
              className="size-8 justify-center rounded-md border border-sidebar-border bg-sidebar-accent/50 hover:bg-sidebar-accent text-sidebar-foreground"
              title="Join Board"
            >
              <LogIn className="size-4" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavSidebarBoards pinnedBoards={pinnedBoards} unpinnedBoards={unpinnedBoards} />
      </SidebarContent>

      <SidebarFooter className="p-2">
        <span className="text-[10px] text-muted-foreground/70">
          Kaizen · 2026
        </span>
      </SidebarFooter>

      <JoinBoardModal open={joinModalOpen} onOpenChange={setJoinModalOpen} />
    </Sidebar>
  )
}

export default AppSidebar

