import type { TaskStatus } from '../types/task'

export type NotificationKind = 'assignment' | 'statusChange' | 'taskCompleted' | 'dueSoon'

export interface NotificationSettings {
  assignment: boolean
  statusChange: boolean
  taskCompleted: boolean
  dueSoon: boolean
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  assignment: true,
  statusChange: true,
  taskCompleted: true,
  dueSoon: true,
}

const SETTINGS_KEY = 'scrum-board.notification.settings.v1'
const DISMISSED_PERMISSION_HINT_KEY = 'scrum-board.notification.permission.dismissed.v1'
const DUE_CHECK_DATE_KEY = 'scrum-board.notification.due.last-check-date.v1'
const DUE_REMINDER_FLAG_KEY = 'scrum-board.notification.due.reminded-tasks.v1'

export function loadNotificationSettings(): NotificationSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY)
    if (!raw) {
      return DEFAULT_NOTIFICATION_SETTINGS
    }
    const parsed = JSON.parse(raw) as Partial<NotificationSettings>
    return {
      assignment: parsed.assignment ?? true,
      statusChange: parsed.statusChange ?? true,
      taskCompleted: parsed.taskCompleted ?? true,
      dueSoon: parsed.dueSoon ?? true,
    }
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS
  }
}

export function saveNotificationSettings(settings: NotificationSettings) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function getNotificationPermissionState() {
  if (typeof window.Notification === 'undefined') {
    return 'unsupported' as const
  }
  return window.Notification.permission
}

export function shouldShowPermissionDeniedHint() {
  const dismissed = window.localStorage.getItem(DISMISSED_PERMISSION_HINT_KEY) === '1'
  return getNotificationPermissionState() === 'denied' && !dismissed
}

export function dismissPermissionDeniedHint() {
  window.localStorage.setItem(DISMISSED_PERMISSION_HINT_KEY, '1')
}

export function restorePermissionDeniedHint() {
  window.localStorage.removeItem(DISMISSED_PERMISSION_HINT_KEY)
}

export async function sendDesktopNotification(payload: {
  title: string
  body: string
  taskId?: string
}) {
  if (!window.desktop?.showNotification) {
    return false
  }
  return window.desktop.showNotification(payload)
}

export function subscribeNotificationTaskClick(listener: (taskId: string) => void) {
  if (!window.desktop?.onNotificationTaskClick) {
    return () => {}
  }
  return window.desktop.onNotificationTaskClick(listener)
}

export function getStatusLabel(status: TaskStatus) {
  if (status === 'pending') {
    return '待处理'
  }
  if (status === 'in_progress') {
    return '正在执行'
  }
  return '已完成'
}

export function getTodayDateKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function loadDueReminderCheckDate() {
  return window.localStorage.getItem(DUE_CHECK_DATE_KEY)
}

export function saveDueReminderCheckDate(dateKey: string) {
  window.localStorage.setItem(DUE_CHECK_DATE_KEY, dateKey)
}

export function loadDueReminderFlags() {
  try {
    const raw = window.localStorage.getItem(DUE_REMINDER_FLAG_KEY)
    if (!raw) {
      return {} as Record<string, true>
    }
    const parsed = JSON.parse(raw) as Record<string, true>
    return parsed ?? {}
  } catch {
    return {} as Record<string, true>
  }
}

export function saveDueReminderFlags(flags: Record<string, true>) {
  window.localStorage.setItem(DUE_REMINDER_FLAG_KEY, JSON.stringify(flags))
}

