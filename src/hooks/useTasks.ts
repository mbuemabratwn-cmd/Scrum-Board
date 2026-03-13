import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Task, TaskMember } from '../types/task'
import {
  createTask,
  deleteTask,
  subscribeToTasks,
  updateTask,
  type CreateTaskInput,
  type UpdateTaskInput,
} from '../services/taskService'
import { PUBLIC_BOARD_TASKS } from '../mock/tasks'
import { hasFirebaseConfig } from '../config/firebase'

interface TasksByLane {
  pending: Task[]
  memberDone: Record<TaskMember, Task[]>
  memberHistory: Record<TaskMember, Task[]>
}

interface UseTasksOptions {
  isConnected?: boolean
}

interface TaskStats {
  todayNewCount: number
  inProgressCount: number
  weekDoneCount: number
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const TASK_CACHE_KEY = 'scrum-board.tasks.cache.v2'
const APP_STARTED_AT = Date.now()

function loadCachedTasks(): Task[] {
  try {
    const raw = window.localStorage.getItem(TASK_CACHE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as Task[]
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
      .filter((task) => task && typeof task.id === 'string')
      .sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

function saveCachedTasks(tasks: Task[]) {
  try {
    window.localStorage.setItem(TASK_CACHE_KEY, JSON.stringify(tasks))
  } catch {
    // 本地存储失败时静默忽略
  }
}

function applyLocalPatch(task: Task, patch: UpdateTaskInput) {
  return {
    ...task,
    ...patch,
    updatedAt: Date.now(),
  }
}

export function useTasks(options: UseTasksOptions = {}) {
  const fallbackTasks = useMemo(
    () => [...PUBLIC_BOARD_TASKS].sort((a, b) => b.updatedAt - a.updatedAt),
    [],
  )
  const cachedTasks = useMemo(() => loadCachedTasks(), [])
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (!hasFirebaseConfig) {
      return fallbackTasks
    }
    if (cachedTasks.length > 0) {
      return cachedTasks
    }
    return []
  })
  const [loading, setLoading] = useState(hasFirebaseConfig && cachedTasks.length === 0)
  const [error, setError] = useState<string | null>(
    hasFirebaseConfig ? null : 'Firebase 未连接，当前使用本地演示数据。',
  )
  const [minuteTick, setMinuteTick] = useState(0)
  const tasksRef = useRef<Task[]>(tasks)
  const queuedOfflineWritesRef = useRef(0)

  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  useEffect(() => {
    if (!hasFirebaseConfig) {
      tasksRef.current = fallbackTasks
      return () => {}
    }

    const unsubscribe = subscribeToTasks((nextTasks) => {
      tasksRef.current = nextTasks
      setTasks(nextTasks)
      setLoading(false)
      setError(null)
      saveCachedTasks(nextTasks)
    })

    return () => {
      unsubscribe()
    }
  }, [fallbackTasks])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMinuteTick((prev) => prev + 1)
    }, 60 * 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  const tasksByLane = useMemo<TasksByLane>(() => {
    const now = APP_STARTED_AT + minuteTick * 60 * 1000
    const pending = tasks.filter((task) => task.status !== 'completed')
    const memberDone: Record<TaskMember, Task[]> = {
      cao: [],
      liao: [],
      deng: [],
    }
    const memberHistory: Record<TaskMember, Task[]> = {
      cao: [],
      liao: [],
      deng: [],
    }

    tasks.forEach((task) => {
      if (task.status !== 'completed' || !task.completedBy || !task.completedAt) {
        return
      }
      if (now - task.completedAt > WEEK_MS) {
        memberHistory[task.completedBy].push(task)
      } else {
        memberDone[task.completedBy].push(task)
      }
    })

    pending.sort((a, b) => b.updatedAt - a.updatedAt)
    ;(Object.keys(memberDone) as TaskMember[]).forEach((member) => {
      memberDone[member].sort((a, b) => b.completedAt! - a.completedAt!)
      memberHistory[member].sort((a, b) => b.completedAt! - a.completedAt!)
    })

    return { pending, memberDone, memberHistory }
  }, [minuteTick, tasks])

  const stats = useMemo<TaskStats>(() => {
    const nowDate = new Date()
    const nowYear = nowDate.getFullYear()
    const nowMonth = nowDate.getMonth()
    const nowDay = nowDate.getDate()
    const todayNewCount = tasks.filter((task) => {
      const created = new Date(task.createdAt)
      return (
        created.getFullYear() === nowYear &&
        created.getMonth() === nowMonth &&
        created.getDate() === nowDay
      )
    }).length
    const inProgressCount = tasks.filter((task) => task.status === 'in_progress').length
    const weekDoneCount =
      tasksByLane.memberDone.cao.length +
      tasksByLane.memberDone.liao.length +
      tasksByLane.memberDone.deng.length

    return { todayNewCount, inProgressCount, weekDoneCount }
  }, [tasks, tasksByLane.memberDone])

  const create = useCallback(
    async (input: CreateTaskInput) => {
      if (options.isConnected === false) {
        queuedOfflineWritesRef.current += 1
      }
      return createTask(input)
    },
    [options.isConnected],
  )

  const update = useCallback(
    async (taskId: string, patch: UpdateTaskInput) => {
      if (options.isConnected === false) {
        queuedOfflineWritesRef.current += 1
      }
      await updateTask(taskId, patch)
    },
    [options.isConnected],
  )

  const remove = useCallback(
    async (taskId: string) => {
      if (options.isConnected === false) {
        queuedOfflineWritesRef.current += 1
      }
      await deleteTask(taskId)
    },
    [options.isConnected],
  )

  const optimisticMutate = useCallback((mutator: (prev: Task[]) => Task[]) => {
    const previous = tasksRef.current
    const next = mutator(previous)
    tasksRef.current = next
    setTasks(next)
    saveCachedTasks(next)
    return () => {
      tasksRef.current = previous
      setTasks(previous)
      saveCachedTasks(previous)
    }
  }, [])

  const optimisticPatchTask = useCallback(
    (taskId: string, patch: UpdateTaskInput) =>
      optimisticMutate((prev) =>
        prev.map((task) => (task.id === taskId ? applyLocalPatch(task, patch) : task)),
      ),
    [optimisticMutate],
  )

  const consumeQueuedOfflineWrites = useCallback(() => {
    const count = queuedOfflineWritesRef.current
    queuedOfflineWritesRef.current = 0
    return count
  }, [])

  return {
    tasks,
    tasksByLane,
    stats,
    loading,
    error,
    setError,
    createTask: create,
    updateTask: update,
    deleteTask: remove,
    optimisticMutate,
    optimisticPatchTask,
    consumeQueuedOfflineWrites,
  }
}
