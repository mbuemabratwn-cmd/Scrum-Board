import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import BoardPage from './pages/BoardPage'
import LoginPage from './pages/LoginPage'
import { subscribeAuthState } from './services/auth'

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(false)

  useEffect(() => {
    const unsubscribe = subscribeAuthState((nextUser) => {
      setCurrentUser(nextUser)
      setIsAuthReady(true)
    })

    return unsubscribe
  }, [])

  if (!isAuthReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg-page)] text-[var(--color-text-secondary)]">
        <p className="text-sm">正在初始化会话...</p>
      </main>
    )
  }

  if (!currentUser) {
    return <LoginPage />
  }

  return <BoardPage currentUser={currentUser} />
}

export default App
