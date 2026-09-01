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
  order?: number
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
  due_date?: string | null
  background?: string | null
  owner?: string | null
  created_at?: string
  updated_at?: string | null
}
