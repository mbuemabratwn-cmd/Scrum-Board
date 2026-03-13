import { contextBridge, ipcRenderer } from 'electron'

type NotificationClickListener = (taskId: string) => void

const notificationClickListeners = new Set<NotificationClickListener>()

ipcRenderer.on('notification:task-click', (_event, taskId: string) => {
  if (typeof taskId !== 'string' || !taskId) {
    return
  }
  notificationClickListeners.forEach((listener) => {
    listener(taskId)
  })
})

contextBridge.exposeInMainWorld('desktop', {
  platform: process.platform,
  electronVersion: process.versions.electron,
  showNotification: (payload: { title: string; body: string; taskId?: string }) =>
    ipcRenderer.invoke('notification:show', payload),
  onNotificationTaskClick: (listener: NotificationClickListener) => {
    notificationClickListeners.add(listener)
    return () => {
      notificationClickListeners.delete(listener)
    }
  },
})
