import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'
import { MEMBERS } from '../mock/members'
import type { Task, TaskMember } from '../types/task'

interface TaskCardProps {
  task: Task
  compact?: boolean
  currentMember: TaskMember | null
  isDragging?: boolean
  dragHandleProps?: DraggableProvidedDragHandleProps | null
  onTakeTask?: () => void
  onMarkDone?: () => void
  onOpen: () => void
  onContextMenu: (x: number, y: number) => void
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function getCardColor(priority: Task['priority']) {
  if (priority === 'high') {
    return 'border-[var(--color-priority-high-border)] bg-[var(--color-priority-high-tint)]'
  }
  if (priority === 'mid') {
    return 'border-[var(--color-priority-mid-border)] bg-[var(--color-priority-mid-tint)]'
  }
  return 'border-[var(--color-priority-low-border)] bg-[var(--color-priority-low-tint)]'
}

function getDueDateStyle(dueDate: number | null) {
  if (!dueDate) {
    return 'border border-[var(--color-border-subtle)] bg-[var(--color-bg-muted)] text-[var(--color-text-tertiary)]'
  }
  const diffDays = Math.ceil((dueDate - Date.now()) / (24 * 60 * 60 * 1000))
  if (diffDays < 0) {
    return 'border border-[var(--color-priority-high-border)] bg-[var(--color-priority-high)] text-white'
  }
  if (diffDays <= 3) {
    return 'border border-[#E8A735] bg-[rgba(232,167,53,0.22)] text-[#8A5A05]'
  }
  return 'border border-[var(--color-border-subtle)] bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)]'
}

function getDueDateText(dueDate: number | null) {
  if (!dueDate) {
    return '📅 无截止日期'
  }
  const diffDays = Math.ceil((dueDate - Date.now()) / (24 * 60 * 60 * 1000))
  if (diffDays < 0) {
    return `📅 过期 · ${formatDate(dueDate)}`
  }
  if (diffDays <= 3) {
    return `📅 临近 · ${formatDate(dueDate)}`
  }
  return `📅 ${formatDate(dueDate)}`
}

function getStatusText(task: Task) {
  if (task.status === 'completed' && task.completedBy) {
    return `已完成 · ${MEMBERS[task.completedBy].name}`
  }
  if (task.status === 'in_progress' && task.takenBy) {
    return `正在执行 · ${MEMBERS[task.takenBy].name}`
  }
  return '待处理'
}

function getStatusPillClass(task: Task) {
  if (task.status === 'completed') {
    return 'border-[#1F8A5A] bg-[#CBEFD9] text-[#0E5A39]'
  }
  if (task.status === 'in_progress') {
    return 'border-[var(--color-accent-board)] bg-[var(--color-accent-board-tint)] text-[var(--color-accent-board-active)]'
  }
  return 'border-[var(--color-priority-mid)] bg-[var(--color-priority-mid-tint)] text-[var(--color-priority-mid)]'
}

function getExecutionRing(task: Task) {
  if (task.status === 'in_progress') {
    return 'ring-2 ring-[var(--color-accent-board)] ring-offset-1 ring-offset-[var(--color-bg-column)]'
  }
  return ''
}

function TaskCard({
  task,
  compact = false,
  currentMember,
  isDragging = false,
  dragHandleProps,
  onTakeTask,
  onMarkDone,
  onOpen,
  onContextMenu,
}: TaskCardProps) {
  const assignee = task.assignee ? MEMBERS[task.assignee] : null
  const titleColorClass = 'text-[var(--color-text-primary)]'
  const descColorClass = 'text-[var(--color-text-secondary)]'

  return (
    <article
      {...dragHandleProps}
      onClick={onOpen}
      onContextMenu={(event) => {
        event.preventDefault()
        onContextMenu(event.clientX, event.clientY)
      }}
      className={`${dragHandleProps ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} rounded-[8px] border p-3 transition ${getCardColor(task.priority)} ${getExecutionRing(task)} ${
        compact ? 'min-h-[56px] py-2' : 'min-h-[92px]'
      } ${
        isDragging
          ? 'scale-[1.02] shadow-[0_8px_24px_rgba(55,53,47,0.15)]'
          : 'shadow-[0_1px_2px_rgba(55,53,47,0.08)] hover:translate-y-[-1px] hover:shadow-[0_4px_10px_rgba(55,53,47,0.12)]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3
            className={`line-clamp-1 leading-snug text-[length:var(--fs-card-title)] font-medium ${titleColorClass}`}
          >
            {task.title}
          </h3>
          <span
            className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[length:var(--fs-tag)] font-semibold ${getStatusPillClass(task)}`}
          >
            {getStatusText(task)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {assignee ? (
            <span
              className="inline-flex h-6 min-w-6 items-center justify-center rounded-[4px] px-1.5 text-[length:var(--fs-tag)] font-semibold"
              style={{ backgroundColor: assignee.color, color: assignee.textColor }}
              title={`负责人：${assignee.name}`}
            >
              {assignee.short}
            </span>
          ) : (
            <span className="rounded-[4px] border border-dashed border-[var(--color-border-subtle)] px-1.5 py-0.5 text-[length:var(--fs-tag)] text-[var(--color-text-tertiary)]">
              未指派
            </span>
          )}
        </div>
      </div>

      {!compact && (
        <p className={`mt-2 line-clamp-2 text-[length:var(--fs-card-desc)] leading-6 ${descColorClass}`}>
          {task.description || '暂无描述'}
        </p>
      )}

      <footer className="mt-2 flex items-center justify-between gap-2">
        <span
          className={`inline-flex rounded-[6px] px-2 py-1 text-[length:var(--fs-label)] ${getDueDateStyle(task.dueDate)}`}
        >
          {getDueDateText(task.dueDate)}
        </span>

        {task.status === 'pending' && onTakeTask && currentMember ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onTakeTask()
            }}
            className="rounded-[8px] border border-[var(--color-accent-board)] bg-[var(--color-accent-board)] px-3 py-1.5 text-[length:var(--fs-sm)] font-semibold text-white hover:bg-[var(--color-accent-board-hover)]"
          >
            接下任务
          </button>
        ) : null}

        {task.status === 'in_progress' && task.takenBy && onMarkDone ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onMarkDone()
            }}
            className="rounded-[8px] border border-[var(--color-accent-board)] bg-[var(--color-accent-board)] px-3 py-1.5 text-[length:var(--fs-sm)] font-semibold text-white hover:bg-[var(--color-accent-board-hover)]"
          >
            我完成了
          </button>
        ) : null}
      </footer>
    </article>
  )
}

export default TaskCard
