'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CalendarDays, ChevronRight, MapPin, Shield, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClientDateTime } from '@/components/client-datetime'
import { MatchScoreboard } from '@/components/match-scoreboard'
import { getCountdownParts, parseMatchDate } from '@/lib/datetime'
import type { Match } from '@/lib/types'

interface MatchdayHeroProps {
  nextMatch: Match | null
  lastMatch: Match | null
  clubName: string
  seasonName?: string | null
}

function Countdown({ date }: { date: string }) {
  const [parts, setParts] = useState(() => getCountdownParts(date))

  useEffect(() => {
    const tick = () => setParts(getCountdownParts(date))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [date])

  if (parts.expired) {
    return <p className="text-sm text-muted-foreground">El partido ya está en curso o por comenzar</p>
  }

  const cells = [
    { label: 'Días', value: parts.days },
    { label: 'Hrs', value: parts.hours },
    { label: 'Min', value: parts.minutes },
    { label: 'Seg', value: parts.seconds },
  ]

  return (
    <div className="flex w-full max-w-sm gap-1.5 sm:gap-2">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="flex-1 min-w-0 max-w-[4.5rem] rounded-xl bg-navy/90 text-center px-1.5 py-2 text-primary-foreground dark:bg-black/30 dark:text-foreground"
        >
          <p className="font-display text-xl sm:text-2xl leading-none tabular-nums">
            {String(cell.value).padStart(2, '0')}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-primary-foreground/70 dark:text-muted-foreground">
            {cell.label}
          </p>
        </div>
      ))}
    </div>
  )
}

export function MatchdayHero({ nextMatch, lastMatch, clubName, seasonName }: MatchdayHeroProps) {
  const featured = nextMatch ?? lastMatch
  const isUpcoming = Boolean(nextMatch)

  if (!featured) {
    return (
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <p className="font-display text-3xl tracking-wide">{clubName}</p>
          <p className="text-muted-foreground mt-1">
            {seasonName ? `${seasonName} · ` : ''}Aún no hay partidos cargados en esta temporada.
          </p>
        </CardContent>
      </Card>
    )
  }

  const squadCount = featured.squad?.length ?? 0

  return (
    <Card className="glass-card overflow-hidden relative">
      <div className="absolute inset-y-0 right-0 w-1/2 pointer-events-none opacity-40 hidden md:block pitch-board" />
      <CardContent className="relative p-4 sm:p-7">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge className="bg-banner text-white border-transparent">
            {isUpcoming ? 'Próxima jornada' : 'Último partido'}
          </Badge>
          {seasonName && (
            <Badge variant="outline" className="border-gold/40 text-foreground">
              {seasonName}
            </Badge>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] items-start">
          <div className="min-w-0">
            <MatchScoreboard
              myTeam={featured.myTeam}
              rivalTeam={featured.rivalTeam}
              myPos={featured.myPos}
              rivalPos={featured.rivalPos}
              scoreHome={featured.scoreHome}
              scoreAway={featured.scoreAway}
              isPast={!isUpcoming}
              size="hero"
            />

            <div className="mt-4 flex flex-col gap-1.5 text-sm text-muted-foreground sm:mt-5 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <CalendarDays className="h-4 w-4 shrink-0 text-gold" />
                <ClientDateTime date={featured.date} />
              </span>
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <MapPin className="h-4 w-4 shrink-0 text-gold" />
                <span className="break-words">{featured.location}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 shrink-0 text-gold" />
                {squadCount > 0
                  ? `${squadCount} convocado${squadCount === 1 ? '' : 's'}`
                  : isUpcoming
                    ? 'Convocatoria pendiente'
                    : 'Sin convocatoria'}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-stretch sm:items-start lg:items-end gap-3">
            {isUpcoming && <Countdown date={featured.date} />}
            <Link
              href={`/partido/${featured.id}`}
              className="inline-flex items-center justify-center sm:justify-start gap-1.5 text-sm font-semibold text-foreground hover:text-gold transition-colors"
            >
              Ver detalle y formaciones
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function isMatchUpcoming(match: Match, now = new Date()): boolean {
  return parseMatchDate(match.date).getTime() >= now.getTime()
}

export function MatchdayMeta({
  clubName,
  icon: Icon = Shield,
}: {
  clubName: string
  icon?: typeof Shield
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="h-4 w-4 text-gold" />
      {clubName}
    </div>
  )
}
