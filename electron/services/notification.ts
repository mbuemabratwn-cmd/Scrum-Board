import { Notification } from 'electron'

export interface DesktopNotificationPayload {
  title: string
  body: string
  taskId?: string
}

export interface ShowNotificationOptions {
  onClickTask?: (taskId?: string) => void
}

export function showNotification(
  payload: DesktopNotificationPayload,
  options: ShowNotificationOptions = {},
) {
  if (!Notification.isSupported()) {
    return false
  }

  const notification = new Notification({
    title: payload.title,
    body: payload.body,
  })

  notification.on('click', () => {
    options.onClickTask?.(payload.taskId)
  })

  notification.show()
  return true
}

