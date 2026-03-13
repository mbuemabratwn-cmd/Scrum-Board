import { useEffect, useRef, useState } from 'react'
import type { NotificationSettings } from '../services/notification'

interface SettingsMenuProps {
  notificationSettings: NotificationSettings
  onToggleNotificationSetting: (key: keyof NotificationSettings) => void
  onSignOut: () => void
}

const SETTING_LABELS: Array<{ key: keyof NotificationSettings; label: string }> = [
  { key: 'assignment', label: '任务分配通知' },
  { key: 'statusChange', label: '状态变更通知' },
  { key: 'taskCompleted', label: '任务完成通知' },
  { key: 'dueSoon', label: '截止日期提醒' },
]

function SettingsMenu({
  notificationSettings,
  onToggleNotificationSetting,
  onSignOut,
}: SettingsMenuProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleEsc)

    return () => {
      window.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleEsc)
    }
  }, [open])

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-[6px] border border-[var(--color-border-subtle)] px-2 py-1 text-[length:var(--fs-xs)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover-card)]"
      >
        设置
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[240px] rounded-[8px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-2 shadow-[0_8px_24px_rgba(20,20,25,0.14)]">
          <div className="mb-2">
            <p className="px-2 text-[length:var(--fs-xs)] text-[var(--color-text-tertiary)]">通知设置</p>
            <div className="mt-1 space-y-1">
              {SETTING_LABELS.map((item) => {
                const checked = notificationSettings[item.key]
                return (
                  <label
                    key={item.key}
                    className="flex cursor-pointer items-center justify-between rounded-[6px] px-2 py-1.5 hover:bg-[var(--color-bg-hover-card)]"
                  >
                    <span className="text-[length:var(--fs-sm)] text-[var(--color-text-secondary)]">
                      {item.label}
                    </span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleNotificationSetting(item.key)}
                      className="h-4 w-4 accent-[var(--color-accent-board)]"
                    />
                  </label>
                )
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onSignOut()
              setOpen(false)
            }}
            className="w-full rounded-[6px] px-2 py-1.5 text-left text-[length:var(--fs-sm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover-card)]"
          >
            退出登录
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default SettingsMenu
