type OwnerInfo = {
  id?: string
  name?: string | null
  email?: string | null
  avatar_url?: string | null
  [key: string]: any
} | null

type Board = {
  id?: number
  title?: string | null
  created_at?: string
  icon?: string | null
  description?: string | null
  pinned?: boolean | null
  updated_at?: string | null
  background?: string | null
  owner?: string | null
  owner_info?: OwnerInfo
  order?: number
  last_activity?: string | null
  role?: 'owner' | 'edit' | 'view'
}

type BoardInvite = {
  id: number
  board_id: number | null
  code: string | null
  permission: 'view' | 'edit' | null
  max_uses: number | null
  use_count: number
  revoked: boolean
  created_by: string | null
  expires_at?: string | null
  created_at: string
}

type BoardMember = {
  id: number
  board_id: number | null
  user_id: string | null
  user_email?: string | null
  user_name?: string | null
  email?: string | null
  full_name?: string | null
  permission: 'view' | 'edit' | 'owner' | null
  created_at: string
  updated_at?: string | null
}

type Lane = {
  id: number | null
  board_id?: number | null
  title?: string | null
  icon?: string | null
  description?: string | null
  background?: string | null
  order?: number | null
  owner?: string | null
  owner_info?: OwnerInfo
  updated_at?: string | null
  created_at?: string
  isVirtual?: boolean
}

type KanbanItem = {
  id: number
  lane_id?: number | null
  board_id: number
  title?: string | null
  icon?: string | null
  description?: string | null
  order?: number | null
  priority?: number | null
  start_date?: string | null
  due_date?: string | null
  status?: boolean | null
  assignee?: string | null
  background?: string | null
  owner?: string | null
  owner_info?: OwnerInfo
  created_at?: string
  updated_at?: string | null
}

