import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'
import type { MatchSquadEntry } from '@/lib/types'

export function MatchSquadList({
  squad,
  isPast,
}: {
  squad?: MatchSquadEntry[]
  isPast: boolean
}) {
  if (!squad || squad.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4 shrink-0 text-gold" />
        <span className="italic">{isPast ? 'Sin lista' : 'Convocatoria pendiente'}</span>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Users className="h-4 w-4 shrink-0 text-gold" />
        {isPast ? 'Jugaron' : 'Convocados'} ({squad.length})
      </div>
      <div className="flex flex-wrap gap-1.5">
        {squad.map((entry) => (
          <Badge key={entry.player.id} variant="secondary" className="px-2 py-1 text-xs">
            <span className="mr-1 font-bold">#{entry.player.dorsal}</span>
            {entry.player.name}
          </Badge>
        ))}
      </div>
    </div>
  )
}
