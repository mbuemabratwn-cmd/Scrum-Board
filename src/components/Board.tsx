import { DragDropContext } from '@hello-pangea/dnd'
import Column from './Column'
import { MEMBERS } from '../mock/members'
import type { Task, TaskMember } from '../types/task'

interface BoardProps {
  pendingTasks: Task[]
  memberDone: Record<TaskMember, Task[]>
  memberHistory: Record<TaskMember, Task[]>
  currentMember: TaskMember | null
  onTaskOpen: (taskId: string) => void
  onTaskContextMenu: (taskId: string, x: number, y: number) => void
  onTakeTask: (taskId: string) => void
  onMarkDone: (taskId: string) => void
}

function Board({
  pendingTasks,
  memberDone,
  memberHistory,
  currentMember,
  onTaskOpen,
  onTaskContextMenu,
  onTakeTask,
  onMarkDone,
}: BoardProps) {
  const hasAnyVisibleTask =
    pendingTasks.length > 0 ||
    memberDone.cao.length > 0 ||
    memberDone.liao.length > 0 ||
    memberDone.deng.length > 0

  const onDragEnd = () => {
    // 当前交互改为：在待做列点击“已完成”后再进入成员列
  }

  if (!hasAnyVisibleTask) {
    return (
      <section className="flex h-full items-center justify-center rounded-[10px] border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
        <div className="text-center">
          <p className="text-[length:var(--fs-xl)] text-[var(--color-text-secondary)]">当前没有可展示任务</p>
          <p className="mt-1 text-[length:var(--fs-sm)] text-[var(--color-text-tertiary)]">
            新建任务会先出现在“当前待做任务”列
          </p>
        </div>
      </section>
    )
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <section className="h-full overflow-x-auto pb-1">
        <div className="grid h-full min-w-[1280px] grid-cols-4 gap-3">
          <Column
            droppableId="lane-pending"
            title="当前待做任务"
            subtitle="接下任务会显示执行中边框，点“已完成”后归档到成员列"
            tasks={pendingTasks}
            emptyText="暂无待做任务"
            currentMember={currentMember}
            onTaskOpen={onTaskOpen}
            onTaskContextMenu={onTaskContextMenu}
            onTakeTask={onTakeTask}
            onMarkDone={onMarkDone}
          />

          {(Object.keys(MEMBERS) as TaskMember[]).map((member) => {
            const memberMeta = MEMBERS[member]
            const tasksForMember = memberDone[member]
            const compactCards = tasksForMember.length >= 5

            return (
              <Column
                key={member}
                droppableId={`lane-member-${member}`}
                title={memberMeta.name}
                subtitle="最近 7 天已完成"
                tasks={tasksForMember}
                emptyText="暂无已完成任务"
                historyTasks={memberHistory[member]}
                compactCards={compactCards}
                currentMember={currentMember}
                onTaskOpen={onTaskOpen}
                onTaskContextMenu={onTaskContextMenu}
              />
            )
          })}
        </div>
      </section>
    </DragDropContext>
  )
}

export default Board
