export interface ToastItem {
  id: string
  key: string
  message: string
  count: number
}

interface ToastProps {
  toasts: ToastItem[]
  onClose: (id: string) => void
}

function Toast({ toasts, onClose }: ToastProps) {
  return (
    <aside className="pointer-events-none fixed bottom-4 right-4 z-30 flex w-[320px] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-[8px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-3 shadow-[0_8px_20px_rgba(40,40,50,0.14)]"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-[length:var(--fs-md)] text-[var(--color-text-primary)]">
              {toast.message}
              {toast.count > 1 ? `（x${toast.count}）` : ''}
            </p>
            <button
              type="button"
              className="rounded-[4px] px-1 text-[length:var(--fs-xs)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-muted)]"
              onClick={() => onClose(toast.id)}
            >
              关闭
            </button>
          </div>
        </div>
      ))}
    </aside>
  )
}

export default Toast
