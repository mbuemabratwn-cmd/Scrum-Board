import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import type { User } from 'firebase/auth'
import Board from '../components/Board'
import ContextMenu, { type ContextMenuState } from '../components/ContextMenu'
import CreateTaskModal from '../components/CreateTaskModal'
import PersonalBoard from '../components/PersonalBoard'
import TaskDetailPanel from '../components/TaskDetailPanel'
import Toast, { type ToastItem } from '../components/Toast'
import TopBar from '../components/TopBar'
import { useConnectionStatus } from '../hooks/useConnectionStatus'
import { useKeyboard } from '../hooks/useKeyboard'
import { useTasks } from '../hooks/useTasks'
import { MEMBERS } from '../mock/members'
import { THEME_PRESETS } from '../mock/themePresets'
import { setupPresence, subscribePresenceByMember } from '../services/presence'
import { signOutCurrentUser } from '../services/auth'
import {
  dismissPermissionDeniedHint,
  getStatusLabel,
  getTodayDateKey,
  loadDueReminderCheckDate,
  loadDueReminderFlags,
  loadNotificationSettings,
  restorePermissionDeniedHint,
  saveDueReminderCheckDate,
  saveDueReminderFlags,
  saveNotificationSettings,
  sendDesktopNotification,
  shouldShowPermissionDeniedHint,
  subscribeNotificationTaskClick,
  type NotificationSettings,
} from '../services/notification'
import { SAVE_RETRY_EXHAUSTED, type UpdateTaskInput } from '../services/taskService'
import type { Task, TaskAssignee, TaskMember, TaskPriority, TaskStatus } from '../types/task'

interface BoardPageProps {
  currentUser: User
}

const MEMBER_MATCHERS: Array<{ member: TaskMember; keywords: string[] }> = [
  { member: 'cao', keywords: ['曹', 'cao'] },
  { member: 'liao', keywords: ['廖', 'liao'] },
  { member: 'deng', keywords: ['邓', 'deng'] },
]

