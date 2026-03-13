import {
  onDisconnect,
  onValue,
  ref,
  serverTimestamp,
  set,
  type OnDisconnect,
  type Unsubscribe,
} from 'firebase/database'
import { db, hasFirebaseConfig } from '../config/firebase'
import type { TaskMember } from '../types/task'

type PresenceValue = {
  state: 'online' | 'offline'
  member: TaskMember | null
  displayName: string
  lastChanged: number
}

export type PresenceByMember = Record<TaskMember, boolean>

const EMPTY_PRESENCE: PresenceByMember = {
  cao: false,
  liao: false,
  deng: false,
}

function isTaskMember(value: unknown): value is TaskMember {
  return value === 'cao' || value === 'liao' || value === 'deng'
}

function getStatusRef(uid: string) {
  if (!db || !hasFirebaseConfig) {
    throw new Error('Firebase 数据库未配置')
  }
  return ref(db, `status/${uid}`)
}

export function setupPresence(
  uid: string,
  member: TaskMember | null,
  displayName: string,
): Unsubscribe {
  if (!db || !hasFirebaseConfig) {
    return () => {}
  }

  const connectedRef = ref(db, '.info/connected')
  const statusRef = getStatusRef(uid)

  let disconnectHandler: OnDisconnect | null = null

  const unsubscribe = onValue(connectedRef, async (snapshot) => {
    if (!snapshot.val()) {
      return
    }

    const offlinePayload = {
      state: 'offline',
      member,
      displayName,
      lastChanged: serverTimestamp(),
    }
    const onlinePayload = {
      state: 'online',
      member,
      displayName,
      lastChanged: serverTimestamp(),
    }

    disconnectHandler = onDisconnect(statusRef)
    await disconnectHandler.set(offlinePayload)
    await set(statusRef, onlinePayload)
  })

  return () => {
    if (disconnectHandler) {
      void disconnectHandler.cancel()
    }
    void set(statusRef, {
      state: 'offline',
      member,
      displayName,
      lastChanged: serverTimestamp(),
    })
    unsubscribe()
  }
}

export function subscribePresenceByMember(
  onChange: (presence: PresenceByMember) => void,
): Unsubscribe {
  if (!db || !hasFirebaseConfig) {
    onChange(EMPTY_PRESENCE)
    return () => {}
  }

  return onValue(ref(db, 'status'), (snapshot) => {
    const value = snapshot.val() as Record<string, PresenceValue> | null
    if (!value) {
      onChange(EMPTY_PRESENCE)
      return
    }

    const next: PresenceByMember = {
      cao: false,
      liao: false,
      deng: false,
    }

    Object.values(value).forEach((item) => {
      if (!item || !isTaskMember(item.member)) {
        return
      }
      if (item.state === 'online') {
        next[item.member] = true
      }
    })

    onChange(next)
  })
}
