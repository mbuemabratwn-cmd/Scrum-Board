import type { Task, TaskAssignee, TaskMember, TaskPriority, TaskStatus } from '../types/task'

export interface ContextMenuState {
  taskId: string
  x: number
  y: number
}

interface ContextMenuProps {
  state: ContextMenuState | null
  task: Task | null
  currentMember: TaskMember | null
  onClose: () => void
  onChangeStatus: (taskId: string, nextStatus: TaskStatus) => void
  onAssign: (taskId: string, assignee: TaskAssignee) => void
  onTakeTask: (taskId: string) => void
  onPriority: (taskId: string, priority: TaskPriority) => void
  onDelete: (taskId: string) => void
}

function menuItemClass(disabled = false) {
  return `flex w-full items-center justify-between rounded-[6px] px-2 py-1.5 text-left text-[length:var(--fs-sm)] ${
    disabled
      ? 'cursor-not-allowed text-[var(--color-text-tertiary)]'
      : 'text-[var(--color-text-secondary)] hover:bg-[#E8ECF0]'
  }`
}

function ContextMenu({
  state,
  task,
  currentMember,
  onClose,
  onChangeStatus,
  onAssign,
  onTakeTask,
  onPriority,
  onDelete,
}: ContextMenuProps) {
  if (!state || !task) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50" onMouseDown={onClose}>
      <div
        className="absolute w-[220px] rounded-[6px] border border-[var(--color-border-subtle)] bg-white p-1.5 shadow-[0_4px_12px_rgba(55,53,47,0.12)]"
        style={{ left: state.x, top: state.y }}
        onMouseDown={(event) => {
          event.stopPropagation()
        }}
      >
        {task.status === 'pending' && currentMember ? (
          <button
            type="button"
            className={menuItemClass()}
            onClick={() => {
              onTakeTask(task.id)
              onClose()
            }}
          >
            接下任务
          </button>
        ) : null}

        <p className="px-2 py-1 text-[length:var(--fs-2xs)] text-[var(--color-text-tertiary)]">状态</p>
        <button
          type="button"
          className={menuItemClass(task.status === 'pending')}
          disabled={task.status === 'pending'}
          onClick={() => {
            onChangeStatus(task.id, 'pending')
            onClose()
          }}
        >
          移至待做
        </button>
        <button
          type="button"
          className={menuItemClass(task.status === 'in_progress')}
          disabled={task.status === 'in_progress'}
          onClick={() => {
            onChangeStatus(task.id, 'in_progress')
            onClose()
          }}
        >
          移至执行中
        </button>
        <button
          type="button"
          className={menuItemClass(task.status === 'completed')}
          disabled={task.status === 'completed'}
          onClick={() => {
            onChangeStatus(task.id, 'completed')
            onClose()
          }}
        >
          移至已完成
        </button>

        <p className="px-2 py-1 text-[length:var(--fs-2xs)] text-[var(--color-text-tertiary)]">分配给</p>
        <button
          type="button"
          className={menuItemClass(task.assignee === null)}
          disabled={task.assignee === null}
          onClick={() => {
            onAssign(task.id, null)
            onClose()
          }}
        >
          不指定
        </button>
        <button
          type="button"
          className={menuItemClass(task.assignee === 'cao')}
          disabled={task.assignee === 'cao'}
          onClick={() => {
            onAssign(task.id, 'cao')
            onClose()
          }}
        >
          曹舜钦
        </button>
        <button
          type="button"
          className={menuItemClass(task.assignee === 'liao')}
          disabled={task.assignee === 'liao'}
          onClick={() => {
            onAssign(task.id, 'liao')
            onClose()
          }}
        >
          廖锋
        </button>
        <button
          type="button"
          className={menuItemClass(task.assignee === 'deng')}
          disabled={task.assignee === 'deng'}
          onClick={() => {
            onAssign(task.id, 'deng')
            onClose()
          }}
        >
          邓净仪
        </button>

        <p className="px-2 py-1 text-[length:var(--fs-2xs)] text-[var(--color-text-tertiary)]">优先级</p>
        <button
          type="button"
          className={menuItemClass(task.priority === 'high')}
          disabled={task.priority === 'high'}
          onClick={() => {
            onPriority(task.id, 'high')
            onClose()
          }}
        >
          高
        </button>
        <button
          type="button"
          className={menuItemClass(task.priority === 'mid')}
          disabled={task.priority === 'mid'}
          onClick={() => {
            onPriority(task.id, 'mid')
            onClose()
          }}
        >
          中
        </button>
        <button
          type="button"
          className={menuItemClass(task.priority === 'low')}
          disabled={task.priority === 'low'}
          onClick={() => {
            onPriority(task.id, 'low')
            onClose()
          }}
        >
          低
        </button>

        <button
          type="button"
          className={`${menuItemClass()} mt-1 border-t border-[var(--color-border-subtle)] pt-2 text-[var(--color-priority-high)]`}
          onClick={() => {
            onDelete(task.id)
            onClose()
          }}
        >
          删除
        </button>
      </div>
    </div>
  )
}

export default ContextMenu
