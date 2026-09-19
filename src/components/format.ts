import type { EncounterKind, Sex } from '../domain/types'

export const ENCOUNTER_KIND_LABELS: Record<EncounterKind, string> = {
  ambulatory: 'Consulta externa',
  emergency: 'Urgencias',
  hospitalization: 'Hospitalización',
  unknown: 'Atención',
}

export const SEX_LABELS: Record<Sex, string> = {
  male: 'Masculino',
  female: 'Femenino',
  other: 'Otro',
  unknown: 'Sexo no registrado',
}

const dateFormatter = new Intl.DateTimeFormat('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
// Una fecha sin hora (YYYY-MM-DD) se interpreta en UTC; se formatea también en
// UTC para que no retroceda un día en Colombia (UTC-5).
const dateOnlyFormatter = new Intl.DateTimeFormat('es-CO', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

export function formatDate(iso: string | undefined): string {
  if (!iso) return 'fecha no registrada'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return (DATE_ONLY.test(iso) ? dateOnlyFormatter : dateFormatter).format(date)
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return 'fecha no registrada'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : dateTimeFormatter.format(date)
}

/** Fecha corta YYYY-MM-DD, estable para pruebas y listas. */
export function formatIsoDate(iso: string | undefined): string {
  return iso ? iso.slice(0, 10) : 'sin fecha'
}
