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

function TeamBlock({
  name,
  pos,
  align,
  size,
}: {
  name: string
  pos: number
  align: 'left' | 'center' | 'right'
  size: 'card' | 'hero'
}) {
  return (
    <div
      className={cn(
        'min-w-0',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left'
      )}
    >
      <p
        className={cn(
          'font-display leading-tight break-words',
          size === 'hero' ? 'text-xl sm:text-3xl lg:text-4xl' : 'text-lg sm:text-xl'
        )}
      >
        {name}
      </p>
      <Badge variant="outline" className="mt-1.5">
        #{pos}°
      </Badge>
    </div>
  )
}

function ScoreBlock({
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
        'shrink-0 rounded-xl text-center bg-navy text-primary-foreground dark:bg-black/40',
        size === 'hero' ? 'px-4 py-2.5 sm:px-5 sm:py-3' : 'px-3 py-1.5 sm:px-4 sm:py-2'
      )}
    >
      {isPast ? (
        <p
          className={cn(
            'font-display tabular-nums leading-none',
            size === 'hero' ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'
          )}
        >
          {scoreHome}
          <span className="mx-1 opacity-50">–</span>
          {scoreAway}
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
  if (size === 'card') {
    return (
      <>
        <div className="space-y-2 sm:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-lg leading-tight break-words">{myTeam}</p>
              <span className="text-[11px] text-muted-foreground">#{myPos}°</span>
            </div>
            {isPast ? (
              <span className="font-display text-2xl tabular-nums shrink-0">{scoreHome}</span>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-lg leading-tight break-words">{rivalTeam}</p>
              <span className="text-[11px] text-muted-foreground">#{rivalPos}°</span>
            </div>
            {isPast ? (
              <span className="font-display text-2xl tabular-nums shrink-0">{scoreAway}</span>
            ) : (
              <span className="font-display text-lg shrink-0 text-muted-foreground">VS</span>
            )}
          </div>
        </div>

        <div className="hidden sm:flex items-center justify-between gap-3">
          <TeamBlock name={myTeam} pos={myPos} align="center" size="card" />
          <ScoreBlock isPast={isPast} scoreHome={scoreHome} scoreAway={scoreAway} size="card" />
          <TeamBlock name={rivalTeam} pos={rivalPos} align="center" size="card" />
        </div>
      </>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-4">
      <div className="text-center sm:text-left min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Local</p>
        <p className="font-display text-2xl sm:text-3xl lg:text-4xl leading-tight break-words mt-0.5">
          {myTeam}
        </p>
        <Badge variant="outline" className="mt-1.5">
          #{myPos}°
        </Badge>
      </div>

      <div className="justify-self-center">
        <ScoreBlock isPast={isPast} scoreHome={scoreHome} scoreAway={scoreAway} size="hero" />
      </div>

      <div className="text-center sm:text-right min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Rival</p>
        <p className="font-display text-2xl sm:text-3xl lg:text-4xl leading-tight break-words mt-0.5">
          {rivalTeam}
        </p>
        <div className={cn('mt-1.5 flex flex-wrap gap-1.5', 'justify-center sm:justify-end')}>
          <Badge variant="outline">#{rivalPos}°</Badge>
          {rivalExtra}
        </div>
      </div>
    </div>
  )
}
