import { ElectronAPI } from '@electron-toolkit/preload'

export type SendEmailPayload = {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
}

export type SendEmailResult = {
  success: boolean
  data?: any
  error?: string
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      platform: NodeJS.Platform
      onAuthCallback?: (callback: (url: string) => void) => () => void
      openExternalUrl?: (url: string) => void
      sendEmail?: (payload: SendEmailPayload) => Promise<SendEmailResult>
    }
  }
}
