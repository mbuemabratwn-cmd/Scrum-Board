import { useEffect, useMemo, useRef, useState } from 'react'
import type { Task, TaskAssignee, TaskPriority, TaskStatus } from '../types/task'

interface TaskDraft {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assignee: TaskAssignee
  takenBy: TaskAssignee
  dueDate: number | null
}

interface TaskDetailPanelProps {
  task: Task | null
  isSaving: boolean
  onClose: () => void
  onSave: (taskId: string, patch: Partial<TaskDraft>) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
}

function toDraft(task: Task): TaskDraft {
  return {
    title: task.title,
    description: task.description ?? '',
    status: task.status,
    priority: task.priority,
    assignee: task.assignee,
    takenBy: task.takenBy,
    dueDate: task.dueDate,
  }
}

function toDateInputValue(timestamp: number | null) {
  if (!timestamp) {
    return ''
  }
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function fromDateInputValue(value: string) {
  if (!value) {
    return null
  }
  return new Date(`${value}T00:00:00`).getTime()
}

function buildPatchFromDraft(original: TaskDraft, next: TaskDraft): Partial<TaskDraft> {
  const patch: Partial<TaskDraft> = {}

  if (original.title !== next.title) patch.title = next.title
  if (original.description !== next.description) patch.description = next.description
  if (original.status !== next.status) patch.status = next.status
  if (original.priority !== next.priority) patch.priority = next.priority
  if (original.assignee !== next.assignee) patch.assignee = next.assignee
  if (original.takenBy !== next.takenBy) patch.takenBy = next.takenBy
  if (original.dueDate !== next.dueDate) patch.dueDate = next.dueDate

  return patch
}

function TaskDetailPanel({ task, isSaving, onClose, onSave, onDelete }: TaskDetailPanelProps) {
  const [draftByTask, setDraftByTask] = useState<Record<string, TaskDraft>>({})
  const timerRef = useRef<number | null>(null)

  const draft = useMemo(() => {
    if (!task) {
      return null
    }
    return draftByTask[task.id] ?? toDraft(task)
  }, [draftByTask, task])

  const panelVisible = Boolean(task && draft)
  const original = useMemo(() => (task ? toDraft(task) : null), [task])

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onEsc)
    return () => {
      window.removeEventListener('keydown', onEsc)
    }
  }, [onClose])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  const updateDraft = (patch: Partial<TaskDraft>) => {
    if (!task) {
      return
    }
    setDraftByTask((prev) => {
      const nextBase = prev[task.id] ?? toDraft(task)
      return {
        ...prev,
        [task.id]: {
          ...nextBase,
          ...patch,
        },
      }
    })
  }

  const scheduleSave = () => {
    if (!task || !draft || !original) {
      return
    }
    const patch = buildPatchFromDraft(original, draft)
    if (Object.keys(patch).length === 0) {
      return
    }
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
    }
    timerRef.current = window.setTimeout(() => {
      void onSave(task.id, patch).then(() => {
        setDraftByTask((prev) => {
          const next = { ...prev }
          delete next[task.id]
          return next
        })
      })
    }, 500)
  }

  if (!panelVisible || !task || !draft) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-40 bg-[rgba(20,20,25,0.25)]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <aside className="absolute right-0 top-0 h-full w-[360px] overflow-y-auto border-l border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4 shadow-[-16px_0_32px_rgba(20,20,25,0.18)]">
        <h3 className="text-[length:var(--fs-xl)] font-semibold text-[var(--color-text-primary)]">任务详情</h3>
        <p className="mt-1 text-[length:var(--fs-xs)] text-[var(--color-text-secondary)]">失焦后 500ms 自动保存</p>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-[length:var(--fs-xs)] text-[var(--color-text-secondary)]">标题</span>
            <input
              value={draft.title}
              onChange={(event) => {
                updateDraft({ title: event.target.value })
              }}
              onBlur={scheduleSave}
              className="w-full rounded-[8px] border border-[var(--color-border-subtle)] px-2 py-2 text-[length:var(--fs-md)] outline-none focus:border-[var(--color-accent-board)]"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[length:var(--fs-xs)] text-[var(--color-text-secondary)]">描述</span>
            <textarea
              value={draft.description}
              onChange={(event) => {
                updateDraft({ description: event.target.value })
              }}
              onBlur={scheduleSave}
              className="h-20 w-full resize-none rounded-[8px] border border-[var(--color-border-subtle)] px-2 py-2 text-[length:var(--fs-sm)] outline-none focus:border-[var(--color-accent-board)]"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[length:var(--fs-xs)] text-[var(--color-text-secondary)]">状态</span>
              <select
                value={draft.status}
                onChange={(event) => {
                  updateDraft({ status: event.target.value as TaskStatus })
                }}
                onBlur={scheduleSave}
                className="w-full rounded-[8px] border border-[var(--color-border-subtle)] px-2 py-2 text-[length:var(--fs-sm)]"
              >
                <option value="pending">待做</option>
                <option value="in_progress">正在执行</option>
                <option value="completed">已完成</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-[length:var(--fs-xs)] text-[var(--color-text-secondary)]">优先级</span>
              <select
                value={draft.priority}
                onChange={(event) => {
                  updateDraft({ priority: event.target.value as TaskPriority })
                }}
                onBlur={scheduleSave}
                className="w-full rounded-[8px] border border-[var(--color-border-subtle)] px-2 py-2 text-[length:var(--fs-sm)]"
              >
                <option value="high">高</option>
                <option value="mid">中</option>
                <option value="low">低</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[length:var(--fs-xs)] text-[var(--color-text-secondary)]">负责人</span>
              <select
                value={draft.assignee ?? ''}
                onChange={(event) => {
                  updateDraft({ assignee: (event.target.value || null) as TaskAssignee })
                }}
                onBlur={scheduleSave}
                className="w-full rounded-[8px] border border-[var(--color-border-subtle)] px-2 py-2 text-[length:var(--fs-sm)]"
              >
                <option value="">不指定</option>
                <option value="cao">曹舜钦</option>
                <option value="liao">廖锋</option>
                <option value="deng">邓净仪</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-[length:var(--fs-xs)] text-[var(--color-text-secondary)]">执行人</span>
              <select
                value={draft.takenBy ?? ''}
                onChange={(event) => {
                  updateDraft({ takenBy: (event.target.value || null) as TaskAssignee })
                }}
                onBlur={scheduleSave}
                className="w-full rounded-[8px] border border-[var(--color-border-subtle)] px-2 py-2 text-[length:var(--fs-sm)]"
              >
                <option value="">未接任务</option>
                <option value="cao">曹舜钦</option>
                <option value="liao">廖锋</option>
                <option value="deng">邓净仪</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-[length:var(--fs-xs)] text-[var(--color-text-secondary)]">截止日</span>
            <input
              type="date"
              value={toDateInputValue(draft.dueDate)}
              onChange={(event) => {
                updateDraft({ dueDate: fromDateInputValue(event.target.value) })
              }}
              onBlur={scheduleSave}
              className="w-full rounded-[8px] border border-[var(--color-border-subtle)] px-2 py-2 text-[length:var(--fs-sm)]"
            />
          </label>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            className="rounded-[8px] border border-[var(--color-priority-high)] px-3 py-2 text-[length:var(--fs-sm)] text-[var(--color-priority-high)]"
            onClick={() => {
              void onDelete(task.id)
            }}
          >
            删除任务
          </button>

          <button
            type="button"
            className="rounded-[8px] border border-[var(--color-border-subtle)] px-3 py-2 text-[length:var(--fs-sm)] text-[var(--color-text-secondary)]"
            onClick={onClose}
          >
            {isSaving ? '保存中...' : '关闭'}
          </button>
        </div>
      </aside>
    </div>
  )
}

export default TaskDetailPanel
