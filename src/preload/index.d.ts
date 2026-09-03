import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      platform: NodeJS.Platform
      onAuthCallback?: (callback: (url: string) => void) => () => void
      openExternalUrl?: (url: string) => void
    }
  }
}
