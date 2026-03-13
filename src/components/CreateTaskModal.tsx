import { useMemo, useState, type KeyboardEvent } from 'react'
import type { TaskAssignee, TaskPriority } from '../types/task'

interface CreateTaskModalProps {
  isOpen: boolean
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: {
    title: string
    description: string
    priority: TaskPriority
    assignee: TaskAssignee
    dueDate: number | null
  }) => Promise<void>
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

function CreateTaskModal({ isOpen, isSaving, onClose, onSubmit }: CreateTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('mid')
  const [assignee, setAssignee] = useState<TaskAssignee>(null)
  const [dueDate, setDueDate] = useState<number | null>(null)

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPriority('mid')
    setAssignee(null)
    setDueDate(null)
  }

  const closeAndReset = () => {
    resetForm()
    onClose()
  }

  const titleTrimmed = useMemo(() => title.trim(), [title])
  const canSubmit = titleTrimmed.length > 0 && !isSaving

  const submit = async () => {
    if (!canSubmit) {
      return
    }
    try {
      await onSubmit({
        title: titleTrimmed,
        description: description.trim(),
        priority,
        assignee,
        dueDate,
      })
      resetForm()
    } catch {
      // 错误由上层处理并通过 Toast 呈现
    }
  }

  const handleKeyDown = async (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      await submit()
    }
    if (event.key === 'Escape') {
      closeAndReset()
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(20,20,25,0.32)] p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeAndReset()
        }
      }}
    >
      <div
        onKeyDown={handleKeyDown}
        className="w-full max-w-[480px] rounded-[12px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4 shadow-[0_16px_40px_rgba(20,20,25,0.24)]"
      >
        <h3 className="text-[length:var(--fs-xl)] font-semibold text-[var(--color-text-primary)]">新建任务</h3>
        <p className="mt-1 text-[length:var(--fs-sm)] text-[var(--color-text-secondary)]">
          默认状态：待做 · 默认优先级：中
        </p>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-[length:var(--fs-sm)] text-[var(--color-text-secondary)]">标题 *</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-[8px] border border-[var(--color-border-subtle)] bg-white px-3 py-2 text-[length:var(--fs-lg)] outline-none focus:border-[var(--color-accent-board)]"
              placeholder="例如：补齐公开看板拖拽逻辑"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[length:var(--fs-sm)] text-[var(--color-text-secondary)]">描述</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="h-24 w-full resize-none rounded-[8px] border border-[var(--color-border-subtle)] bg-white px-3 py-2 text-[length:var(--fs-md)] outline-none focus:border-[var(--color-accent-board)]"
            />
          </label>

          <div className="grid grid-cols-3 gap-2">
            <label className="block">
              <span className="mb-1 block text-[length:var(--fs-sm)] text-[var(--color-text-secondary)]">优先级</span>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as TaskPriority)}
                className="w-full rounded-[8px] border border-[var(--color-border-subtle)] bg-white px-2 py-2 text-[length:var(--fs-md)] outline-none focus:border-[var(--color-accent-board)]"
              >
                <option value="high">高</option>
                <option value="mid">中</option>
                <option value="low">低</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-[length:var(--fs-sm)] text-[var(--color-text-secondary)]">负责人</span>
              <select
                value={assignee ?? ''}
                onChange={(event) =>
                  setAssignee((event.target.value || null) as TaskAssignee)
                }
                className="w-full rounded-[8px] border border-[var(--color-border-subtle)] bg-white px-2 py-2 text-[length:var(--fs-md)] outline-none focus:border-[var(--color-accent-board)]"
              >
                <option value="">不指定</option>
                <option value="cao">曹舜钦</option>
                <option value="liao">廖锋</option>
                <option value="deng">邓净仪</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-[length:var(--fs-sm)] text-[var(--color-text-secondary)]">截止日</span>
              <input
                type="date"
                value={toDateInputValue(dueDate)}
                onChange={(event) => setDueDate(fromDateInputValue(event.target.value))}
                className="w-full rounded-[8px] border border-[var(--color-border-subtle)] bg-white px-2 py-2 text-[length:var(--fs-md)] outline-none focus:border-[var(--color-accent-board)]"
              />
            </label>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={closeAndReset}
            className="rounded-[8px] border border-[var(--color-border-subtle)] px-3 py-2 text-[length:var(--fs-md)] text-[var(--color-text-secondary)]"
          >
            取消
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              void submit()
            }}
            className="rounded-[8px] bg-[var(--color-accent-board)] px-3 py-2 text-[length:var(--fs-md)] text-white disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isSaving ? '提交中...' : '创建任务'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateTaskModal
