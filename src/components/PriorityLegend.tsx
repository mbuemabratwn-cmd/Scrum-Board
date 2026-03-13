function Swatch({
  label,
  border,
  bg,
}: {
  label: string
  border: string
  bg: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex h-5 w-8 rounded-[5px] border"
        style={{ borderColor: border, background: bg }}
      />
      <span className="text-[length:var(--fs-xs)] text-[var(--color-text-secondary)]">{label}</span>
    </div>
  )
}

function PriorityLegend() {
  return (
    <aside className="pointer-events-none fixed bottom-4 left-4 z-20 w-[220px] rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-3 shadow-[0_8px_24px_rgba(40,40,50,0.12)]">
      <p className="text-[length:var(--fs-sm)] font-semibold text-[var(--color-text-primary)]">
        优先级颜色说明
      </p>
      <div className="mt-2 space-y-1.5">
        <Swatch
          label="高优先级"
          border="var(--color-priority-high-border)"
          bg="var(--color-priority-high-tint)"
        />
        <Swatch
          label="中优先级"
          border="var(--color-priority-mid-border)"
          bg="var(--color-priority-mid-tint)"
        />
        <Swatch
          label="低优先级"
          border="var(--color-priority-low-border)"
          bg="var(--color-priority-low-tint)"
        />
      </div>
    </aside>
  )
}

export default PriorityLegend
