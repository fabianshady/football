import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface MatchScoreboardProps {
  myTeam: string
  rivalTeam: string
  myPos: number
  rivalPos: number
  scoreHome: number
  scoreAway: number
  isPast: boolean
  size?: 'card' | 'hero'
  rivalExtra?: ReactNode
}

function TeamCell({
  name,
  pos,
  extra,
  align,
  size,
}: {
  name: string
  pos: number
  extra?: ReactNode
  align: 'start' | 'end'
  size: 'card' | 'hero'
}) {
  return (
    <div
      className={cn(
        'min-w-0 flex flex-col',
        align === 'end' ? 'items-end text-right' : 'items-start text-left'
      )}
    >
      {size === 'hero' && (
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {align === 'end' ? 'Local' : 'Rival'}
        </p>
      )}
      <p
        className={cn(
          'font-display leading-tight break-words',
          size === 'hero' ? 'text-xl sm:text-3xl lg:text-4xl mt-0.5' : 'text-base sm:text-lg'
        )}
      >
        {name}
      </p>
      <div
        className={cn(
          'mt-1 flex flex-wrap gap-1',
          align === 'end' ? 'justify-end' : 'justify-start'
        )}
      >
        <Badge variant="outline" className="text-[10px] sm:text-xs">
          #{pos}°
        </Badge>
        {extra}
      </div>
    </div>
  )
}

function ScoreCell({
  isPast,
  scoreHome,
  scoreAway,
  size,
}: {
  isPast: boolean
  scoreHome: number
  scoreAway: number
  size: 'card' | 'hero'
}) {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center rounded-xl bg-navy text-primary-foreground dark:bg-black/40',
        size === 'hero' ? 'min-h-[3.25rem] sm:min-h-[3.75rem]' : 'min-h-[2.75rem]'
      )}
    >
      {isPast ? (
        <p
          className={cn(
            'font-display tabular-nums leading-none',
            size === 'hero' ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-2xl'
          )}
        >
          <span className="inline-block w-[2ch] text-right">{scoreHome}</span>
          <span className="mx-0.5 opacity-50">–</span>
          <span className="inline-block w-[2ch] text-left">{scoreAway}</span>
        </p>
      ) : (
        <p className={cn('font-display leading-none', size === 'hero' ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl')}>
          VS
        </p>
      )}
    </div>
  )
}

export function MatchScoreboard({
  myTeam,
  rivalTeam,
  myPos,
  rivalPos,
  scoreHome,
  scoreAway,
  isPast,
  size = 'card',
  rivalExtra,
}: MatchScoreboardProps) {
  return (
    <div
      className={cn(
        'grid items-center',
        size === 'hero'
          ? 'grid-cols-[minmax(0,1fr)_4.75rem_minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_6.5rem_minmax(0,1fr)] gap-2 sm:gap-4'
          : 'grid-cols-[minmax(0,1fr)_4.25rem_minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_5.5rem_minmax(0,1fr)] gap-2 sm:gap-3'
      )}
    >
      <TeamCell name={myTeam} pos={myPos} align="end" size={size} />
      <ScoreCell isPast={isPast} scoreHome={scoreHome} scoreAway={scoreAway} size={size} />
      <TeamCell name={rivalTeam} pos={rivalPos} extra={rivalExtra} align="start" size={size} />
    </div>
  )
}
