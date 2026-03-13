import { Draggable, Droppable, type DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'
import TaskCard from './TaskCard'
import type { Task, TaskMember } from '../types/task'

interface ColumnProps {
  droppableId: string
  title: string
  subtitle?: string
  tasks: Task[]
  emptyText: string
  historyTasks?: Task[]
  compactCards?: boolean
  draggable?: boolean
  currentMember: TaskMember | null
  onTaskOpen: (taskId: string) => void
  onTaskContextMenu: (taskId: string, x: number, y: number) => void
  onTakeTask?: (taskId: string) => void
  onMarkDone?: (taskId: string) => void
}

function renderTaskCard(task: Task, args: {
  compactCards: boolean
  currentMember: TaskMember | null
  onTaskOpen: (taskId: string) => void
  onTaskContextMenu: (taskId: string, x: number, y: number) => void
  onTakeTask?: (taskId: string) => void
  onMarkDone?: (taskId: string) => void
  isDragging: boolean
  dragHandleProps?: DraggableProvidedDragHandleProps | null
}) {
  return (
    <TaskCard
      task={task}
      compact={args.compactCards}
      currentMember={args.currentMember}
      isDragging={args.isDragging}
      dragHandleProps={args.dragHandleProps}
      onOpen={() => args.onTaskOpen(task.id)}
      onContextMenu={(x, y) => args.onTaskContextMenu(task.id, x, y)}
      onTakeTask={
        args.onTakeTask
          ? () => {
              args.onTakeTask?.(task.id)
            }
          : undefined
      }
      onMarkDone={
        args.onMarkDone
          ? () => {
              args.onMarkDone?.(task.id)
            }
          : undefined
      }
    />
  )
}

function Column({
  droppableId,
  title,
  subtitle,
  tasks,
  emptyText,
  historyTasks = [],
  compactCards = false,
  draggable = false,
  currentMember,
  onTaskOpen,
  onTaskContextMenu,
  onTakeTask,
  onMarkDone,
}: ColumnProps) {
  return (
    <Droppable droppableId={droppableId}>
      {(provided, snapshot) => (
        <section
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`board-column flex h-full min-h-0 flex-col rounded-[10px] p-2.5 transition-colors duration-200 ${
            snapshot.isDraggingOver ? 'bg-[#DDE5EA]' : 'bg-[var(--color-bg-column)]'
          }`}
        >
          <header className="mb-2 flex h-10 items-center justify-between border-b border-[var(--color-border-subtle)] px-1">
            <div className="min-w-0">
              <h2 className="truncate text-[length:var(--fs-column-title)] font-semibold text-[var(--color-text-primary)]">
                {title}
              </h2>
              {subtitle ? (
                <p className="truncate text-[length:var(--fs-xs)] text-[var(--color-text-secondary)]">{subtitle}</p>
              ) : null}
            </div>
            <span className="text-[length:var(--fs-sm)] text-[var(--color-text-secondary)]">{tasks.length}</span>
          </header>

          <div className="column-scroll min-h-0 flex-1 overflow-y-auto pr-1">
            {tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.map((task, index) => {
                  if (!draggable) {
                    return (
                      <div key={task.id}>
                        {renderTaskCard(task, {
                          compactCards,
                          currentMember,
                          onTaskOpen,
                          onTaskContextMenu,
                          onTakeTask,
                          onMarkDone,
                          isDragging: false,
                        })}
                      </div>
                    )
                  }

                  return (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(draggableProvided, draggableSnapshot) => (
                        <div ref={draggableProvided.innerRef} {...draggableProvided.draggableProps}>
                          {renderTaskCard(task, {
                            compactCards,
                            currentMember,
                            onTaskOpen,
                            onTaskContextMenu,
                            onTakeTask,
                            onMarkDone,
                            isDragging: draggableSnapshot.isDragging,
                            dragHandleProps: draggableProvided.dragHandleProps,
                          })}
                        </div>
                      )}
                    </Draggable>
                  )
                })}
                {provided.placeholder}
              </div>
            ) : (
              <>
                <div className="flex min-h-[120px] items-center justify-center rounded-[8px] border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-3 text-center text-[length:var(--fs-sm)] text-[var(--color-text-tertiary)]">
                  {emptyText}
                </div>
                {provided.placeholder}
              </>
            )}
          </div>

          {historyTasks.length > 0 ? (
            <details className="mt-2 rounded-[6px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-2 py-1">
              <summary className="cursor-pointer list-none text-[length:var(--fs-xs)] text-[var(--color-text-secondary)]">
                历史记录 {historyTasks.length} 条（超 7 天自动归档）
              </summary>
              <ul className="mt-1 space-y-1 border-t border-[var(--color-border-subtle)] pt-1">
                {historyTasks.map((task) => (
                  <li
                    key={task.id}
                    className="truncate text-[length:var(--fs-2xs)] text-[var(--color-text-tertiary)]"
                    title={task.title}
                  >
                    {task.title}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </section>
      )}
    </Droppable>
  )
}

export default Column
