import { NavSidebarBoards } from './nav-sidebar-boards'

export function NavBoards({ boards }: { boards?: Board[] } = {}) {
  return <NavSidebarBoards unpinnedBoards={boards} />
}

export default NavBoards
