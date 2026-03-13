import { MEMBERS } from '../mock/members'
import SettingsMenu from './SettingsMenu'
import type { NotificationSettings } from '../services/notification'
import type { TaskMember } from '../types/task'

interface TopBarProps {
  userName: string
  boardTitle: string
  syncText: string
  syncConnected: boolean
  currentMember: TaskMember | null
  memberPresence: Record<TaskMember, boolean>
  todayNewCount: number
  inProgressCount: number
  weekDoneCount: number
  isPersonalView: boolean
  notificationSettings: NotificationSettings
  showPermissionDeniedHint: boolean
  onToggleNotificationSetting: (key: keyof NotificationSettings) => void
  onClosePermissionDeniedHint: () => void
  onCreateTask: () => void
  onSignOut: () => void
}

function TopBar({
  userName,
  boardTitle,
  syncText,
  syncConnected,
  currentMember,
  memberPresence,
  todayNewCount,
  inProgressCount,
  weekDoneCount,
  isPersonalView,
  notificationSettings,
  showPermissionDeniedHint,
  onToggleNotificationSetting,
  onClosePermissionDeniedHint,
  onCreateTask,
  onSignOut,
}: TopBarProps) {
  return (
    <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-5 py-2">
      <div className="flex min-h-[64px] items-center justify-between gap-4">
        <div className="flex min-w-[260px] items-center gap-3">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded bg-[var(--color-accent-board-tint)] text-sm font-semibold text-[var(--color-accent-board-active)]"
            title="当前用户"
          >
            {userName.slice(0, 1)}
          </span>
          <div className="leading-snug">
            <p className="text-[length:var(--fs-lg)] font-semibold text-[var(--color-text-primary)]">
              {boardTitle}
            </p>
            <p className="text-[length:var(--fs-sm)] text-[var(--color-text-secondary)]">
              {userName} · {isPersonalView ? '个人视图' : '公开视图'}
            </p>
          </div>
          <SettingsMenu
            notificationSettings={notificationSettings}
            onToggleNotificationSetting={onToggleNotificationSetting}
            onSignOut={onSignOut}
          />
        </div>

        <div className="flex items-center gap-2 rounded-md bg-[var(--color-accent-board-tint)] px-3 py-1 text-[length:var(--fs-md)] text-[var(--color-text-secondary)]">
          <span
            className={`inline-flex h-2.5 w-2.5 rounded-full ${
              syncConnected
                ? 'animate-pulse bg-[var(--color-status-online)]'
                : 'bg-[var(--color-status-offline)]'
            }`}
          />
          {syncText}
        </div>

        <div className="flex items-center gap-3 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-3 py-2">
          <span className="text-[length:var(--fs-xs)] text-[var(--color-text-tertiary)]">优先级</span>
          <span className="inline-flex items-center gap-1 text-[length:var(--fs-xs)] text-[var(--color-text-secondary)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-priority-high)]" />
            高
          </span>
          <span className="inline-flex items-center gap-1 text-[length:var(--fs-xs)] text-[var(--color-text-secondary)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-priority-mid)]" />
            中
          </span>
          <span className="inline-flex items-center gap-1 text-[length:var(--fs-xs)] text-[var(--color-text-secondary)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-priority-low)]" />
            低
          </span>
        </div>

        <div className="hidden items-center gap-3 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-3 py-2 xl:flex">
          <span className="text-[length:var(--fs-xs)] text-[var(--color-text-tertiary)]">成员在线</span>
          {(Object.keys(MEMBERS) as TaskMember[])
            .filter((member) => member !== currentMember)
            .map((member) => (
              <span
                key={member}
                className="inline-flex items-center gap-1 text-[length:var(--fs-xs)] text-[var(--color-text-secondary)]"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    memberPresence[member]
                      ? 'bg-[var(--color-status-online)]'
                      : 'bg-[var(--color-text-tertiary)]'
                  }`}
                />
                {MEMBERS[member].name}
              </span>
            ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCreateTask}
            className="h-10 rounded-md bg-[var(--color-accent-board)] px-4 text-[length:var(--fs-md)] font-medium text-white hover:bg-[var(--color-accent-board-hover)] active:bg-[var(--color-accent-board-active)]"
          >
            + 新建任务
          </button>
          <div className="hidden items-center gap-4 text-[length:var(--fs-md)] text-[var(--color-text-secondary)] lg:flex">
            <span>今日新增 {todayNewCount}</span>
            <span>进行中 {inProgressCount}</span>
            <span>本周完成 {weekDoneCount}</span>
          </div>
        </div>
      </div>

      {showPermissionDeniedHint ? (
        <div className="mt-2 flex h-7 items-center justify-between rounded-[6px] border border-[var(--color-priority-high-border)] bg-[var(--color-priority-high-tint)] px-3 text-[length:var(--fs-sm)] text-[var(--color-text-secondary)]">
          <span>系统通知权限未开启</span>
          <button
            type="button"
            onClick={onClosePermissionDeniedHint}
            className="rounded border border-[var(--color-border-subtle)] px-1.5 py-0.5 text-[length:var(--fs-xs)]"
          >
            关闭
          </button>
        </div>
      ) : null}
    </header>
  )
}

export default TopBar
