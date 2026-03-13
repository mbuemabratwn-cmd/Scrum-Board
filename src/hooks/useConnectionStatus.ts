import { useEffect, useRef, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { db, hasFirebaseConfig } from '../config/firebase'

export function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(Boolean(db && hasFirebaseConfig))
  const wasDisconnectedRef = useRef(false)
  const [justReconnectedAt, setJustReconnectedAt] = useState<number | null>(null)

  useEffect(() => {
    if (!db || !hasFirebaseConfig) {
      return () => {}
    }

    return onValue(ref(db, '.info/connected'), (snapshot) => {
      const connected = Boolean(snapshot.val())

      if (!connected) {
        wasDisconnectedRef.current = true
      } else if (wasDisconnectedRef.current) {
        setJustReconnectedAt(Date.now())
        wasDisconnectedRef.current = false
      }

      setIsConnected(connected)
    })
  }, [])

  return {
    isConnected,
    statusText: isConnected ? '已连接' : '断线重连中',
    justReconnectedAt,
    clearReconnectedFlag: () => setJustReconnectedAt(null),
  }
}
