import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  platform: process.platform,
  onAuthCallback: (callback: (url: string) => void) => {
    const subscription = (_event: any, url: string) => callback(url)
    electronAPI.ipcRenderer.on('auth-callback', subscription)
    return () => {
      electronAPI.ipcRenderer.removeListener('auth-callback', subscription)
    }
  },
  openExternalUrl: (url: string) => {
    electronAPI.ipcRenderer.send('open-external-url', url)
  }
}

// Use contextBridge APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
