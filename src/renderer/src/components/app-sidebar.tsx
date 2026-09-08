import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem
} from '@/components/ui/sidebar'
import { NavSidebarBoards } from '@/components/boards'
import { useNavigationStore } from '@/stores/navigation'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigationStore((s) => s.navigate)

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="gap-1.5 p-2">
        <SidebarMenu>
          <SidebarMenuItem className="px-1 py-1">
            <button
              type="button"
              onClick={() => navigate({ name: 'landing' })}
              className="flex w-full cursor-pointer items-center gap-2.5 text-left py-0.5"
            >
              <img
                src="/icon.ico"
                alt="Kaizen"
                className="size-8 object-contain shadow-sm"
              />
              <span className="font-brand text-base tracking-wide text-foreground/75 select-none">
                kaizen33
              </span>
            </button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavSidebarBoards />
      </SidebarContent>

      <SidebarFooter className="p-2">
        <span className="text-[10px] text-muted-foreground/70">
          kaizen33 · 2026
        </span>
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar

