import {
  child,
  onValue,
  push,
  ref,
  remove,
  set,
  update,
  type DatabaseReference,
  type Unsubscribe,
} from 'firebase/database'
import { db, hasFirebaseConfig } from '../config/firebase'
import type { Task, TaskAssignee, TaskPriority, TaskStatus } from '../types/task'

export const SAVE_RETRY_EXHAUSTED = 'SAVE_RETRY_EXHAUSTED'

export interface CreateTaskInput {
  title: string
  description?: string
  priority?: TaskPriority
  assignee?: TaskAssignee
  dueDate?: number | null
  createdByUid?: string
  createdByName?: string
  updatedByUid?: string
  updatedByName?: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  priority?: TaskPriority
  assignee?: TaskAssignee
  dueDate?: number | null
  status?: TaskStatus
  takenBy?: TaskAssignee
  completedBy?: TaskAssignee
  completedAt?: number | null
  updatedByUid?: string
  updatedByName?: string
}

function getTasksRef(): DatabaseReference {
  if (!db || !hasFirebaseConfig) {
    throw new Error('Firebase 数据库未配置')
  }
  return ref(db, 'tasks')
}

function getTaskRef(taskId: string): DatabaseReference {
  return child(getTasksRef(), taskId)
}

function normalizeTask(taskId: string, payload: Partial<Task>): Task {
  return {
    id: taskId,
    title: payload.title ?? '',
    description: payload.description ?? '',
    status: payload.status ?? 'pending',
    priority: payload.priority ?? 'mid',
    assignee: payload.assignee ?? null,
    takenBy: payload.takenBy ?? null,
    completedBy: payload.completedBy ?? null,
    completedAt: payload.completedAt ?? null,
    dueDate: payload.dueDate ?? null,
    createdAt: payload.createdAt ?? Date.now(),
    updatedAt: payload.updatedAt ?? Date.now(),
    createdByUid: payload.createdByUid,
    createdByName: payload.createdByName,
    updatedByUid: payload.updatedByUid,
    updatedByName: payload.updatedByName,
  }
}

async function sleep(ms: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function writeWithRetry<T>(runner: () => Promise<T>): Promise<T> {
  const retryDelays = [2000, 4000, 8000]
  let lastError: unknown = null

  for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
    try {
      return await runner()
    } catch (error) {
      lastError = error
      if (attempt === retryDelays.length) {
        const wrappedError = new Error(SAVE_RETRY_EXHAUSTED)
        ;(wrappedError as Error & { cause?: unknown }).cause = lastError
        throw wrappedError
      }
      await sleep(retryDelays[attempt])
    }
  }

  throw new Error(SAVE_RETRY_EXHAUSTED)
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const tasksRef = getTasksRef()
  const newTaskRef = push(tasksRef)
  const now = Date.now()

  const task: Task = {
    id: newTaskRef.key ?? `task-${now}`,
    title: input.title.trim(),
    description: input.description?.trim() ?? '',
    status: 'pending',
    priority: input.priority ?? 'mid',
    assignee: input.assignee ?? null,
    takenBy: null,
    completedBy: null,
    completedAt: null,
    dueDate: input.dueDate ?? null,
    createdAt: now,
    updatedAt: now,
    createdByUid: input.createdByUid,
    createdByName: input.createdByName,
    updatedByUid: input.updatedByUid ?? input.createdByUid,
    updatedByName: input.updatedByName ?? input.createdByName,
  }

  await writeWithRetry(async () => {
    await set(newTaskRef, task)
  })

  return task
}

export async function updateTask(taskId: string, input: UpdateTaskInput): Promise<void> {
  const patch: UpdateTaskInput & { updatedAt: number } = {
    ...input,
    updatedAt: Date.now(),
  }

  await writeWithRetry(async () => {
    await update(getTaskRef(taskId), patch)
  })
}

export async function deleteTask(taskId: string): Promise<void> {
  await writeWithRetry(async () => {
    await remove(getTaskRef(taskId))
  })
}

export function subscribeToTasks(onChange: (tasks: Task[]) => void): Unsubscribe {
  const tasksRef = getTasksRef()

  return onValue(tasksRef, (snapshot) => {
    const value = snapshot.val() as Record<string, Partial<Task>> | null
    if (!value) {
      onChange([])
      return
    }

    const tasks = Object.entries(value).map(([taskId, payload]) => normalizeTask(taskId, payload))
    tasks.sort((a, b) => b.updatedAt - a.updatedAt)
    onChange(tasks)
  })
}
