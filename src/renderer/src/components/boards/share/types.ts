import { ExpirationOption, MaxUsesOption } from '@/services/invites'

export type ShareBoardModalProps = {
  board: Board | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export type ShareRole = 'view' | 'edit'

export type { ExpirationOption, MaxUsesOption }

export const ROLE_OPTIONS: ReadonlyArray<{ value: ShareRole; label: string }> = [
  { value: 'view', label: 'Viewer' },
  { value: 'edit', label: 'Editor' }
]

export const EXPIRES_OPTIONS: ReadonlyArray<{ value: ExpirationOption; label: string }> = [
  { value: 'never', label: 'Never' },
  { value: '1_hour', label: '1 hour' },
  { value: '1_day', label: '1 day' },
  { value: '7_days', label: '7 days' },
  { value: '30_days', label: '30 days' }
]

export const MAX_USES_OPTIONS: ReadonlyArray<{ value: MaxUsesOption; label: string }> = [
  { value: 'unlimited', label: 'Unlimited' },
  { value: '1', label: '1 use' },
  { value: '5', label: '5 uses' },
  { value: '10', label: '10 uses' }
]
