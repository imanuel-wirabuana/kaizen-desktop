import { NavSidebarBoards } from './nav-sidebar-boards'

export function NavPinnedBoards({ boards }: { boards?: Board[] } = {}) {
  return <NavSidebarBoards pinnedBoards={boards} />
}

export default NavPinnedBoards
