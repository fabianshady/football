'use client'

import { useSyncExternalStore } from 'react'
import {
  formatDateTimeInZone,
  getViewerTimeZone,
  isSameZone,
  parseMatchDate,
  VENUE_TZ,
} from '@/lib/datetime'
import { cn } from '@/lib/utils'

interface ClientDateTimeProps {
  date: string | Date
  className?: string
  showVenueHint?: boolean
}

const subscribe = () => () => {}

export function ClientDateTime({ date, className, showVenueHint = true }: ClientDateTimeProps) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)
  const zone = mounted ? getViewerTimeZone() : VENUE_TZ
  const label = formatDateTimeInZone(date, VENUE_TZ)
  const hint =
    mounted && showVenueHint && !isSameZone(zone, VENUE_TZ)
      ? `${formatDateTimeInZone(date, zone)} · ${zone}`
      : null

  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-2', className)}>
      <time dateTime={parseMatchDate(date).toISOString()}>{label} · Tijuana</time>
      {hint && <span className="text-xs text-muted-foreground">· {hint}</span>}
    </span>
  )
}
