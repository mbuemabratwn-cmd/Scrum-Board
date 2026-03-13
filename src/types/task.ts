export type TaskPriority = 'high' | 'mid' | 'low'
export type TaskMember = 'cao' | 'liao' | 'deng'
export type TaskAssignee = TaskMember | null
export type TaskStatus = 'pending' | 'in_progress' | 'completed'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assignee: TaskAssignee
  takenBy: TaskAssignee
  completedBy: TaskAssignee
  completedAt: number | null
  dueDate: number | null
  createdAt: number
  updatedAt: number
  createdByUid?: string
  createdByName?: string
  updatedByUid?: string
  updatedByName?: string
}