function resolveCurrentMember(user: User): TaskMember | null {
  const source = `${user.displayName ?? ''} ${user.email ?? ''}`.toLowerCase()
  const matched = MEMBER_MATCHERS.find((item) =>
    item.keywords.some((keyword) => source.includes(keyword.toLowerCase())),
  )
  return matched?.member ?? null
}

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message === SAVE_RETRY_EXHAUSTED) {
    return '保存失败，请检查网络连接'
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

function getDaysUntil(timestamp: number) {
  const end = new Date(timestamp)
  const now = new Date()
  const endAt = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime()
  const nowAt = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return Math.ceil((endAt - nowAt) / (24 * 60 * 60 * 1000))
}

function BoardPage({ currentUser }: BoardPageProps) {
  const { isConnected, statusText, justReconnectedAt, clearReconnectedFlag } =
    useConnectionStatus()

  const {
    tasks,
    tasksByLane,
    stats,
    loading,
    error,
    setError,
    createTask,
    updateTask,
    deleteTask,
    optimisticMutate,
    optimisticPatchTask,
    consumeQueuedOfflineWrites,
  } = useTasks({ isConnected })

  const [isPersonalView, setIsPersonalView] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreateSaving, setIsCreateSaving] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isDetailSaving, setIsDetailSaving] = useState(false)
  const [contextMenuState, setContextMenuState] = useState<ContextMenuState | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() =>
    loadNotificationSettings(),
  )
  const [showPermissionDeniedHint, setShowPermissionDeniedHint] = useState(() =>
    shouldShowPermissionDeniedHint(),
  )
  const [memberPresence, setMemberPresence] = useState<Record<TaskMember, boolean>>({
    cao: false,
    liao: false,
    deng: false,
  })

  const toastTimersRef = useRef<Record<string, number>>({})
  const previousTasksRef = useRef<Record<string, Task>>({})
  const currentMember = useMemo(() => resolveCurrentMember(currentUser), [currentUser])
  const displayName = currentUser.displayName || currentUser.email || '未命名成员'

  const selectedPalette =
    THEME_PRESETS.find((preset) => preset.id === 12) ?? THEME_PRESETS[0]
  const themeStyle = useMemo(
    () =>
      ({
        ...selectedPalette.vars,
        fontFamily: 'var(--font-ui)',
      }) as CSSProperties,
    [selectedPalette.vars],
  )

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks],
  )
  const contextTask = useMemo(
    () => tasks.find((task) => task.id === contextMenuState?.taskId) ?? null,
    [contextMenuState?.taskId, tasks],
  )

  const removeToastByKey = useCallback((key: string) => {
    const timer = toastTimersRef.current[key]
    if (timer) {
      window.clearTimeout(timer)
      delete toastTimersRef.current[key]
    }
    setToasts((prev) => prev.filter((toast) => toast.key !== key))
  }, [])

  const pushToast = useCallback(
    (key: string, message: string) => {
      setToasts((prev) => {
        const existing = prev.find((toast) => toast.key === key)
        if (existing) {
          return prev.map((toast) =>
            toast.key === key ? { ...toast, message, count: toast.count + 1 } : toast,
          )
        }
        return [
          ...prev,
          {
            id: `${key}-${Date.now()}`,
            key,
            message,
            count: 1,
          },
        ]
      })

      if (toastTimersRef.current[key]) {
        window.clearTimeout(toastTimersRef.current[key])
      }
      toastTimersRef.current[key] = window.setTimeout(() => {
        removeToastByKey(key)
      }, 4000)
    },
    [removeToastByKey],
  )

  const closeToastById = useCallback((id: string) => {
    setToasts((prev) => {
      const target = prev.find((toast) => toast.id === id)
      if (target) {
        const timer = toastTimersRef.current[target.key]
        if (timer) {
          window.clearTimeout(timer)
          delete toastTimersRef.current[target.key]
        }
      }
      return prev.filter((toast) => toast.id !== id)
    })
  }, [])

  useEffect(() => {
    return () => {
      Object.values(toastTimersRef.current).forEach((timer) => window.clearTimeout(timer))
      toastTimersRef.current = {}
    }
  }, [])

  useEffect(() => {
    saveNotificationSettings(notificationSettings)
  }, [notificationSettings])

  useEffect(() => {
    if (typeof window.Notification === 'undefined') {
      setShowPermissionDeniedHint(false)
      return () => {}
    }

    const refreshPermissionHint = () => {
      if (window.Notification.permission === 'granted') {
        restorePermissionDeniedHint()
      }
      setShowPermissionDeniedHint(shouldShowPermissionDeniedHint())
    }

    refreshPermissionHint()
    window.addEventListener('focus', refreshPermissionHint)
    return () => {
      window.removeEventListener('focus', refreshPermissionHint)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = subscribePresenceByMember((presence) => {
      setMemberPresence(presence)
    })
    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    const unsubscribe = setupPresence(currentUser.uid, currentMember, displayName)
    return () => {
      unsubscribe()
    }
  }, [currentMember, currentUser.uid, displayName])

  useEffect(() => {
    if (!justReconnectedAt) {
      return
    }
    const syncedCount = consumeQueuedOfflineWrites()
    if (syncedCount > 0) {
      pushToast('network.recovered', `连接已恢复，${syncedCount} 条改动已同步`)
    }
    clearReconnectedFlag()
  }, [clearReconnectedFlag, consumeQueuedOfflineWrites, justReconnectedAt, pushToast])

  useEffect(() => {
    if (!selectedTaskId || selectedTask) {
      return
    }
    setSelectedTaskId(null)
    pushToast('task.missing', '该任务已被其他成员删除')
  }, [selectedTask, selectedTaskId, pushToast])

  useEffect(() => {
    const unsubscribe = subscribeNotificationTaskClick((taskId) => {
      setIsPersonalView(false)
      setSelectedTaskId(taskId)
      window.focus()
    })
    return () => {
      unsubscribe()
    }
  }, [])

  const personalTasks = useMemo(() => {
    if (!currentMember) {
      return { todo: [], doing: [], done: [] as Task[] }
    }

    const todo = tasks.filter(
      (task) => task.status === 'pending' && task.assignee === currentMember,
    )
    const doing = tasks.filter(
      (task) => task.status === 'in_progress' && task.takenBy === currentMember,
    )
    const done = tasks.filter(
      (task) => task.status === 'completed' && task.completedBy === currentMember,
    )

    todo.sort((a, b) => b.updatedAt - a.updatedAt)
    doing.sort((a, b) => b.updatedAt - a.updatedAt)
    done.sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))

    return { todo, doing, done }
  }, [currentMember, tasks])

  useEffect(() => {
    if (loading) {
      return
    }

    const previousTasks = previousTasksRef.current
    if (Object.keys(previousTasks).length === 0) {
      previousTasksRef.current = tasks.reduce<Record<string, Task>>((acc, task) => {
        acc[task.id] = task
        return acc
      }, {})
      return
    }

    void (async () => {
      for (const task of tasks) {
        const previous = previousTasks[task.id]
        if (!previous || previous.updatedAt === task.updatedAt) {
          continue
        }
        if (task.updatedByUid && task.updatedByUid === currentUser.uid) {
          continue
        }

        if (
          currentMember &&
          notificationSettings.assignment &&
          previous.assignee !== task.assignee &&
          task.assignee === currentMember
        ) {
          const actor = task.updatedByName ?? '团队成员'
          await sendDesktopNotification({
            title: '任务分配',
            body: `「${actor}」分配了任务给你：${task.title}`,
            taskId: task.id,
          })
        }

        if (previous.status !== task.status) {
          if (task.status === 'completed') {
            if (notificationSettings.taskCompleted) {
              const memberName = task.completedBy ? MEMBERS[task.completedBy].name : '团队成员'
              await sendDesktopNotification({
                title: '任务完成',
                body: `「${memberName}」完成了：${task.title}`,
                taskId: task.id,
              })
            }
            continue
          }

          if (notificationSettings.statusChange) {
            await sendDesktopNotification({
              title: '状态变更',
              body: `任务「${task.title}」已移至${getStatusLabel(task.status)}`,
              taskId: task.id,
            })
          }
        }
      }

      previousTasksRef.current = tasks.reduce<Record<string, Task>>((acc, task) => {
        acc[task.id] = task
        return acc
      }, {})
    })()
  }, [currentMember, currentUser.uid, loading, notificationSettings, tasks])

  useEffect(() => {
    if (loading || !notificationSettings.dueSoon) {
      return
    }

    const today = getTodayDateKey()
    const lastCheck = loadDueReminderCheckDate()
    if (lastCheck === today) {
      return
    }

    saveDueReminderCheckDate(today)
    const remindedFlags = loadDueReminderFlags()
    const nextFlags = { ...remindedFlags }

    void (async () => {
      for (const task of tasks) {
        if (task.status === 'completed' || !task.dueDate || nextFlags[task.id]) {
          continue
        }
        const daysLeft = getDaysUntil(task.dueDate)
        if (daysLeft < 0 || daysLeft > 3) {
          continue
        }
        const dueText = daysLeft === 0 ? '今天到期' : `还有${daysLeft}天到期`

        await sendDesktopNotification({
          title: '截止日期提醒',
          body: `⚠ 任务「${task.title}」${dueText}`,
          taskId: task.id,
        })
        nextFlags[task.id] = true
      }

      saveDueReminderFlags(nextFlags)
    })()
  }, [loading, notificationSettings.dueSoon, tasks])

  const runOptimisticUpdate = useCallback(
    async (
      taskId: string,
      patch: UpdateTaskInput,
      options: {
        errorKey: string
        errorMessage: string
        onSuccess?: () => void
      },
    ) => {
      const patchWithActor: UpdateTaskInput = {
        ...patch,
        updatedByUid: currentUser.uid,
        updatedByName: displayName,
      }
      const rollback = optimisticPatchTask(taskId, patchWithActor)

      try {
        await updateTask(taskId, patchWithActor)
        options.onSuccess?.()
      } catch (updateError) {
        rollback()
        pushToast(options.errorKey, toErrorMessage(updateError, options.errorMessage))
      }
    },
    [currentUser.uid, displayName, optimisticPatchTask, pushToast, updateTask],
  )

  const handleCreateTask = useCallback(() => {
    setIsCreateOpen(true)
  }, [])

  const handleCreateSubmit = useCallback(
    async (payload: {
      title: string
      description: string
      priority: TaskPriority
      assignee: TaskAssignee
      dueDate: number | null
    }) => {
      const now = Date.now()
      const optimisticTaskId = `optimistic-${now}-${Math.random().toString(16).slice(2, 8)}`
      const optimisticTask: Task = {
        id: optimisticTaskId,
        title: payload.title.trim(),
        description: payload.description.trim(),
        status: 'pending',
        priority: payload.priority,
        assignee: payload.assignee,
        takenBy: null,
        completedBy: null,
        completedAt: null,
        dueDate: payload.dueDate,
        createdAt: now,
        updatedAt: now,
        createdByUid: currentUser.uid,
        createdByName: displayName,
        updatedByUid: currentUser.uid,
        updatedByName: displayName,
      }
      const rollback = optimisticMutate((prev) => [optimisticTask, ...prev])

      setIsCreateSaving(true)
      try {
        const createdTask = await createTask({
          ...payload,
          createdByUid: currentUser.uid,
          createdByName: displayName,
          updatedByUid: currentUser.uid,
          updatedByName: displayName,
        })
        optimisticMutate((prev) => {
          const withoutOptimistic = prev.filter((task) => task.id !== optimisticTaskId)
          if (withoutOptimistic.some((task) => task.id === createdTask.id)) {
            return withoutOptimistic
          }
          return [createdTask, ...withoutOptimistic].sort((a, b) => b.updatedAt - a.updatedAt)
        })
        setIsCreateOpen(false)
      } catch (createError) {
        rollback()
        pushToast('task.create', toErrorMessage(createError, '创建任务失败，请稍后重试'))
        throw createError
      } finally {
        setIsCreateSaving(false)
      }
    },
    [createTask, currentUser.uid, displayName, optimisticMutate, pushToast],
  )

  const handleTakeTask = useCallback(
    (taskId: string) => {
      const task = tasks.find((item) => item.id === taskId)
      if (!task) {
        return
      }
      if (!currentMember) {
        pushToast('task.take.member', '未识别到你的成员身份，请用曹/廖/邓昵称登录')
        return
      }
      if (task.status === 'completed') {
        return
      }

      void runOptimisticUpdate(
        taskId,
        {
          status: 'in_progress',
          takenBy: currentMember,
          completedBy: null,
          completedAt: null,
        },
        {
          errorKey: 'task.take',
          errorMessage: '接单失败，请稍后重试',
        },
      )
    },
    [currentMember, pushToast, runOptimisticUpdate, tasks],
  )

  const handleMarkDone = useCallback(
    (taskId: string) => {
      const task = tasks.find((item) => item.id === taskId)
      if (!task) {
        return
      }

      const completedBy = task.takenBy ?? currentMember
      if (!completedBy) {
        pushToast('task.take.required', '请先指定执行人，再标记完成')
        return
      }

      void runOptimisticUpdate(
        taskId,
        {
          status: 'completed',
          takenBy: completedBy,
          completedBy,
          completedAt: Date.now(),
        },
        {
          errorKey: 'task.done',
          errorMessage: '标记完成失败，请稍后重试',
        },
      )
    },
    [currentMember, pushToast, runOptimisticUpdate, tasks],
  )

  const handleContextStatusChange = useCallback(
    (taskId: string, nextStatus: TaskStatus) => {
      const task = tasks.find((item) => item.id === taskId)
      if (!task) {
        return
      }

      if (nextStatus === 'pending') {
        void runOptimisticUpdate(
          taskId,
          {
            status: 'pending',
            takenBy: null,
            completedBy: null,
            completedAt: null,
          },
          {
            errorKey: 'task.status',
            errorMessage: '状态更新失败，请稍后重试',
          },
        )
        return
      }

      if (nextStatus === 'in_progress') {
        const nextTakenBy = task.takenBy ?? currentMember ?? task.assignee ?? null
        if (!nextTakenBy) {
          pushToast('task.take.member', '先指定执行人，再切换为正在执行')
          return
        }
        void runOptimisticUpdate(
          taskId,
          {
            status: 'in_progress',
            takenBy: nextTakenBy,
            completedBy: null,
            completedAt: null,
          },
          {
            errorKey: 'task.status',
            errorMessage: '状态更新失败，请稍后重试',
          },
        )
        return
      }

      const completedBy = task.takenBy ?? currentMember
      if (!completedBy) {
        pushToast('task.take.required', '请先接下任务，再标记完成')
        return
      }

      void runOptimisticUpdate(
        taskId,
        {
          status: 'completed',
          takenBy: task.takenBy ?? completedBy,
          completedBy,
          completedAt: Date.now(),
        },
        {
          errorKey: 'task.status',
          errorMessage: '状态更新失败，请稍后重试',
        },
      )
    },
    [currentMember, pushToast, runOptimisticUpdate, tasks],
  )

  const handleContextAssign = useCallback(
    (taskId: string, assignee: TaskAssignee) => {
      void runOptimisticUpdate(
        taskId,
        { assignee },
        {
          errorKey: 'task.assign',
          errorMessage: '分配失败，请稍后重试',
        },
      )
    },
    [runOptimisticUpdate],
  )

  const handleContextPriority = useCallback(
    (taskId: string, priority: TaskPriority) => {
      void runOptimisticUpdate(
        taskId,
        { priority },
        {
          errorKey: 'task.priority',
          errorMessage: '优先级更新失败，请稍后重试',
        },
      )
    },
    [runOptimisticUpdate],
  )

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      const confirmed = window.confirm('确认删除该任务吗？删除后不可恢复。')
      if (!confirmed) {
        return
      }

      const rollback = optimisticMutate((prev) => prev.filter((task) => task.id !== taskId))

      try {
        await deleteTask(taskId)
        if (selectedTaskId === taskId) {
          setSelectedTaskId(null)
        }
      } catch (deleteError) {
        rollback()
        pushToast('task.delete', toErrorMessage(deleteError, '删除失败，请稍后重试'))
      }
    },
    [deleteTask, optimisticMutate, pushToast, selectedTaskId],
  )

  const handleDetailSave = useCallback(
    async (
      taskId: string,
      patch: Partial<{
        title: string
        description: string
        status: TaskStatus
        priority: TaskPriority
        assignee: TaskAssignee
        takenBy: TaskAssignee
        dueDate: number | null
      }>,
    ) => {
      const task = tasks.find((item) => item.id === taskId)
      if (!task) {
        return
      }

      const nextPatch: UpdateTaskInput = { ...patch }

      if (typeof nextPatch.title === 'string') {
        nextPatch.title = nextPatch.title.trim()
      }
      if (typeof nextPatch.description === 'string') {
        nextPatch.description = nextPatch.description.trim()
      }

      if (nextPatch.status === 'pending') {
        nextPatch.takenBy = null
        nextPatch.completedBy = null
        nextPatch.completedAt = null
      }

      if (nextPatch.status === 'in_progress') {
        nextPatch.completedBy = null
        nextPatch.completedAt = null
        if (nextPatch.takenBy === undefined) {
          nextPatch.takenBy = task.takenBy ?? currentMember ?? null
        }
      }

      if (nextPatch.status === 'completed') {
        const completedBy =
          (nextPatch.takenBy as TaskMember | null | undefined) ??
          task.takenBy ??
          currentMember
        if (!completedBy) {
          pushToast('task.take.required', '请先接下任务，再标记完成')
          return
        }
        nextPatch.takenBy = completedBy
        nextPatch.completedBy = completedBy
        nextPatch.completedAt = Date.now()
      }

      if (nextPatch.takenBy !== undefined && nextPatch.status === undefined) {
        if (nextPatch.takenBy === null) {
          nextPatch.status = 'pending'
          nextPatch.completedBy = null
          nextPatch.completedAt = null
        } else if (task.status !== 'completed') {
          nextPatch.status = 'in_progress'
          nextPatch.completedBy = null
          nextPatch.completedAt = null
        }
      }

      setIsDetailSaving(true)
      await runOptimisticUpdate(taskId, nextPatch, {
        errorKey: 'task.detail.save',
        errorMessage: '保存失败，请检查网络连接',
      })
      setIsDetailSaving(false)
    },
    [currentMember, pushToast, runOptimisticUpdate, tasks],
  )

  const handleTaskContextMenu = useCallback((taskId: string, x: number, y: number) => {
    const maxX = Math.max(8, window.innerWidth - 240)
    const maxY = Math.max(8, window.innerHeight - 420)

    setContextMenuState({
      taskId,
      x: Math.min(x, maxX),
      y: Math.min(y, maxY),
    })
  }, [])

  const handleToggleNotificationSetting = useCallback(
    (key: keyof NotificationSettings) => {
      setNotificationSettings((prev) => ({
        ...prev,
        [key]: !prev[key],
      }))
    },
    [],
  )

  const handleClosePermissionDeniedHint = useCallback(() => {
    dismissPermissionDeniedHint()
    setShowPermissionDeniedHint(false)
  }, [])

  const handleSignOut = useCallback(() => {
    void signOutCurrentUser()
  }, [])

  const handleGlobalEscape = useCallback(() => {
    if (contextMenuState) {
      setContextMenuState(null)
      return
    }
    if (selectedTaskId) {
      setSelectedTaskId(null)
      return
    }
    if (isCreateOpen) {
      setIsCreateOpen(false)
    }
  }, [contextMenuState, isCreateOpen, selectedTaskId])

  useKeyboard({
    onNewTask: handleCreateTask,
    onEscape: handleGlobalEscape,
  })

  return (
    <main style={themeStyle} className="flex h-screen flex-col bg-[var(--color-bg-page)]">
      <TopBar
        userName={displayName}
        boardTitle={isPersonalView ? '个人任务面板' : '公开任务看板'}
        syncText={statusText}
        syncConnected={isConnected}
        currentMember={currentMember}
        memberPresence={memberPresence}
        todayNewCount={stats.todayNewCount}
        inProgressCount={stats.inProgressCount}
        weekDoneCount={stats.weekDoneCount}
        isPersonalView={isPersonalView}
        notificationSettings={notificationSettings}
        showPermissionDeniedHint={showPermissionDeniedHint}
        onAvatarClick={() => {
          setIsPersonalView((prev) => !prev)
        }}
        onToggleNotificationSetting={handleToggleNotificationSetting}
        onClosePermissionDeniedHint={handleClosePermissionDeniedHint}
        onCreateTask={handleCreateTask}
        onSignOut={handleSignOut}
      />

      <div
        className={`h-7 items-center border-b border-[var(--color-border-subtle)] bg-[var(--color-accent-board-tint)] px-4 text-[length:var(--fs-sm)] text-[var(--color-text-secondary)] ${
          isConnected ? 'hidden' : 'flex'
        }`}
      >
        当前处于离线状态，任务会在恢复网络后自动同步……
      </div>

      {error ? (
        <div className="border-b border-[var(--color-status-offline)] bg-[var(--color-priority-high-tint)] px-4 py-1 text-[length:var(--fs-sm)] text-[var(--color-text-secondary)]">
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-2 rounded border border-[var(--color-border-subtle)] px-1.5 py-0.5"
          >
            知道了
          </button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 p-3">
        {loading ? (
          <section className="flex h-full items-center justify-center rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
            <p className="text-[length:var(--fs-lg)] text-[var(--color-text-secondary)]">正在同步任务数据...</p>
          </section>
        ) : isPersonalView ? (
          <PersonalBoard
            currentMember={currentMember}
            todoTasks={personalTasks.todo}
            doingTasks={personalTasks.doing}
            doneTasks={personalTasks.done}
            onTaskOpen={setSelectedTaskId}
            onTaskContextMenu={handleTaskContextMenu}
            onTakeTask={handleTakeTask}
            onMarkDone={handleMarkDone}
          />
        ) : (
          <Board
            pendingTasks={tasksByLane.pending}
            memberDone={tasksByLane.memberDone}
            memberHistory={tasksByLane.memberHistory}
            currentMember={currentMember}
            onTaskOpen={setSelectedTaskId}
            onTaskContextMenu={handleTaskContextMenu}
            onTakeTask={handleTakeTask}
            onMarkDone={handleMarkDone}
          />
        )}
      </div>

      <CreateTaskModal
        isOpen={isCreateOpen}
        isSaving={isCreateSaving}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <TaskDetailPanel
        task={selectedTask}
        isSaving={isDetailSaving}
        onClose={() => setSelectedTaskId(null)}
        onSave={handleDetailSave}
        onDelete={handleDeleteTask}
      />

      <ContextMenu
        state={contextMenuState}
        task={contextTask}
        currentMember={currentMember}
        onClose={() => setContextMenuState(null)}
        onChangeStatus={handleContextStatusChange}
        onAssign={handleContextAssign}
        onTakeTask={(_taskId) => {
          handleTakeTask(_taskId)
        }}
        onPriority={handleContextPriority}
        onDelete={(taskId) => {
          void handleDeleteTask(taskId)
        }}
      />

      <Toast toasts={toasts} onClose={closeToastById} />
    </main>
  )
}

export default BoardPage
