import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClientDateTime } from '@/components/client-datetime'
import { MatchKit, resolveKit } from '@/components/match-kit'
import { MatchScoreboard } from '@/components/match-scoreboard'
import { MatchSquadList } from '@/components/match-squad'
import { CalendarDays, ChevronRight, MapPin } from 'lucide-react'
import type { Match } from '@/lib/types'
import { cn } from '@/lib/utils'

interface MatchCardProps {
  match: Match
  isPast: boolean
}

export function MatchCard({ match, isPast }: MatchCardProps) {
  const result = !isPast
    ? null
    : match.scoreHome > match.scoreAway
      ? 'win'
      : match.scoreHome < match.scoreAway
        ? 'loss'
        : 'draw'

  const borderColor =
    result === 'win'
      ? 'border-l-emerald-500'
      : result === 'loss'
        ? 'border-l-banner'
        : result === 'draw'
          ? 'border-l-gold'
          : 'border-l-sky-500'

  const kit = resolveKit(match.kit)

  return (
    <Link href={`/partido/${match.id}`} className="block group">
      <Card
        className={cn(
          'overflow-hidden hover-lift border-l-4 glass-card',
          borderColor
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
              <CalendarDays className="h-4 w-4 shrink-0 text-gold" />
              <ClientDateTime date={match.date} />
            </div>
            {isPast && result && (
              <Badge
                className="shrink-0"
                variant={result === 'win' ? 'success' : result === 'loss' ? 'destructive' : 'warning'}
              >
                {result === 'win' ? 'Victoria' : result === 'loss' ? 'Derrota' : 'Empate'}
              </Badge>
            )}
            {!isPast && (
              <Badge variant="secondary" className="shrink-0">
                Próximo
              </Badge>
            )}
          </div>

          <MatchScoreboard
            myTeam={match.myTeam}
            rivalTeam={match.rivalTeam}
            myPos={match.myPos}
            rivalPos={match.rivalPos}
            scoreHome={match.scoreHome}
            scoreAway={match.scoreAway}
            isPast={isPast}
            size="card"
          />

          <div className="flex flex-col gap-2 mt-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{match.location}</span>
            </span>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              {kit && <MatchKit kit={kit} />}
              <span className="inline-flex items-center gap-1.5 shrink-0 text-foreground/80">
                Ver detalle
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>

          <div className="mt-3 border-t border-border/40 pt-3">
            <MatchSquadList squad={match.squad} isPast={isPast} />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
