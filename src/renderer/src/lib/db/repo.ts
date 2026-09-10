import { db } from './index'

/**
 * Local repository for Items
 */
export async function getLocalItems(boardId: number | string): Promise<KanbanItem[]> {
  const numBoardId = Number(boardId)
  if (isNaN(numBoardId)) return []
  return db.items.where('board_id').equals(numBoardId).sortBy('order')
}

export async function putLocalItem(item: KanbanItem): Promise<void> {
  await db.items.put(item)
}

export async function putLocalItems(items: KanbanItem[]): Promise<void> {
  await db.items.bulkPut(items)
}

export async function deleteLocalItem(id: number | string): Promise<void> {
  const numId = Number(id)
  if (!isNaN(numId)) {
    await db.items.delete(numId)
  }
}

export async function deleteLocalItems(ids: (number | string)[]): Promise<void> {
  const numIds = ids.map(Number).filter((id) => !isNaN(id))
  if (numIds.length > 0) {
    await db.items.bulkDelete(numIds)
  }
}

/**
 * Reconciles remote items into Dexie while protecting items with pending local mutations.
 */
export async function reconcileRemoteItems(
  boardId: number | string,
  remoteItems: KanbanItem[]
): Promise<KanbanItem[]> {
  const numBoardId = Number(boardId)
  if (isNaN(numBoardId)) return []

  // Check which items have pending un-synced mutations in the outbox
  const pendingOutbox = await db.outbox
    .where('boardId')
    .equals(boardId)
    .filter((m) => m.entityType === 'items' && m.status !== 'failed')
    .toArray()

  const pendingEntityIds = new Set(pendingOutbox.map((m) => String(m.entityId)))

  // Get current local items (including temporary local-only items)
  const localItems = await db.items.where('board_id').equals(numBoardId).toArray()
  const localMap = new Map(localItems.map((i) => [String(i.id), i]))

  const itemsToPut: KanbanItem[] = []

  for (const remote of remoteItems) {
    const key = String(remote.id)
    if (pendingEntityIds.has(key)) {
      // Keep local version because user has pending local changes
      const local = localMap.get(key)
      if (local) itemsToPut.push(local)
    } else {
      // Safe to adopt remote version
      itemsToPut.push(remote)
    }
  }

  // Also preserve any newly created local items that have not yet synced (negative temp IDs)
  for (const local of localItems) {
    if (typeof local.id === 'number' && local.id < 0 && pendingEntityIds.has(String(local.id))) {
      itemsToPut.push(local)
    }
  }

  // Bulk put into IndexedDB
  await db.items.bulkPut(itemsToPut)

  // Remove stale deleted items: any item in local that wasn't in remote and isn't a pending create
  const remoteIdSet = new Set(remoteItems.map((i) => String(i.id)))
  const idsToDelete = localItems
    .filter((l) => !remoteIdSet.has(String(l.id)) && !(typeof l.id === 'number' && l.id < 0))
    .map((l) => l.id)

  if (idsToDelete.length > 0) {
    await db.items.bulkDelete(idsToDelete)
  }

  return db.items.where('board_id').equals(numBoardId).sortBy('order')
}

/**
 * Local repository for Lanes
 */
export async function getLocalLanes(boardId: number | string): Promise<Lane[]> {
  const numBoardId = Number(boardId)
  if (isNaN(numBoardId)) return []
  return db.lanes.where('board_id').equals(numBoardId).sortBy('order')
}

export async function putLocalLane(lane: Lane): Promise<void> {
  if (lane.id !== null && lane.id !== undefined) {
    await db.lanes.put(lane)
  }
}

export async function putLocalLanes(lanes: Lane[]): Promise<void> {
  const realLanes = lanes.filter((l) => l.id !== null && l.id !== undefined)
  await db.lanes.bulkPut(realLanes)
}

export async function deleteLocalLane(id: number | string): Promise<void> {
  const numId = Number(id)
  if (!isNaN(numId)) {
    await db.lanes.delete(numId)
    // Cascade delete items in this lane locally
    await db.items.where('lane_id').equals(numId).delete()
  }
}

/**
 * Reconciles remote lanes into Dexie while protecting lanes with pending local mutations.
 */
export async function reconcileRemoteLanes(
  boardId: number | string,
  remoteLanes: Lane[]
): Promise<Lane[]> {
  const numBoardId = Number(boardId)
  if (isNaN(numBoardId)) return []

  const pendingOutbox = await db.outbox
    .where('boardId')
    .equals(boardId)
    .filter((m) => m.entityType === 'lanes' && m.status !== 'failed')
    .toArray()

  const pendingEntityIds = new Set(pendingOutbox.map((m) => String(m.entityId)))
  const localLanes = await db.lanes.where('board_id').equals(numBoardId).toArray()
  const localMap = new Map(localLanes.map((l) => [String(l.id), l]))

  const lanesToPut: Lane[] = []

  for (const remote of remoteLanes) {
    if (remote.id === null) continue
    const key = String(remote.id)
    if (pendingEntityIds.has(key)) {
      const local = localMap.get(key)
      if (local) lanesToPut.push(local)
    } else {
      lanesToPut.push(remote)
    }
  }

  // Preserve newly created local lanes
  for (const local of localLanes) {
    if (typeof local.id === 'number' && local.id < 0 && pendingEntityIds.has(String(local.id))) {
      lanesToPut.push(local)
    }
  }

  await db.lanes.bulkPut(lanesToPut)

  // Remove stale deleted lanes
  const remoteIdSet = new Set(remoteLanes.map((l) => String(l.id)))
  const idsToDelete = localLanes
    .filter((l) => l.id !== null && !remoteIdSet.has(String(l.id)) && !(typeof l.id === 'number' && l.id < 0))
    .map((l) => l.id as number)

  if (idsToDelete.length > 0) {
    await db.lanes.bulkDelete(idsToDelete)
  }

  return db.lanes.where('board_id').equals(numBoardId).sortBy('order')
}

/**
 * Local repository for Boards
 */
export async function getLocalBoards(userId?: string): Promise<Board[]> {
  if (!userId) {
    return db.boards.orderBy('order').toArray()
  }
  return db.boards.where('owner').equals(userId).sortBy('order')
}

export async function putLocalBoards(boards: Board[]): Promise<void> {
  await db.boards.bulkPut(boards)
}

export async function putLocalBoard(board: Board): Promise<void> {
  if (board.id) {
    await db.boards.put(board)
  }
}

export async function deleteLocalBoard(id: number | string): Promise<void> {
  const numId = Number(id)
  if (!isNaN(numId)) {
    await db.boards.delete(numId)
    await db.lanes.where('board_id').equals(numId).delete()
    await db.items.where('board_id').equals(numId).delete()
  }
}
