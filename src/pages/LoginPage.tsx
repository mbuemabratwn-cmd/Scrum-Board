import { useState, type FormEvent } from 'react'
import {
  firebaseAuthAvailable,
  getAuthFieldErrors,
  registerWithPassword,
  signInWithPassword,
  type AuthFieldErrors,
} from '../services/auth'

type Mode = 'login' | 'register'

interface FormState {
  email: string
  password: string
  nickname: string
}

const INITIAL_FORM: FormState = {
  email: '',
  password: '',
  nickname: '',
}

function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [errors, setErrors] = useState<AuthFieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isRegisterMode = mode === 'register'

  const handleModeSwitch = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'))
    setErrors({})
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: AuthFieldErrors = {}
    if (!form.email.trim()) {
      nextErrors.email = '请输入邮箱。'
    }
    if (!form.password) {
      nextErrors.password = '请输入密码。'
    }
    if (isRegisterMode && !form.nickname.trim()) {
      nextErrors.nickname = '请输入昵称。'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      if (isRegisterMode) {
        await registerWithPassword(form.email.trim(), form.password, form.nickname.trim())
      } else {
        await signInWithPassword(form.email.trim(), form.password)
      }
    } catch (error) {
      setErrors(getAuthFieldErrors(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg-page)] px-4 py-10">
      <section className="w-full max-w-[360px] rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-6 shadow-sm">
        <header className="mb-5">
          <h1 className="text-center text-[20px] font-medium text-[var(--color-text-primary)]">
            木质部看板
          </h1>
          <p className="mt-2 text-center text-sm text-[var(--color-text-secondary)]">
            {isRegisterMode ? '创建新账号' : '登录你的账号'}
          </p>
        </header>

        {!firebaseAuthAvailable && (
          <p className="mb-4 rounded-md border border-[var(--color-priority-mid)] bg-[#fff8ed] px-3 py-2 text-xs text-[#8b6421]">
            当前未配置 Firebase，认证功能暂不可用。
          </p>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              className="mb-1 block text-sm text-[var(--color-text-secondary)]"
              htmlFor="email"
            >
              邮箱
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-md border border-[var(--color-border-subtle)] bg-white px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-accent-login)]"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
            {errors.email && <p className="mt-1 text-xs text-[var(--color-priority-high)]">{errors.email}</p>}
          </div>

          {isRegisterMode && (
            <div>
              <label
                className="mb-1 block text-sm text-[var(--color-text-secondary)]"
                htmlFor="nickname"
              >
                昵称
              </label>
              <input
                id="nickname"
                type="text"
                autoComplete="nickname"
                className="w-full rounded-md border border-[var(--color-border-subtle)] bg-white px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-accent-login)]"
                value={form.nickname}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, nickname: event.target.value }))
                }
              />
              {errors.nickname && (
                <p className="mt-1 text-xs text-[var(--color-priority-high)]">{errors.nickname}</p>
              )}
            </div>
          )}

          <div>
            <label
              className="mb-1 block text-sm text-[var(--color-text-secondary)]"
              htmlFor="password"
            >
              密码
            </label>
            <input
              id="password"
              type="password"
              autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
              className="w-full rounded-md border border-[var(--color-border-subtle)] bg-white px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-accent-login)]"
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
            />
            {errors.password && (
              <p className="mt-1 text-xs text-[var(--color-priority-high)]">{errors.password}</p>
            )}
          </div>

          {errors.form && <p className="text-xs text-[var(--color-priority-high)]">{errors.form}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-[var(--color-accent-login)] px-3 py-2 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? '提交中...' : isRegisterMode ? '注册' : '登录'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--color-text-secondary)]">
          {isRegisterMode ? '已有账号？' : '没有账号？'}
          <button
            type="button"
            onClick={handleModeSwitch}
            className="ml-1 text-[var(--color-accent-login)] hover:underline"
          >
            {isRegisterMode ? '去登录' : '注册'}
          </button>
        </p>
      </section>
    </main>
  )
}

export default LoginPage
