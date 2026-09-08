/**
 * Wallpaper utilities for generating random background images using SourceSplash API.
 */

export interface SampleWallpaper {
  id: string
  label: string
  query: string
  url: string
}

export const SOURCESPLASH_RANDOM_BASE_URL = 'https://www.sourcesplash.com/i/random'

/**
 * Generates a random alphanumeric string with a length between minLength and maxLength (inclusive).
 * Default length is 1 to 10 characters.
 */
export function generateRandomString(minLength = 1, maxLength = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const min = Math.max(1, minLength)
  const max = Math.max(min, maxLength)
  const length = Math.floor(Math.random() * (max - min + 1)) + min

  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Returns a SourceSplash random image URL with a random or specified query string (1-10 chars).
 */
export function getSourceSplashUrl(query?: string): string {
  const q = query && query.trim() ? query.trim() : generateRandomString(1, 10)
  return `${SOURCESPLASH_RANDOM_BASE_URL}?q=${encodeURIComponent(q)}`
}

/**
 * Generates an array of random sample wallpapers using the SourceSplash API.
 * Each item has a distinct random query string (1-10 chars).
 */
export function generateRandomSampleWallpapers(count = 10): SampleWallpaper[] {
  const timestamp = Date.now()
  return Array.from({ length: count }, (_, index) => {
    const query = generateRandomString(1, 10)
    return {
      id: `sourcesplash-${timestamp}-${index}-${query}`,
      label: `Wallpaper ${index + 1}`,
      query,
      url: getSourceSplashUrl(query)
    }
  })
}

/**
 * Initial sample wallpapers preset containing 10 random SourceSplash images.
 */
export const SAMPLE_IMAGE_PRESETS: SampleWallpaper[] = generateRandomSampleWallpapers(10)
