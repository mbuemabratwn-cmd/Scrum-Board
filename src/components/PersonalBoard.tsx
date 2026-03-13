import TaskCard from './TaskCard'
import type { Task, TaskMember } from '../types/task'

interface PersonalBoardProps {
  currentMember: TaskMember | null
  todoTasks: Task[]
  doingTasks: Task[]
  doneTasks: Task[]
  onTaskOpen: (taskId: string) => void
  onTaskContextMenu: (taskId: string, x: number, y: number) => void
  onTakeTask: (taskId: string) => void
  onMarkDone: (taskId: string) => void
}

function PersonalBoard({
  currentMember,
  todoTasks,
  doingTasks,
  doneTasks,
  onTaskOpen,
  onTaskContextMenu,
  onTakeTask,
  onMarkDone,
}: PersonalBoardProps) {
  if (!currentMember) {
    return (
      <section className="flex h-full items-center justify-center rounded-[10px] border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
        <div className="text-center">
          <p className="text-[length:var(--fs-xl)] text-[var(--color-text-secondary)]">未识别成员身份</p>
          <p className="mt-1 text-[length:var(--fs-sm)] text-[var(--color-text-tertiary)]">
            请在昵称中包含“曹 / 廖 / 邓”后重新登录
          </p>
        </div>
      </section>
    )
  }

  const columns = [
    {
      key: 'todo',
      title: '我的待做事项',
      subtitle: '指派给我，尚未接单',
      tasks: todoTasks,
      emptyText: '暂无待做任务',
    },
    {
      key: 'doing',
      title: '我正在执行',
      subtitle: '进行中的任务',
      tasks: doingTasks,
      emptyText: '暂无执行中的任务',
    },
    {
      key: 'done',
      title: '我已完成',
      subtitle: '最近完成记录',
      tasks: doneTasks,
      emptyText: '暂无已完成任务',
    },
  ]

  return (
    <section className="h-full overflow-x-auto pb-1">
      <div className="grid h-full min-w-[1040px] grid-cols-3 gap-3">
        {columns.map((column) => (
          <section
            key={column.key}
            className="board-column flex h-full min-h-0 flex-col rounded-[10px] bg-[var(--color-bg-column)] p-2.5"
          >
            <header className="mb-2 flex h-10 items-center justify-between border-b border-[var(--color-border-subtle)] px-1">
              <div className="min-w-0">
                <h2 className="truncate text-[length:var(--fs-column-title)] font-semibold text-[var(--color-text-primary)]">
                  {column.title}
                </h2>
                <p className="truncate text-[length:var(--fs-xs)] text-[var(--color-text-secondary)]">
                  {column.subtitle}
                </p>
              </div>
              <span className="text-[length:var(--fs-sm)] text-[var(--color-text-secondary)]">
                {column.tasks.length}
              </span>
            </header>

            <div className="column-scroll min-h-0 flex-1 overflow-y-auto pr-1">
              {column.tasks.length > 0 ? (
                <div className="space-y-2">
                  {column.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      compact={column.key === 'done' && column.tasks.length >= 6}
                      currentMember={currentMember}
                      onOpen={() => onTaskOpen(task.id)}
                      onContextMenu={(x, y) => onTaskContextMenu(task.id, x, y)}
                      onTakeTask={
                        column.key === 'todo'
                          ? () => {
                              onTakeTask(task.id)
                            }
                          : undefined
                      }
                      onMarkDone={
                        column.key === 'doing'
                          ? () => {
                              onMarkDone(task.id)
                            }
                          : undefined
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[120px] items-center justify-center rounded-[8px] border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-3 text-center text-[length:var(--fs-sm)] text-[var(--color-text-tertiary)]">
                  {column.emptyText}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}

export default PersonalBoard
