'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CalendarDays, ChevronRight, MapPin, Shield, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClientDateTime } from '@/components/client-datetime'
import { MatchKit } from '@/components/match-kit'
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
    return (
      <p className="text-center text-sm text-muted-foreground">
        El partido ya está en curso o por comenzar
      </p>
    )
  }

  const cells = [
    { label: 'Días', value: parts.days },
    { label: 'Hrs', value: parts.hours },
    { label: 'Min', value: parts.minutes },
    { label: 'Seg', value: parts.seconds },
  ]

  return (
    <div className="mx-auto grid w-full max-w-[17rem] grid-cols-4 gap-1.5 sm:max-w-[20rem] sm:gap-2">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="rounded-xl bg-navy/90 px-1 py-2 text-center text-primary-foreground dark:bg-black/30 dark:text-foreground"
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

        <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:mt-5 sm:grid-cols-2">
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <CalendarDays className="h-4 w-4 shrink-0 text-gold" />
            <ClientDateTime date={featured.date} />
          </span>
          <span className="inline-flex items-center gap-1.5 min-w-0 sm:justify-end">
            <MapPin className="h-4 w-4 shrink-0 text-gold" />
            <span className="truncate">{featured.location}</span>
          </span>
          <MatchKit kit={featured.kit} />
          <span className="inline-flex items-center gap-1.5 min-w-0 sm:justify-end">
            <Users className="h-4 w-4 shrink-0 text-gold" />
            {squadCount > 0
              ? `${squadCount} convocado${squadCount === 1 ? '' : 's'}`
              : isUpcoming
                ? 'Convocatoria pendiente'
                : 'Sin convocatoria'}
          </span>
        </div>

        <div className="mt-4 flex flex-col items-center gap-3 sm:mt-5">
          {isUpcoming && <Countdown date={featured.date} />}
          <Link
            href={`/partido/${featured.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-gold transition-colors"
          >
            Ver detalle y formaciones
            <ChevronRight className="h-4 w-4" />
          </Link>
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
