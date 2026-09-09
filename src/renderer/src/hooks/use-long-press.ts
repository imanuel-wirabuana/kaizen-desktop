import { useRef, useCallback } from 'react'

export interface UseLongPressOptions {
  threshold?: number
  disabled?: boolean
  onLongPress: () => void
  onClick?: (e: React.MouseEvent) => void
}

export function useLongPress({
  threshold = 450,
  disabled = false,
  onLongPress,
  onClick
}: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPressTriggeredRef = useRef(false)
  const startCoordsRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || e.button === 2) return // Ignore right-click or if disabled

      isLongPressTriggeredRef.current = false
      startCoordsRef.current = { x: e.clientX, y: e.clientY }

      clear()

      timerRef.current = setTimeout(() => {
        isLongPressTriggeredRef.current = true
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate(40)
          } catch {
            // Ignore vibration errors if not permitted
          }
        }
        onLongPress()
      }, threshold)
    },
    [disabled, threshold, onLongPress, clear]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!timerRef.current) return
      const dx = e.clientX - startCoordsRef.current.x
      const dy = e.clientY - startCoordsRef.current.y
      if (Math.hypot(dx, dy) > 8) {
        clear() // Moved too far, treat as scrolling or dragging
      }
    },
    [clear]
  )

  const handlePointerUp = useCallback(() => {
    clear()
  }, [clear])

  const handlePointerCancel = useCallback(() => {
    clear()
  }, [clear])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isLongPressTriggeredRef.current) {
        e.preventDefault()
        e.stopPropagation()
        isLongPressTriggeredRef.current = false
        return
      }
      onClick?.(e)
    },
    [onClick]
  )

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
    onClick: handleClick
  }
}
