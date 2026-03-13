import type { TaskMember } from './task'

export interface WorklogEntry {
  id: string
  member: TaskMember
  content: string
  createdAt: number
  updatedAt: number
  createdByUid?: string
  createdByName?: string
}

