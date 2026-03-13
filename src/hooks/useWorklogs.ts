import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { hasFirebaseConfig } from '../config/firebase'
import {
  createWorklog,
  deleteWorklog,
  subscribeToWorklogs,
  type CreateWorklogInput,
} from '../services/worklogService'
import type { TaskMember } from '../types/task'
import type { WorklogEntry } from '../types/worklog'

const WORKLOG_CACHE_KEY = 'scrum-board.worklogs.cache.v1'

function loadCachedEntries(): WorklogEntry[] {
  try {
    const raw = window.localStorage.getItem(WORKLOG_CACHE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as WorklogEntry[]
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter((entry) => entry && typeof entry.id === 'string')
  } catch {
    return []
  }
}

function saveCachedEntries(entries: WorklogEntry[]) {
  try {
    window.localStorage.setItem(WORKLOG_CACHE_KEY, JSON.stringify(entries))
  } catch {
    // localStorage 配额不足时静默忽略
  }
}

export function useWorklogs() {
  const cachedEntries = useMemo(() => loadCachedEntries(), [])
  const [entries, setEntries] = useState<WorklogEntry[]>(cachedEntries)
  const [loading, setLoading] = useState(hasFirebaseConfig && cachedEntries.length === 0)
  const [error, setError] = useState<string | null>(null)
  const entriesRef = useRef(entries)

  useEffect(() => {
    entriesRef.current = entries
  }, [entries])

  useEffect(() => {
    if (!hasFirebaseConfig) {
      return () => {}
    }

    const unsubscribe = subscribeToWorklogs((nextEntries) => {
      setEntries(nextEntries)
      setLoading(false)
      setError(null)
      saveCachedEntries(nextEntries)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const createEntry = useCallback(
    async (input: CreateWorklogInput) => {
      if (!hasFirebaseConfig) {
        const now = Date.now()
        const nextEntry: WorklogEntry = {
          id: `local-${now}-${Math.random().toString(16).slice(2, 8)}`,
          member: input.member,
          content: input.content.trim(),
          createdAt: now,
          updatedAt: now,
          createdByUid: input.createdByUid,
          createdByName: input.createdByName,
        }
        const nextEntries = [nextEntry, ...entriesRef.current].sort((a, b) => b.createdAt - a.createdAt)
        setEntries(nextEntries)
        saveCachedEntries(nextEntries)
        return nextEntry
      }

      return createWorklog(input)
    },
    [],
  )

  const removeEntry = useCallback(async (entryId: string) => {
    if (!hasFirebaseConfig) {
      const nextEntries = entriesRef.current.filter((entry) => entry.id !== entryId)
      setEntries(nextEntries)
      saveCachedEntries(nextEntries)
      return
    }

    await deleteWorklog(entryId)
  }, [])

  const groupedByMember = useMemo<Record<TaskMember, WorklogEntry[]>>(
    () => ({
      cao: entries.filter((entry) => entry.member === 'cao').sort((a, b) => b.createdAt - a.createdAt),
      liao: entries.filter((entry) => entry.member === 'liao').sort((a, b) => b.createdAt - a.createdAt),
      deng: entries.filter((entry) => entry.member === 'deng').sort((a, b) => b.createdAt - a.createdAt),
    }),
    [entries],
  )

  return {
    entries,
    groupedByMember,
    loading,
    error,
    setError,
    createEntry,
    deleteEntry: removeEntry,
  }
}

