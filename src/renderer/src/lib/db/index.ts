import Dexie, { type Table } from 'dexie'

export type OutboxEntityType = 'boards' | 'lanes' | 'items'
export type OutboxActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'bulk_update'
  | 'bulk_move_order'
  | 'bulk_delete'

export interface OutboxMutation {
  id?: number // Dexie auto-increment primary key
  entityType: OutboxEntityType
  action: OutboxActionType
  boardId: number | string
  entityId?: number | string
  payload?: any
  timestamp: number
  attempts: number
  lastError?: string
  status: 'pending' | 'in-flight' | 'failed'
}

export interface SyncMetadata {
  key: string
  value: any
  updatedAt: string
}

export class KaizenDB extends Dexie {
  boards!: Table<Board, number>
  lanes!: Table<Lane, number>
  items!: Table<KanbanItem, number>
  outbox!: Table<OutboxMutation, number>
  syncMeta!: Table<SyncMetadata, string>

  constructor() {
    super('kaizen_local_first_db')
    this.version(1).stores({
      boards: 'id, owner, order, pinned, updated_at',
      lanes: 'id, board_id, order, updated_at',
      items: 'id, board_id, lane_id, order, priority, status, updated_at',
      outbox: '++id, entityType, action, boardId, entityId, timestamp, status',
      syncMeta: 'key'
    })
  }
}

export const db = new KaizenDB()
