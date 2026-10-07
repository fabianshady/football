/** Every stored match date is a UTC instant. Tijuana is always the primary display. */
export const VENUE_TZ = 'America/Tijuana'
export const DATE_STORAGE_MODE = 'utc-instant'

export function parseMatchDate(input: string | Date): Date {
  if (input instanceof Date) return new Date(input.getTime())
  const raw = input.trim().replace(' ', 'T')
  const date = new Date(/[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw) ? raw : `${raw}Z`)
  if (!Number.isFinite(date.getTime())) throw new RangeError(`Fecha de partido inválida: ${input}`)
  return date
}

export function getViewerTimeZone(): string { return Intl.DateTimeFormat().resolvedOptions().timeZone || VENUE_TZ }
export function isSameZone(a: string, b: string): boolean { return a === b }
export function formatDateTimeInZone(input: string | Date, timeZone: string, options: Intl.DateTimeFormatOptions = {}): string {
  if (Object.keys(options).length) return new Intl.DateTimeFormat('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', ...options, timeZone }).format(parseMatchDate(input))
  // Assemble a stable Spanish label: Node/browser ICU punctuation and month aliases differ.
  const parts = new Intl.DateTimeFormat('en-US', { weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone }).formatToParts(parseMatchDate(input))
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  const weekdays: Record<string, string> = { Sun: 'dom', Mon: 'lun', Tue: 'mar', Wed: 'mié', Thu: 'jue', Fri: 'vie', Sat: 'sáb' }
  const month = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][Number(get('month')) - 1]
  return `${weekdays[get('weekday')]} ${get('day')} ${month} ${get('year')}, ${get('hour')}:${get('minute')}`
}
export function formatVenueDateTime(input: string | Date): string { return formatDateTimeInZone(input, VENUE_TZ) }
export function formatViewerDateTime(input: string | Date): string { return formatDateTimeInZone(input, getViewerTimeZone()) }
export function formatVenueClock(input: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', { timeZone: VENUE_TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(parseMatchDate(input))
}
export function formatMonthLabel(input: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', { month: 'short', year: 'numeric', timeZone: VENUE_TZ }).format(parseMatchDate(input))
}
export type CountdownParts = { totalMs: number; days: number; hours: number; minutes: number; seconds: number; expired: boolean }
export function getCountdownParts(target: string | Date, now = new Date()): CountdownParts {
  const totalMs = parseMatchDate(target).getTime() - now.getTime()
  const value = Math.max(0, totalMs)
  return { totalMs, days: Math.floor(value / 86400000), hours: Math.floor(value % 86400000 / 3600000), minutes: Math.floor(value % 3600000 / 60000), seconds: Math.floor(value % 60000 / 1000), expired: totalMs <= 0 }
}
