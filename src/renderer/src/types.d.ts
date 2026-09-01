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
  id: number
  board_id?: number | null
  title?: string | null
  description?: string | null
  background?: string | null
  order?: number | null
  updated_at?: string | null
  created_at?: string
}

