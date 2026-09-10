import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join, resolve } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { Resend } from 'resend'

const getResendClient = () => {
  const apiKey =
    process.env.RESEND_API_KEY ||
    process.env.VITE_RESEND_API_KEY ||
    ''
  return new Resend(apiKey)
}

let mainWindow: BrowserWindow | null = null

// Set explicit application name
app.setName('kaizen33')

// Register custom protocol for deep linking
const isDev = !app.isPackaged || is.dev || Boolean(process.defaultApp)
if (isDev) {
  const appPath = resolve(__dirname, '../../')
  app.setAsDefaultProtocolClient('kaizen', process.execPath, [appPath])
} else {
  app.setAsDefaultProtocolClient('kaizen')
}

// Ensure single instance lock for deep links
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()

      const url = commandLine.find((arg) => arg.startsWith('kaizen://'))
      if (url) {
        mainWindow.webContents.send('auth-callback', url)
      }
    }
  })
}

function createWindow(): void {
  const iconPath = resolve(__dirname, '../../resources/icon.ico')

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: 'kaizen33',
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.maximize()
    mainWindow?.show()

    // Handle deep link if app launched with protocol URL on Windows
    const url = process.argv.find((arg) => arg.startsWith('kaizen://'))
    if (url && mainWindow) {
      mainWindow.webContents.send('auth-callback', url)
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// IPC handler to open external URLs from renderer
ipcMain.on('open-external-url', (_event, url: string) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    shell.openExternal(url)
  }
})

// IPC handler to send email via Resend
ipcMain.handle(
  'send-email',
  async (
    _event,
    payload: {
      to: string
      subject: string
      html: string
      text?: string
      from?: string
      replyTo?: string
    }
  ) => {
    try {
      const fromEmail =
        payload.from ||
        process.env.RESEND_FROM_EMAIL ||
        'kaizen@kaizen33.space'

      console.log('[Resend Main] Dispatching email:', {
        from: fromEmail,
        to: payload.to,
        subject: payload.subject
      })

      const resend = getResendClient()
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        replyTo: payload.replyTo || 'wirabuana.imanuel@gmail.com',
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text
      })

      if (error) {
        console.error('[Resend Main] Error sending email:', error)
        return { success: false, error: (error as any).message || error }
      }

      console.log('[Resend Main] Email sent successfully:', data?.id)
      return { success: true, data }
    } catch (err: any) {
      console.error('[Resend Main] Unhandled exception sending email:', err)
      return { success: false, error: err?.message || String(err) }
    }
  }
)

// macOS deep link handler
app.on('open-url', (event, url) => {
  event.preventDefault()
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
    mainWindow.webContents.send('auth-callback', url)
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.kaizen.app')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

