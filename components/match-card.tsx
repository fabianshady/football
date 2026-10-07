import Link from 'next/link'
import { ArrowUpRight, MapPin } from 'lucide-react'
import { ClientDateTime } from '@/components/client-datetime'
import { MatchKit } from '@/components/match-kit'
import { MatchScoreboard } from '@/components/match-scoreboard'
import type { Match } from '@/lib/types'

export function MatchCard({ match, isPast = false }: { match: Match; isPast?: boolean }) {
  const result = match.scoreHome > match.scoreAway ? 'Victoria' : match.scoreHome < match.scoreAway ? 'Derrota' : 'Empate'
  return <article className="surface relative flex flex-col gap-5 border border-transparent hover:border-border transition-colors">
    <div className="flex items-center justify-between gap-2"><p className="eyebrow">{isPast ? result : 'Próximo partido'}</p><ArrowUpRight size={20} className="text-muted-foreground" aria-hidden="true" /></div>
    <Link href={`/partido/${match.id}`} className="after:absolute after:inset-0 after:rounded-[32px]" aria-label={`Ver partido: ${match.myTeam} contra ${match.rivalTeam}`}><MatchScoreboard {...match} isPast={isPast} /></Link>
    <div className="text-xs text-muted-foreground space-y-2"><ClientDateTime date={match.date} /><p className="flex items-center gap-2"><MapPin size={14} aria-hidden="true" />{match.location || 'Sede por confirmar'}</p></div>
    {!isPast && <MatchKit kit={match.kit} />}
    {match.scheduleOverride && <p className="text-xs text-gold">Horario especial confirmado</p>}
  </article>
}
