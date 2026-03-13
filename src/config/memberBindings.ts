import type { TaskMember } from '../types/task'

const LIAO_UID = (import.meta.env.VITE_MEMBER_UID_LIAO ?? '').trim()

export const UID_MEMBER_MAP: Record<string, TaskMember> = {
  vArEQYrvYQZRdsURAl968XLfYY13: 'cao',
  fYMhL5zmlNZcd3YBk6vJUApQX672: 'deng',
  ...(LIAO_UID ? { [LIAO_UID]: 'liao' as TaskMember } : {}),
}

export function resolveMemberByUid(uid: string): TaskMember | null {
  return UID_MEMBER_MAP[uid] ?? null
}

