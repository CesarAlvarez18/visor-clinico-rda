export type ViewMode = '2d' | '3d'

interface ViewModeToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
}

/** Conmutador 2D / 3D de la vista principal (CA-1, CA-4). */
export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div className="view-mode-toggle" role="group" aria-label="Vista del cuerpo">
      <button type="button" aria-pressed={value === '2d'} onClick={() => onChange('2d')}>
        2D
      </button>
      <button type="button" aria-pressed={value === '3d'} onClick={() => onChange('3d')}>
        3D
      </button>
    </div>
  )
}
