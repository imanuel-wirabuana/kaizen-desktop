export const queryKeys = {
  boards: {
    all: ['boards'] as const,
    list: (userId?: string) => ['boards', 'list', userId ?? 'anonymous'] as const,
    detail: (boardId: number | string) => ['boards', 'detail', String(boardId)] as const
  },
  members: {
    all: ['members'] as const,
    list: (boardId: number | string) => ['members', 'list', String(boardId)] as const,
    permission: (boardId: number | string, userId?: string) =>
      ['members', 'permission', String(boardId), userId ?? 'anonymous'] as const
  },
  lanes: {
    all: ['lanes'] as const,
    list: (boardId: number | string) => ['lanes', 'list', String(boardId)] as const
  },
  items: {
    all: ['items'] as const,
    list: (boardId: number | string) => ['items', 'list', String(boardId)] as const
  }
}
