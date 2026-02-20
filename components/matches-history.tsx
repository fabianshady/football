'use client'

import { useState } from 'react'
import { MatchCard } from '@/components/match-card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Player {
  id: string
  name: string
  dorsal: number
  positions: string[]
}

interface Match {
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

interface MatchesHistoryProps {
  matches: Match[]
  initialCount?: number
}

export function MatchesHistory({ matches, initialCount = 5 }: MatchesHistoryProps) {
  const [showAll, setShowAll] = useState(false)

  const displayedMatches = showAll ? matches : matches.slice(0, initialCount)
  const hasMore = matches.length > initialCount

  return (
    <div className="space-y-4">
      {matches.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No hay partidos registrados
        </p>
      ) : (
        <>
          {displayedMatches.map((match) => (
            <MatchCard key={match.id} match={match} isPast={true} />
          ))}

          {hasMore && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Mostrar menos
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Ver historial completo ({matches.length - initialCount} más)
                </>
              )}
            </Button>
          )}
        </>
      )}
    </div>
  )
}
