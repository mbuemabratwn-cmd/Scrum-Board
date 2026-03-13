import { THEME_PRESETS } from '../mock/themePresets'

interface ThemeSelectorProps {
  paletteId: number
  onPaletteChange: (id: number) => void
}

function ThemeSelector({ paletteId, onPaletteChange }: ThemeSelectorProps) {
  return (
    <aside className="fixed bottom-4 right-4 z-20 w-[260px] rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-3 shadow-[0_8px_24px_rgba(40,40,50,0.14)]">
      <p className="text-[length:var(--fs-sm)] font-semibold text-[var(--color-text-primary)]">
        临时配色切换
      </p>
      <p className="mt-1 text-[length:var(--fs-xs)] text-[var(--color-text-secondary)]">
        当前：配色 #{paletteId}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {THEME_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onPaletteChange(preset.id)}
            className={`rounded-md border px-2 py-1 text-[length:var(--fs-xs)] ${
              paletteId === preset.id
                ? 'border-[var(--color-accent-board)] bg-[var(--color-accent-board-tint)] text-[var(--color-accent-board-active)]'
                : 'border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]'
            }`}
            title={preset.name}
          >
            #{preset.id} {preset.name}
          </button>
        ))}
      </div>
    </aside>
  )
}

export default ThemeSelector
