import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClientDateTime } from '@/components/client-datetime'
import { MatchScoreboard } from '@/components/match-scoreboard'
import { CalendarDays, ChevronRight, MapPin, Users } from 'lucide-react'
import type { Match } from '@/lib/types'
import { cn } from '@/lib/utils'

interface MatchCardProps {
  match: Match
  isPast: boolean
}

function kitLabel(kit: number): string {
  return kit === 1 ? 'Local (Azul)' : 'Visitante (Guinda)'
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

  const squadCount = match.squad?.length ?? 0
  const kit = match.kit === 1 || match.kit === 2 ? match.kit : null

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
              {kit && (
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <Image
                    src={
                      kit === 1
                        ? 'https://vpl0mb2pgnbucvy2.public.blob.vercel-storage.com/1u.png'
                        : 'https://vpl0mb2pgnbucvy2.public.blob.vercel-storage.com/2u.png'
                    }
                    alt={`Uniforme ${kit === 1 ? 'Local' : 'Visitante'}`}
                    width={18}
                    height={18}
                    className="object-contain drop-shadow-sm"
                  />
                  <span className="truncate">
                    Uniforme: <span className="font-semibold text-foreground">{kitLabel(kit)}</span>
                  </span>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 shrink-0">
                <Users className="h-4 w-4" />
                {squadCount > 0
                  ? `${squadCount} ${isPast ? 'jugaron' : 'convocados'}`
                  : isPast
                    ? 'Sin lista'
                    : 'Pendiente'}
                <ChevronRight className="h-4 w-4 opacity-0 -ml-1 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
