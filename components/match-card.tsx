import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { CalendarDays, MapPin, Users } from 'lucide-react'

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

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-lg ${
      result === 'win' ? 'border-l-4 border-l-emerald-500' :
      result === 'loss' ? 'border-l-4 border-l-red-500' :
      result === 'draw' ? 'border-l-4 border-l-yellow-500' :
      'border-l-4 border-l-blue-500'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>{formatDateTime(match.date)}</span>
          </div>
          {isPast && result && (
            <Badge variant={result === 'win' ? 'success' : result === 'loss' ? 'destructive' : 'warning'}>
              {result === 'win' ? 'Victoria' : result === 'loss' ? 'Derrota' : 'Empate'}
            </Badge>
          )}
          {!isPast && <Badge variant="secondary">Próximo</Badge>}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-center">
            <p className="font-bold text-lg">{match.myTeam}</p>
            <Badge variant="outline" className="mt-1">#{match.myPos}°</Badge>
          </div>

          {isPast ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
              <span className="text-2xl font-bold">{match.scoreHome}</span>
              <span className="text-muted-foreground">-</span>
              <span className="text-2xl font-bold">{match.scoreAway}</span>
            </div>
          ) : (
            <div className="px-4 py-2 bg-muted rounded-lg">
              <span className="text-lg font-medium text-muted-foreground">VS</span>
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
          <div className="mt-4 pt-3 border-t border-border">
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
          <div className="mt-4 pt-3 border-t border-border">
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
