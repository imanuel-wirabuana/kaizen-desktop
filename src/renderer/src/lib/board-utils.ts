import { CSSProperties } from 'react'

export type BoardBackgroundProps = {
  className?: string
  style?: CSSProperties
  isImage?: boolean
}

/**
 * Returns class names and inline styles for a board's background.
 * Supports:
 * - Image URLs (https://, http://, data:image/, relative paths)
 * - Tailwind class names (e.g. from-amber-500/15 to-rose-500/15, bg-slate-900)
 */
export function getBoardBackgroundStyleAndClass(background?: string | null): BoardBackgroundProps {
  if (!background || !background.trim()) {
    return {}
  }

  const bg = background.trim()

  // 1. Image URL detection (starts with http://, https://, data:image/, blob:, relative path, or ends with image ext)
  const isUrl =
    /^(https?:\/\/|data:image\/|blob:|\/|\.\/|\.\.\/)/i.test(bg) ||
    /\.(png|jpg|jpeg|webp|svg|gif|avif)(\?.*)?$/i.test(bg)

  if (isUrl) {
    const safeUrl = bg.replace(/"/g, '\\"')
    return {
      isImage: true,
      style: {
        backgroundImage: `url("${safeUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    }
  }

  // 2. Direct CSS Color or Gradient (#hex, rgb(), hsl(), linear-gradient())
  const isCssValue =
    /^(#|rgb|rgba|hsl|hsla|var|linear-gradient|radial-gradient|conic-gradient)/i.test(bg)

  if (isCssValue) {
    return {
      style: {
        background: bg
      }
    }
  }

  // 3. Fallback: Tailwind class names
  const tailwindClass = bg.includes('bg-')
    ? bg
    : bg.includes('from-')
      ? `bg-gradient-to-br ${bg}`
      : bg

  return {
    className: tailwindClass
  }
}
