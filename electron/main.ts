import path from 'node:path'
import { app, BrowserWindow, ipcMain } from 'electron'
import windowStateKeeper from 'electron-window-state'
import {
  showNotification,
  type DesktopNotificationPayload,
} from './services/notification'

const isDevelopment = !app.isPackaged
let mainWindow: BrowserWindow | null = null

function createMainWindow() {
  const state = windowStateKeeper({
    defaultWidth: 1280,
    defaultHeight: 800,
  })

  const window = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    minWidth: 960,
    minHeight: 600,
    show: false,
    backgroundColor: '#f6f3ee',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow = window
  state.manage(window)

  window.once('ready-to-show', () => {
    window.show()
  })

  if (isDevelopment && process.env.VITE_DEV_SERVER_URL) {
    window.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    window.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  window.on('closed', () => {
    if (mainWindow === window) {
      mainWindow = null
    }
  })

  return window
}

function focusWindowAndOpenTask(taskId?: string) {
  const targetWindow = mainWindow && !mainWindow.isDestroyed() ? mainWindow : createMainWindow()

  if (targetWindow.isMinimized()) {
    targetWindow.restore()
  }
  if (!targetWindow.isVisible()) {
    targetWindow.show()
  }
  targetWindow.focus()

  if (!taskId) {
    return
  }

  const sendOpenTask = () => {
    targetWindow.webContents.send('notification:task-click', taskId)
  }

  if (targetWindow.webContents.isLoading()) {
    targetWindow.webContents.once('did-finish-load', sendOpenTask)
  } else {
    sendOpenTask()
  }
}

app.whenReady().then(() => {
  createMainWindow()

  ipcMain.handle('notification:show', (_event, payload: DesktopNotificationPayload) => {
    if (!payload || typeof payload.title !== 'string' || typeof payload.body !== 'string') {
      return false
    }
    return showNotification(payload, {
      onClickTask: (taskId) => {
        focusWindowAndOpenTask(taskId)
      },
    })
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
