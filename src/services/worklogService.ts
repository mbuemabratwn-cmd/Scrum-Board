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
import type { TaskMember } from '../types/task'
import type { WorklogEntry } from '../types/worklog'

export const WORKLOG_SAVE_RETRY_EXHAUSTED = 'WORKLOG_SAVE_RETRY_EXHAUSTED'

export interface CreateWorklogInput {
  member: TaskMember
  content: string
  createdByUid?: string
  createdByName?: string
}

export interface UpdateWorklogInput {
  content?: string
  member?: TaskMember
}

function getWorklogsRef(): DatabaseReference {
  if (!db || !hasFirebaseConfig) {
    throw new Error('Firebase 数据库未配置')
  }
  return ref(db, 'worklogs')
}

function getWorklogRef(worklogId: string): DatabaseReference {
  return child(getWorklogsRef(), worklogId)
}

function normalizeWorklog(worklogId: string, payload: Partial<WorklogEntry>): WorklogEntry | null {
  if (!payload.member || !payload.content) {
    return null
  }

  return {
    id: worklogId,
    member: payload.member,
    content: payload.content,
    createdAt: payload.createdAt ?? Date.now(),
    updatedAt: payload.updatedAt ?? Date.now(),
    createdByUid: payload.createdByUid,
    createdByName: payload.createdByName,
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
        const wrappedError = new Error(WORKLOG_SAVE_RETRY_EXHAUSTED)
        ;(wrappedError as Error & { cause?: unknown }).cause = lastError
        throw wrappedError
      }
      await sleep(retryDelays[attempt])
    }
  }

  throw new Error(WORKLOG_SAVE_RETRY_EXHAUSTED)
}

export async function createWorklog(input: CreateWorklogInput): Promise<WorklogEntry> {
  const worklogsRef = getWorklogsRef()
  const newWorklogRef = push(worklogsRef)
  const now = Date.now()

  const worklog: WorklogEntry = {
    id: newWorklogRef.key ?? `worklog-${now}`,
    member: input.member,
    content: input.content.trim(),
    createdAt: now,
    updatedAt: now,
    createdByUid: input.createdByUid,
    createdByName: input.createdByName,
  }

  await writeWithRetry(async () => {
    await set(newWorklogRef, worklog)
  })

  return worklog
}

export async function updateWorklog(worklogId: string, input: UpdateWorklogInput): Promise<void> {
  const patch: UpdateWorklogInput & { updatedAt: number } = {
    ...input,
    updatedAt: Date.now(),
  }

  await writeWithRetry(async () => {
    await update(getWorklogRef(worklogId), patch)
  })
}

export async function deleteWorklog(worklogId: string): Promise<void> {
  await writeWithRetry(async () => {
    await remove(getWorklogRef(worklogId))
  })
}

export function subscribeToWorklogs(onChange: (entries: WorklogEntry[]) => void): Unsubscribe {
  const worklogsRef = getWorklogsRef()

  return onValue(worklogsRef, (snapshot) => {
    const value = snapshot.val() as Record<string, Partial<WorklogEntry>> | null
    if (!value) {
      onChange([])
      return
    }

    const entries = Object.entries(value)
      .map(([worklogId, payload]) => normalizeWorklog(worklogId, payload))
      .filter((entry): entry is WorklogEntry => entry !== null)

    entries.sort((a, b) => b.createdAt - a.createdAt)
    onChange(entries)
  })
}
