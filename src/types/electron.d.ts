declare global {
  interface Window {
    desktop: {
      platform: string
      electronVersion: string
      showNotification: (payload: { title: string; body: string; taskId?: string }) => Promise<boolean>
      onNotificationTaskClick: (listener: (taskId: string) => void) => () => void
    }
  }
}

export {}
