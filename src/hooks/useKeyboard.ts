import { useEffect } from 'react'

interface UseKeyboardOptions {
  onNewTask: () => void
  onEscape: () => void
}

export function useKeyboard({ onNewTask, onEscape }: UseKeyboardOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        onNewTask()
        return
      }

      if (event.key === 'Escape') {
        onEscape()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onEscape, onNewTask])
}

