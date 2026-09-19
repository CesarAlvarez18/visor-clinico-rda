import { LEVEL_LABELS, type SystemLevel } from '../../rules/levels'

const ORDER: SystemLevel[] = ['normal', 'mild', 'moderate', 'severe', 'no-data']

export function Legend() {
  return (
    <ul className="legend" aria-label="Leyenda de niveles de afectación">
      {ORDER.map((level) => (
        <li key={level} className={`legend__item level--${level}`}>
          <span className="legend__swatch" aria-hidden="true" />
          <span>{LEVEL_LABELS[level]}</span>
        </li>
      ))}
    </ul>
  )
}
