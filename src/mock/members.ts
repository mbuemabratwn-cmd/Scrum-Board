import type { TaskMember } from '../types/task'

export const MEMBERS: Record<
  TaskMember,
  { key: TaskMember; name: string; short: string; color: string; textColor: string }
> = {
  cao: {
    key: 'cao',
    name: '曹舜钦',
    short: '曹',
    color: 'var(--color-assignee-cao)',
    textColor: 'var(--color-assignee-cao-text)',
  },
  liao: {
    key: 'liao',
    name: '廖锋',
    short: '廖',
    color: 'var(--color-assignee-liao)',
    textColor: 'var(--color-assignee-liao-text)',
  },
  deng: {
    key: 'deng',
    name: '邓净仪',
    short: '邓',
    color: 'var(--color-assignee-deng)',
    textColor: 'var(--color-assignee-deng-text)',
  },
}
