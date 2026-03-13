export interface ThemePreset {
  id: number
  name: string
  vars: Record<string, string>
}

interface ThemeInput {
  id: number
  name: string
  bgPage: string
  bgColumn: string
  accent: string
  accentHover: string
  accentActive: string
  accentTint: string
  priorityHigh: string
  priorityHighTint: string
  priorityMid: string
  priorityMidTint: string
  priorityLow: string
  priorityLowTint: string
}

const baseVars = {
  '--color-bg-surface': '#FFFFFF',
  '--color-bg-hover-card': '#F5F8FA',
  '--color-bg-muted': '#E9EEF2',
  '--color-text-primary': '#1F2A34',
  '--color-text-secondary': '#4A5A68',
  '--color-text-tertiary': '#7E8E9C',
  '--color-border-subtle': '#D3DDE5',
  '--color-status-online': '#2EAD78',
  '--color-status-offline': '#D65B64',
  '--color-assignee-cao': '#E0D4F7',
  '--color-assignee-cao-text': '#5B3FA0',
  '--color-assignee-liao': '#D4ECF7',
  '--color-assignee-liao-text': '#2A6F9C',
  '--color-assignee-deng': '#F7E4D4',
  '--color-assignee-deng-text': '#9C5A2A',
}

function createTheme(input: ThemeInput): ThemePreset {
  return {
    id: input.id,
    name: input.name,
    vars: {
      ...baseVars,
      '--color-bg-page': input.bgPage,
      '--color-bg-column': input.bgColumn,
      '--color-accent-login': input.accent,
      '--color-accent-board': input.accent,
      '--color-accent-board-hover': input.accentHover,
      '--color-accent-board-active': input.accentActive,
      '--color-accent-board-tint': input.accentTint,
      '--color-priority-high': input.priorityHigh,
      '--color-priority-high-tint': input.priorityHighTint,
      '--color-priority-high-border': 'rgba(220, 20, 60, 0.52)',
      '--color-priority-mid': input.priorityMid,
      '--color-priority-mid-tint': input.priorityMidTint,
      '--color-priority-mid-border': 'rgba(68, 172, 255, 0.45)',
      '--color-priority-low': input.priorityLow,
      '--color-priority-low-tint': input.priorityLowTint,
      '--color-priority-low-border': 'rgba(129, 198, 156, 0.5)',
    },
  }
}

export const THEME_PRESETS: ThemePreset[] = [
  createTheme({
    id: 4,
    name: '冰湖蓝阶',
    bgPage: '#EDF1F5',
    bgColumn: '#E2E8EF',
    accent: '#6C90D1',
    accentHover: '#5D82C4',
    accentActive: '#5173B3',
    accentTint: '#DAE5F8',
    priorityHigh: '#DC143C',
    priorityHighTint: 'rgba(220, 20, 60, 0.34)',
    priorityMid: '#44ACFF',
    priorityMidTint: '#B6E0FF',
    priorityLow: '#CFFFE2',
    priorityLowTint: 'rgba(207, 255, 226, 0.72)',
  }),
  createTheme({
    id: 12,
    name: '天青石榴',
    bgPage: '#EEF1F4',
    bgColumn: '#E3E8EE',
    accent: '#5B97D3',
    accentHover: '#4F88C1',
    accentActive: '#4478AB',
    accentTint: '#DBE8F6',
    priorityHigh: '#DC143C',
    priorityHighTint: 'rgba(220, 20, 60, 0.34)',
    priorityMid: '#44ACFF',
    priorityMidTint: '#B6E0FF',
    priorityLow: '#CFFFE2',
    priorityLowTint: 'rgba(207, 255, 226, 0.72)',
  }),
]
