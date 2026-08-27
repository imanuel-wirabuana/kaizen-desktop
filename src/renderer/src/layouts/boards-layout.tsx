import { AppSidebar } from '@/components/app-sidebar'
import { DynamicBreadcrumb } from '@/components/dynamic-breadcrumb'
import { ThemeToggle } from '@/components/theme-toggle'
import { useBoardsInit } from '@/hooks/use-boards'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { SearchCommand } from '@/components/search-command'
import { SignedIn, UserButton } from '@clerk/clerk-react'

export function BoardsLayout({ children }: { children: React.ReactNode }) {
  useBoardsInit()

  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar />
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
    </SidebarProvider>
  )
}

export default BoardsLayout
