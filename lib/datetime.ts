import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'

/** Kickoff times are recorded as Tijuana wall-clock, even if Supabase tags them UTC. */
export const VENUE_TZ = 'America/Tijuana'

/**
 * `utc-instant`: Supabase timestamptz (p.ej. 01:50Z = 18:50 en Tijuana).
 * `venue-wallclock`: si el reloj guardado es la hora de Tijuana con una Z cosmética.
 */
export const DATE_STORAGE_MODE: 'venue-wallclock' | 'utc-instant' = 'utc-instant'

const NAIVE_RE = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::(\d{2}))?/

export function parseMatchDate(input: string | Date): Date {
  if (DATE_STORAGE_MODE === 'utc-instant') {
    if (input instanceof Date) return input
    const raw = input.trim()
    const hasZone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw.replace(/\.\d+(?=[zZ]|[+-]\d{2}|$)/, ''))
    if (NAIVE_RE.test(raw) && !hasZone) {
      return new Date(raw.endsWith('Z') ? raw : `${raw}Z`)
    }
    return new Date(raw)
  }

  const raw = typeof input === 'string' ? input : toClockSource(input)
  const match = raw.match(NAIVE_RE)
  if (!match) return new Date(input)

  const seconds = match[3] ?? '00'
  return fromZonedTime(`${match[1]}T${match[2]}:${seconds}`, VENUE_TZ)
}

function toClockSource(date: Date): string {
  // Dates coming from JSON/ISO are UTC-tagged; keep the stored clock, not the host TZ.
  return date.toISOString().replace(/\.\d{3}Z$/, '')
}

const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}

export function getViewerTimeZone(): string {
  if (typeof Intl === 'undefined') return VENUE_TZ
  return Intl.DateTimeFormat().resolvedOptions().timeZone || VENUE_TZ
}

export function isSameZone(a: string, b: string): boolean {
  return a === b || a.replace(/_/g, ' ').toLowerCase() === b.replace(/_/g, ' ').toLowerCase()
}

export function formatDateTimeInZone(
  input: string | Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = DATE_TIME_OPTIONS
): string {
  const instant = parseMatchDate(input)
  const parts = new Intl.DateTimeFormat('es-MX', {
    ...DATE_TIME_OPTIONS,
    ...options,
    timeZone,
  }).formatToParts(instant)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value.replace(/\.$/, '') ?? ''

  const weekday = get('weekday')
  const day = get('day')
  const month = get('month')
  const hour = get('hour').padStart(2, '0')
  const minute = get('minute').padStart(2, '0')
  return `${weekday} ${day} ${month}, ${hour}:${minute}`
}

export function formatViewerDateTime(input: string | Date): string {
  return formatDateTimeInZone(input, getViewerTimeZone())
}

export function formatVenueDateTime(input: string | Date): string {
  return formatDateTimeInZone(input, VENUE_TZ)
}

export function formatVenueClock(input: string | Date): string {
  return formatInTimeZone(parseMatchDate(input), VENUE_TZ, 'HH:mm')
}

export function formatMonthLabel(input: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    month: 'short',
    year: '2-digit',
    timeZone: VENUE_TZ,
  }).format(parseMatchDate(input))
}

export type CountdownParts = {
  totalMs: number
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

export function getCountdownParts(target: string | Date, now: Date = new Date()): CountdownParts {
  const totalMs = parseMatchDate(target).getTime() - now.getTime()
  const clamped = Math.max(0, totalMs)
  const days = Math.floor(clamped / 86_400_000)
  const hours = Math.floor((clamped % 86_400_000) / 3_600_000)
  const minutes = Math.floor((clamped % 3_600_000) / 60_000)
  const seconds = Math.floor((clamped % 60_000) / 1000)
  return { totalMs, days, hours, minutes, seconds, expired: totalMs <= 0 }
}
