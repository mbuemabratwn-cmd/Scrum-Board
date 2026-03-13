import { useMemo, useState } from 'react'
import { MEMBERS } from '../mock/members'
import type { Task, TaskMember, TaskStatus } from '../types/task'

interface JiraCalendarLiteProps {
  tasks: Task[]
  onTaskOpen: (taskId: string) => void
}

type StatusFilter = 'all' | TaskStatus

interface CalendarCell {
  date: Date
  key: string
  inCurrentMonth: boolean
}

const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五']

function toDateKey(date: Date) {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

function toDateKeyFromTimestamp(timestamp: number | null) {
  if (!timestamp) {
    return null
  }
  return toDateKey(new Date(timestamp))
}

function toMonthTitle(year: number, month: number) {
  return `${year}年${month + 1}月`
}

function startOfBusinessWeek(date: Date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const offset = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + offset)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function endOfBusinessWeek(date: Date) {
  const start = startOfBusinessWeek(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 4)
  end.setHours(0, 0, 0, 0)
  return end
}

function buildBusinessCalendar(year: number, month: number) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const start = startOfBusinessWeek(first)
  const end = endOfBusinessWeek(last)
  const weeks: CalendarCell[][] = []

  const cursor = new Date(start)
  while (cursor <= end) {
    const week: CalendarCell[] = []
    for (let i = 0; i < 5; i += 1) {
      const cellDate = new Date(cursor)
      week.push({
        date: cellDate,
        key: toDateKey(cellDate),
        inCurrentMonth: cellDate.getMonth() === month,
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
    cursor.setDate(cursor.getDate() + 2)
  }

  return weeks
}

function getChipColor(priority: Task['priority']) {
  if (priority === 'high') {
    return 'border-[var(--color-priority-high-border)] bg-[var(--color-priority-high-tint)] text-[var(--color-text-primary)]'
  }
  if (priority === 'mid') {
    return 'border-[var(--color-priority-mid-border)] bg-[var(--color-priority-mid-tint)] text-[var(--color-text-primary)]'
  }
  return 'border-[var(--color-priority-low-border)] bg-[var(--color-priority-low-tint)] text-[var(--color-text-primary)]'
}

function getStatusLabel(status: TaskStatus) {
  if (status === 'pending') {
    return '待处理'
  }
  if (status === 'in_progress') {
    return '进行中'
  }
  return '已完成'
}

function JiraCalendarLite({ tasks, onTaskOpen }: JiraCalendarLiteProps) {
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [showUnscheduled, setShowUnscheduled] = useState(true)

  const monthTitle = useMemo(() => toMonthTitle(viewYear, viewMonth), [viewYear, viewMonth])

  const filteredTasks = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    return tasks.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false
      }
      if (!keyword) {
        return true
      }
      return (
        task.title.toLowerCase().includes(keyword) ||
        (task.description ?? '').toLowerCase().includes(keyword)
      )
    })
  }, [searchTerm, statusFilter, tasks])

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {}
    filteredTasks.forEach((task) => {
      const key = toDateKeyFromTimestamp(task.dueDate)
      if (!key) {
        return
      }
      if (!map[key]) {
        map[key] = []
      }
      map[key].push(task)
    })
    Object.values(map).forEach((list) => {
      list.sort((a, b) => b.updatedAt - a.updatedAt)
    })
    return map
  }, [filteredTasks])

  const unscheduledTasks = useMemo(
    () => filteredTasks.filter((task) => !task.dueDate).sort((a, b) => b.updatedAt - a.updatedAt),
    [filteredTasks],
  )

  const weeks = useMemo(
    () => buildBusinessCalendar(viewYear, viewMonth),
    [viewMonth, viewYear],
  )

  const goPrevMonth = () => {
    const next = new Date(viewYear, viewMonth - 1, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  const goNextMonth = () => {
    const next = new Date(viewYear, viewMonth + 1, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  const goToday = () => {
    const today = new Date()
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
  }

  return (
    <section className="flex h-full min-h-0 overflow-hidden rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] px-3 py-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goToday}
              className="rounded-[6px] border border-[var(--color-border-subtle)] px-2 py-1 text-[length:var(--fs-xs)] text-[var(--color-text-secondary)]"
            >
              今天
            </button>
            <button
              type="button"
              onClick={goPrevMonth}
              className="rounded-[6px] border border-[var(--color-border-subtle)] px-2 py-1 text-[length:var(--fs-xs)] text-[var(--color-text-secondary)]"
            >
              上月
            </button>
            <button
              type="button"
              onClick={goNextMonth}
              className="rounded-[6px] border border-[var(--color-border-subtle)] px-2 py-1 text-[length:var(--fs-xs)] text-[var(--color-text-secondary)]"
            >
              下月
            </button>
            <h3 className="ml-2 text-[length:var(--fs-md)] font-semibold text-[var(--color-text-primary)]">
              {monthTitle}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="搜索任务"
              className="h-8 w-[220px] rounded-[6px] border border-[var(--color-border-subtle)] bg-white px-2 text-[length:var(--fs-sm)] outline-none focus:border-[var(--color-accent-board)]"
            />
            {[
              { key: 'all' as StatusFilter, label: '全部' },
              { key: 'pending' as StatusFilter, label: '待处理' },
              { key: 'in_progress' as StatusFilter, label: '进行中' },
              { key: 'completed' as StatusFilter, label: '已完成' },
            ].map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatusFilter(filter.key)}
                className={`h-8 rounded-[6px] px-2 text-[length:var(--fs-xs)] ${
                  statusFilter === filter.key
                    ? 'bg-[var(--color-accent-board-tint)] text-[var(--color-accent-board-active)]'
                    : 'border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]'
                }`}
              >
                {filter.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowUnscheduled((prev) => !prev)}
              className="h-8 rounded-[6px] border border-[var(--color-border-subtle)] px-2 text-[length:var(--fs-xs)] text-[var(--color-text-secondary)]"
            >
              {showUnscheduled ? '隐藏未排期' : '显示未排期'}
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="min-h-0 min-w-0 flex-1 overflow-auto">
            <div className="grid min-w-[780px] grid-cols-5 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-muted)]">
              {WEEKDAY_LABELS.map((day) => (
                <div
                  key={day}
                  className="border-r border-[var(--color-border-subtle)] px-2 py-1 text-[length:var(--fs-xs)] font-medium text-[var(--color-text-secondary)] last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="min-w-[780px]">
              {weeks.map((week) => (
                <div key={week[0].key} className="grid grid-cols-5 border-b border-[var(--color-border-subtle)]">
                  {week.map((cell) => {
                    const dayTasks = tasksByDate[cell.key] ?? []
                    return (
                      <div
                        key={cell.key}
                        className={`min-h-[132px] border-r border-[var(--color-border-subtle)] p-1.5 last:border-r-0 ${
                          cell.inCurrentMonth ? 'bg-[var(--color-bg-surface)]' : 'bg-[#F8FAFC]'
                        }`}
                      >
                        <span
                          className={`mb-1 block text-[length:var(--fs-xs)] ${
                            cell.inCurrentMonth
                              ? 'text-[var(--color-text-primary)]'
                              : 'text-[var(--color-text-tertiary)]'
                          }`}
                        >
                          {cell.date.getDate()}日
                        </span>
                        <div className="space-y-1">
                          {dayTasks.slice(0, 3).map((task) => (
                            <button
                              key={task.id}
                              type="button"
                              onClick={() => onTaskOpen(task.id)}
                              className={`flex w-full items-center gap-1 rounded-[6px] border px-1.5 py-1 text-left text-[10px] ${getChipColor(task.priority)}`}
                              title={task.title}
                            >
                              <span className="truncate">{task.title}</span>
                            </button>
                          ))}
                          {dayTasks.length > 3 ? (
                            <span className="block text-[10px] text-[var(--color-text-tertiary)]">
                              +{dayTasks.length - 3} 项
                            </span>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {showUnscheduled ? (
            <aside className="w-[300px] border-l border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
              <div className="border-b border-[var(--color-border-subtle)] px-3 py-2">
                <h3 className="text-[length:var(--fs-md)] font-semibold text-[var(--color-text-primary)]">
                  未排期任务
                </h3>
              </div>
              <div className="h-[calc(100%-46px)] overflow-y-auto p-2">
                {unscheduledTasks.length === 0 ? (
                  <p className="rounded-[8px] border border-dashed border-[var(--color-border-subtle)] px-2 py-6 text-center text-[length:var(--fs-sm)] text-[var(--color-text-tertiary)]">
                    所有任务都已安排日期
                  </p>
                ) : (
                  <div className="space-y-2">
                    {unscheduledTasks.map((task) => {
                      const member = task.assignee ? MEMBERS[task.assignee as TaskMember] : null
                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => onTaskOpen(task.id)}
                          className={`w-full rounded-[8px] border px-2 py-2 text-left ${getChipColor(task.priority)}`}
                        >
                          <p className="truncate text-[length:var(--fs-sm)] font-medium text-[var(--color-text-primary)]">
                            {task.title}
                          </p>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--color-text-secondary)]">
                            <span>{getStatusLabel(task.status)}</span>
                            <span>{member ? member.short : '未指派'}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default JiraCalendarLite
