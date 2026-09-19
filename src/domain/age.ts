/** Edad cumplida en `at` (ISO 8601) para alguien nacido en `birthDate` (YYYY-MM-DD). */
export function ageAt(birthDate: string, at: string): number | undefined {
  const birth = new Date(birthDate)
  const date = new Date(at)
  if (Number.isNaN(birth.getTime()) || Number.isNaN(date.getTime())) return undefined
  let age = date.getUTCFullYear() - birth.getUTCFullYear()
  const beforeBirthday =
    date.getUTCMonth() < birth.getUTCMonth() ||
    (date.getUTCMonth() === birth.getUTCMonth() && date.getUTCDate() < birth.getUTCDate())
  if (beforeBirthday) age -= 1
  return age < 0 ? undefined : age
}
