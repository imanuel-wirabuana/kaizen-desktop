import { useEffect, useMemo } from 'react'
import { useUser } from '@/providers/auth-provider'
import { useBoardDetailQuery } from '@/queries/boards'
import { useBoardPermissionQuery } from '@/queries/members'
import { useLanesQuery } from '@/queries/lanes'
import { useItemsQuery } from '@/queries/items'
import { useRealtimeCanvasSync } from '@/queries/use-realtime-sync'
import { useLanesStore, selectLanes } from '@/stores/lanes'
import { useItemsStore, selectItems } from '@/stores/items'
import { useBoardPermissions, BoardPermissions } from './use-board-permissions'

export interface BoardDetailData {
  board: Board | null
  lanes: Lane[]
  canvasLanes: Lane[]
  items: KanbanItem[]
  draftItemsCount: number
  loading: boolean
  lanesLoading: boolean
  permissions: BoardPermissions
}

export function useBoardDetailData(boardId: number | string): BoardDetailData {
  const { user } = useUser()

  const { data: boardData, isLoading: isBoardLoading } = useBoardDetailQuery(boardId, user?.id)
  const { data: dbPermission } = useBoardPermissionQuery(boardId, user?.id)
  useRealtimeCanvasSync(boardId, user?.id)

  const { data: qLanesData, isLoading: isLanesLoading } = useLanesQuery(boardId)
  const { data: qItemsData } = useItemsQuery(boardId)

  // Ensure current boardId is always synchronized in stores immediately
  useEffect(() => {
    useLanesStore.setState({ boardId })
    useItemsStore.setState({ boardId })
  }, [boardId])

  // Synchronize fresh query data to stores so DnD and local actions stay in sync
  useEffect(() => {
    if (qLanesData !== undefined) {
      useLanesStore.setState({ boardId, lanes: qLanesData, loading: isLanesLoading })
    }
  }, [boardId, qLanesData, isLanesLoading])

  useEffect(() => {
    if (qItemsData !== undefined) {
      useItemsStore.setState({ boardId, items: qItemsData, loading: false })
    }
  }, [boardId, qItemsData])

  const board = boardData || null
  const permissions = useBoardPermissions(board, dbPermission, user?.id)

  // Lanes and Items: prioritize store if active, fallback to React Query cache
  const storeLanes = useLanesStore(selectLanes)
  const storeItems = useItemsStore(selectItems)

  const lanes = useMemo(() => {
    const fromStore = storeLanes.filter((l) => String(l.board_id) === String(boardId))
    if (fromStore.length > 0) return fromStore
    return (qLanesData || []).filter((l) => String(l.board_id) === String(boardId))
  }, [storeLanes, qLanesData, boardId])

  const items = useMemo(() => {
    const fromStore = storeItems.filter((i) => String(i.board_id) === String(boardId))
    if (fromStore.length > 0) return fromStore
    return (qItemsData || []).filter((i) => String(i.board_id) === String(boardId))
  }, [storeItems, qItemsData, boardId])

  // Filter canvas lanes (real user lanes with non-null id)
  const canvasLanes = useMemo(() => lanes.filter((l) => l.id !== null), [lanes])

  // Skeletons only show if query is loading AND there are zero cached canvas lanes
  const lanesLoading = isLanesLoading && canvasLanes.length === 0

  // Count items in Draft (lane_id === null)
  const draftItemsCount = useMemo(() => items.filter((i) => i.lane_id === null).length, [items])

  // Only show the full page skeleton if we have literally NO board data at all (first load)
  const loading = isBoardLoading && !board

  return {
    board,
    lanes,
    canvasLanes,
    items,
    draftItemsCount,
    loading,
    lanesLoading,
    permissions
  }
}
