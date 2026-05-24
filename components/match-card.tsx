import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { CalendarDays, MapPin, Users } from 'lucide-react'
import Image from 'next/image'

interface Player {
  id: string
  name: string
  dorsal: number
  positions: string[]
}

interface MatchCardProps {
  match: {
    id: string
    myTeam: string
    rivalTeam: string
    myPos: number
    rivalPos: number
    date: Date
    location: string
    scoreHome: number
    scoreAway: number
    squad?: { player: Player }[]
    kit?: number
  }
  isPast: boolean
}

export function MatchCard({ match, isPast }: MatchCardProps) {
  const getResult = () => {
    if (!isPast) return null
    if (match.scoreHome > match.scoreAway) return 'win'
    if (match.scoreHome < match.scoreAway) return 'loss'
    return 'draw'
  }

  const result = getResult()

  const borderColor = result === 'win'
    ? 'border-l-emerald-500'
    : result === 'loss'
      ? 'border-l-red-500'
      : result === 'draw'
        ? 'border-l-yellow-500'
        : 'border-l-blue-500'

  return (
    <Card className={`overflow-hidden hover-lift border-l-4 ${borderColor} glass-card group`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>{formatDateTime(match.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            {match.kit && (match.kit === 1 || match.kit === 2) && (
              <div className="flex items-center gap-1.5 bg-muted/65 px-2 py-0.5 rounded-lg border border-border/40 text-xs text-muted-foreground font-medium select-none shadow-sm hover:bg-muted/80 transition-colors">
                <Image
                  src={match.kit === 1 ? 'https://vpl0mb2pgnbucvy2.public.blob.vercel-storage.com/1u.png' : 'https://vpl0mb2pgnbucvy2.public.blob.vercel-storage.com/2u.png'}
                  alt={`Uniforme ${match.kit}`}
                  width={16}
                  height={16}
                  className="object-contain"
                />
                <span className="text-[11px]">U{match.kit}</span>
              </div>
            )}
            {isPast && result && (
              <Badge variant={result === 'win' ? 'success' : result === 'loss' ? 'destructive' : 'warning'}>
                {result === 'win' ? 'Victoria' : result === 'loss' ? 'Derrota' : 'Empate'}
              </Badge>
            )}
            {!isPast && <Badge variant="secondary">Próximo</Badge>}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2">
              <p className="font-bold text-lg">{match.myTeam}</p>
              {match.kit && (match.kit === 1 || match.kit === 2) && (
                <div className="relative group/kit cursor-help flex items-center justify-center">
                  <Image
                    src={match.kit === 1 ? 'https://vpl0mb2pgnbucvy2.public.blob.vercel-storage.com/1u.png' : 'https://vpl0mb2pgnbucvy2.public.blob.vercel-storage.com/2u.png'}
                    alt={`Uniforme ${match.kit}`}
                    width={24}
                    height={24}
                    className="object-contain hover:scale-125 transition-transform duration-200 filter drop-shadow-md"
                  />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/kit:block bg-popover border border-border text-popover-foreground text-[10px] px-2 py-1 rounded shadow-md whitespace-nowrap z-20 font-medium">
                    Uniforme {match.kit === 1 ? 'Local' : 'Visitante'}
                  </div>
                </div>
              )}
            </div>
            <Badge variant="outline" className="mt-1">#{match.myPos}°</Badge>
          </div>

          {isPast ? (
            <div className="flex items-center gap-3 px-5 py-2.5 bg-muted/60 rounded-xl">
              <span className="text-2xl font-bold tabular-nums">{match.scoreHome}</span>
              <span className="text-muted-foreground font-light text-lg">–</span>
              <span className="text-2xl font-bold tabular-nums">{match.scoreAway}</span>
            </div>
          ) : (
            <div className="px-5 py-2.5 bg-muted/60 rounded-xl">
              <span className="text-lg font-semibold text-muted-foreground">VS</span>
            </div>
          )}

          <div className="flex-1 text-center">
            <p className="font-bold text-lg">{match.rivalTeam}</p>
            <Badge variant="outline" className="mt-1">#{match.rivalPos}°</Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{match.location}</span>
        </div>

        {/* Convocados / Squad */}
        {match.squad && match.squad.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {isPast ? 'Jugaron' : 'Convocados'} ({match.squad.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {match.squad.map((s) => (
                <Badge
                  key={s.player.id}
                  variant="secondary"
                  className="text-xs px-2 py-1"
                >
                  <span className="font-bold mr-1">#{s.player.dorsal}</span>
                  {s.player.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Mensaje si no hay convocados en partido futuro */}
        {!isPast && (!match.squad || match.squad.length === 0) && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm italic">Convocatoria pendiente</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
