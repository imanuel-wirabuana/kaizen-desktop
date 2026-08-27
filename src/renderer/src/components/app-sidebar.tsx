import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { NavBoards, NavPinnedBoards, CreateBoardDrawer } from '@/components/boards'
import { usePinnedBoards, useUnpinnedBoards } from '@/hooks/use-boards'
import { useNavigationStore } from '@/stores/navigation'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pinnedBoards = usePinnedBoards()
  const unpinnedBoards = useUnpinnedBoards()
  const navigate = useNavigationStore((s) => s.navigate)

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
          <SidebarMenuItem>
            <CreateBoardDrawer />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavPinnedBoards boards={pinnedBoards} />
        <NavBoards boards={unpinnedBoards} />
      </SidebarContent>
      <SidebarFooter className="p-2">
        <span className="text-[10px] text-muted-foreground/70">
          Kaizen · 2026
        </span>
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar
