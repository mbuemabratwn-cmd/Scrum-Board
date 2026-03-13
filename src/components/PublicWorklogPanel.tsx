import { useMemo, useState } from 'react'
import { MEMBERS } from '../mock/members'
import type { TaskMember } from '../types/task'
import type { WorklogEntry } from '../types/worklog'

type PeriodMode = 'week' | 'month'

interface PublicWorklogPanelProps {
  entries: WorklogEntry[]
  loading: boolean
  currentMember: TaskMember | null
  onCreate: (payload: { member: TaskMember; content: string }) => Promise<void>
  onDelete: (entryId: string) => Promise<void>
}

function formatDateSlash(date: Date) {
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${m}/${d}`
}

function getIsoWeekInfo(date: Date) {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = utcDate.getUTCDay() || 7
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return { year: utcDate.getUTCFullYear(), week: weekNo }
}

function toWeekKey(date: Date) {
  const info = getIsoWeekInfo(date)
  return `${info.year}-W${`${info.week}`.padStart(2, '0')}`
}

function weekStartFromKey(weekKey: string) {
  const [yearPart, weekPart] = weekKey.split('-W')
  const year = Number(yearPart)
  const week = Number(weekPart)

  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7))
  const day = simple.getUTCDay()
  if (day <= 4 && day > 0) {
    simple.setUTCDate(simple.getUTCDate() - day + 1)
  } else {
    simple.setUTCDate(simple.getUTCDate() + 8 - day)
  }

  return new Date(simple.getUTCFullYear(), simple.getUTCMonth(), simple.getUTCDate())
}

function weekLabel(weekKey: string) {
  const start = weekStartFromKey(weekKey)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const info = getIsoWeekInfo(start)
  return `${info.year}年第${info.week}周 (${formatDateSlash(start)}-${formatDateSlash(end)})`
}

function shiftWeekKey(weekKey: string, deltaWeek: number) {
  const start = weekStartFromKey(weekKey)
  start.setDate(start.getDate() + deltaWeek * 7)
  return toWeekKey(start)
}

function toMonthKey(date: Date) {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  return `${y}-${m}`
}

function monthLabel(monthKey: string) {
  const [yearPart, monthPart] = monthKey.split('-')
  return `${Number(yearPart)}年${Number(monthPart)}月`
}

function shiftMonthKey(monthKey: string, deltaMonth: number) {
  const [yearPart, monthPart] = monthKey.split('-')
  const year = Number(yearPart)
  const month = Number(monthPart) - 1
  const next = new Date(year, month + deltaMonth, 1)
  return toMonthKey(next)
}

function monthStartFromKey(monthKey: string) {
  const [yearPart, monthPart] = monthKey.split('-')
  return new Date(Number(yearPart), Number(monthPart) - 1, 1)
}

function buildWeekOptions(entries: WorklogEntry[], selectedWeekKey: string) {
  const keySet = new Set<string>()
  entries.forEach((entry) => keySet.add(toWeekKey(new Date(entry.createdAt))))

  const center = weekStartFromKey(selectedWeekKey)
  for (let i = -20; i <= 20; i += 1) {
    const d = new Date(center)
    d.setDate(center.getDate() + i * 7)
    keySet.add(toWeekKey(d))
  }

  return Array.from(keySet)
    .sort((a, b) => weekStartFromKey(b).getTime() - weekStartFromKey(a).getTime())
    .map((key) => ({ key, label: weekLabel(key) }))
}

function buildMonthOptions(entries: WorklogEntry[], selectedMonthKey: string) {
  const keySet = new Set<string>()
  entries.forEach((entry) => keySet.add(toMonthKey(new Date(entry.createdAt))))

  const center = monthStartFromKey(selectedMonthKey)
  for (let i = -18; i <= 18; i += 1) {
    const d = new Date(center.getFullYear(), center.getMonth() + i, 1)
    keySet.add(toMonthKey(d))
  }

  return Array.from(keySet)
    .sort((a, b) => monthStartFromKey(b).getTime() - monthStartFromKey(a).getTime())
    .map((key) => ({ key, label: monthLabel(key) }))
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp)
  const y = `${date.getFullYear()}`
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  const h = `${date.getHours()}`.padStart(2, '0')
  const min = `${date.getMinutes()}`.padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

function PublicWorklogPanel({
  entries,
  loading,
  currentMember,
  onCreate,
  onDelete,
}: PublicWorklogPanelProps) {
  const now = new Date()
  const [period, setPeriod] = useState<PeriodMode>('week')
  const [selectedWeekKey, setSelectedWeekKey] = useState(() => toWeekKey(now))
  const [selectedMonthKey, setSelectedMonthKey] = useState(() => toMonthKey(now))
  const [draft, setDraft] = useState('')
  const [member, setMember] = useState<TaskMember>(currentMember ?? 'cao')
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const weekOptions = useMemo(
    () => buildWeekOptions(entries, selectedWeekKey),
    [entries, selectedWeekKey],
  )
  const monthOptions = useMemo(
    () => buildMonthOptions(entries, selectedMonthKey),
    [entries, selectedMonthKey],
  )

  const periodLabel = useMemo(
    () => (period === 'week' ? weekLabel(selectedWeekKey) : monthLabel(selectedMonthKey)),
    [period, selectedMonthKey, selectedWeekKey],
  )

  const filtered = useMemo(
    () => {
      if (period === 'week') {
        const start = weekStartFromKey(selectedWeekKey)
        const end = new Date(start)
        end.setDate(start.getDate() + 7)
        return entries
          .filter((entry) => entry.createdAt >= start.getTime() && entry.createdAt < end.getTime())
          .sort((a, b) => b.createdAt - a.createdAt)
      }

      const start = monthStartFromKey(selectedMonthKey)
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
      return entries
        .filter((entry) => entry.createdAt >= start.getTime() && entry.createdAt < end.getTime())
        .sort((a, b) => b.createdAt - a.createdAt)
    },
    [entries, period, selectedMonthKey, selectedWeekKey],
  )

  const grouped = useMemo<Record<TaskMember, WorklogEntry[]>>(
    () => ({
      cao: filtered.filter((entry) => entry.member === 'cao'),
      liao: filtered.filter((entry) => entry.member === 'liao'),
      deng: filtered.filter((entry) => entry.member === 'deng'),
    }),
    [filtered],
  )

  const handleSubmit = async () => {
    const content = draft.trim()
    if (!content || creating) {
      return
    }

    setCreating(true)
    try {
      await onCreate({ member, content })
      setDraft('')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (entryId: string) => {
    if (deletingId) {
      return
    }
    const confirmed = window.confirm('确认删除这条记录吗？')
    if (!confirmed) {
      return
    }

    setDeletingId(entryId)
    try {
      await onDelete(entryId)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
      <div className="border-b border-[var(--color-border-subtle)] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[length:var(--fs-lg)] font-semibold text-[var(--color-text-primary)]">
            公共记录面板
          </h2>
          <div className="inline-flex items-center gap-1 rounded-[8px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-1">
            <button
              type="button"
              onClick={() => setPeriod('week')}
              className={`rounded-[6px] px-3 py-1 text-[length:var(--fs-sm)] ${
                period === 'week'
                  ? 'bg-[var(--color-accent-board-tint)] font-medium text-[var(--color-accent-board-active)]'
                  : 'text-[var(--color-text-secondary)]'
              }`}
            >
              周
            </button>
            <button
              type="button"
              onClick={() => setPeriod('month')}
              className={`rounded-[6px] px-3 py-1 text-[length:var(--fs-sm)] ${
                period === 'month'
                  ? 'bg-[var(--color-accent-board-tint)] font-medium text-[var(--color-accent-board-active)]'
                  : 'text-[var(--color-text-secondary)]'
              }`}
            >
              月
            </button>
          </div>
        </div>

        <p className="mt-1 text-[length:var(--fs-sm)] text-[var(--color-text-secondary)]">
          {periodLabel} · 每位成员记录自己完成的事项
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {period === 'week' ? (
            <>
              <button
                type="button"
                onClick={() => setSelectedWeekKey((prev) => shiftWeekKey(prev, -1))}
                className="h-8 rounded-[6px] border border-[var(--color-border-subtle)] px-2 text-[length:var(--fs-xs)] text-[var(--color-text-secondary)]"
              >
                上一周
              </button>
              <select
                value={selectedWeekKey}
                onChange={(event) => setSelectedWeekKey(event.target.value)}
                className="h-8 min-w-[220px] rounded-[6px] border border-[var(--color-border-subtle)] bg-white px-2 text-[length:var(--fs-xs)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-board)]"
              >
                {weekOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setSelectedWeekKey((prev) => shiftWeekKey(prev, 1))}
                className="h-8 rounded-[6px] border border-[var(--color-border-subtle)] px-2 text-[length:var(--fs-xs)] text-[var(--color-text-secondary)]"
              >
                下一周
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setSelectedMonthKey((prev) => shiftMonthKey(prev, -1))}
                className="h-8 rounded-[6px] border border-[var(--color-border-subtle)] px-2 text-[length:var(--fs-xs)] text-[var(--color-text-secondary)]"
              >
                上一月
              </button>
              <select
                value={selectedMonthKey}
                onChange={(event) => setSelectedMonthKey(event.target.value)}
                className="h-8 min-w-[180px] rounded-[6px] border border-[var(--color-border-subtle)] bg-white px-2 text-[length:var(--fs-xs)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-board)]"
              >
                {monthOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setSelectedMonthKey((prev) => shiftMonthKey(prev, 1))}
                className="h-8 rounded-[6px] border border-[var(--color-border-subtle)] px-2 text-[length:var(--fs-xs)] text-[var(--color-text-secondary)]"
              >
                下一月
              </button>
            </>
          )}
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-[160px_1fr_auto]">
          <select
            value={member}
            onChange={(event) => setMember(event.target.value as TaskMember)}
            className="h-9 rounded-[8px] border border-[var(--color-border-subtle)] bg-white px-2 text-[length:var(--fs-sm)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-board)]"
          >
            {(Object.keys(MEMBERS) as TaskMember[]).map((item) => (
              <option key={item} value={item}>
                {MEMBERS[item].name}
              </option>
            ))}
          </select>

          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="例如：完成发布页联调、修复登录重试问题"
            className="h-9 rounded-[8px] border border-[var(--color-border-subtle)] bg-white px-3 text-[length:var(--fs-sm)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-board)]"
          />

          <button
            type="button"
            onClick={() => {
              void handleSubmit()
            }}
            disabled={!draft.trim() || creating}
            className="h-9 rounded-[8px] bg-[var(--color-accent-board)] px-4 text-[length:var(--fs-sm)] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? '提交中...' : '添加记录'}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto p-3">
        {loading ? (
          <div className="flex h-full items-center justify-center rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-column)]">
            <p className="text-[length:var(--fs-sm)] text-[var(--color-text-secondary)]">正在加载记录...</p>
          </div>
        ) : (
          <div className="grid h-full min-w-[1080px] grid-cols-3 gap-3">
            {(Object.keys(MEMBERS) as TaskMember[]).map((key) => {
              const memberMeta = MEMBERS[key]
              const items = grouped[key]

              return (
                <section
                  key={key}
                  className="flex h-full min-h-0 flex-col rounded-[10px] bg-[var(--color-bg-column)] p-2.5"
                >
                  <header className="mb-2 flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex h-6 w-6 items-center justify-center rounded text-[length:var(--fs-sm)] font-medium"
                        style={{ background: memberMeta.color, color: memberMeta.textColor }}
                      >
                        {memberMeta.short}
                      </span>
                      <h3 className="text-[length:var(--fs-md)] font-semibold text-[var(--color-text-primary)]">
                        {memberMeta.name}
                      </h3>
                    </div>
                    <span className="text-[length:var(--fs-sm)] text-[var(--color-text-secondary)]">
                      {items.length}
                    </span>
                  </header>

                  <div className="column-scroll min-h-0 flex-1 overflow-y-auto pr-1">
                    {items.length === 0 ? (
                      <div className="flex min-h-[120px] items-center justify-center rounded-[8px] border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-3 text-center text-[length:var(--fs-sm)] text-[var(--color-text-tertiary)]">
                        当前周期暂无记录
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {items.map((entry) => (
                          <article
                            key={entry.id}
                            className="rounded-[8px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-3 py-2"
                          >
                            <p className="whitespace-pre-wrap text-[length:var(--fs-sm)] text-[var(--color-text-primary)]">
                              {entry.content}
                            </p>
                            <div className="mt-2 flex items-center justify-between text-[length:var(--fs-xs)] text-[var(--color-text-tertiary)]">
                              <span>{formatTime(entry.createdAt)}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  void handleDelete(entry.id)
                                }}
                                disabled={deletingId === entry.id}
                                className="rounded border border-[var(--color-border-subtle)] px-1.5 py-0.5 hover:bg-[var(--color-bg-hover-card)] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                删除
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default PublicWorklogPanel
