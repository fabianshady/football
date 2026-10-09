'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { formatVenueDateTime } from '@/lib/datetime'
import { headToHeadSummary, matchOutcome } from '@/lib/public'
import type { Match, Season, Team } from '@/lib/types'

const OUTCOMES = { V: 'Victoria', E: 'Empate', D: 'Derrota' }
export function HeadToHead({ sameTeam, club, teams, seasons, currentTeamId }: {
  sameTeam: Match[]; club: Match[]; teams: Team[]; seasons: Season[]; currentTeamId?: string
}) {
  const [scope, setScope] = useState<'team' | 'club'>('team')
  const matches = scope === 'team' ? sameTeam : club
  const summary = headToHeadSummary(matches)
  const currentTeam = teams.find((team) => team.id === currentTeamId)
  return <section className="surface mb-8" aria-labelledby="h2h-title">
    <h2 id="h2h-title" className="text-2xl mb-3">Historial frente a este rival</h2>
    <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Ámbito del historial">
      <button type="button" aria-pressed={scope === 'team'} onClick={() => setScope('team')} className={`rounded-xl px-4 py-2 text-sm ${scope === 'team' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>Mismo equipo · {currentTeam?.name ?? 'Equipo'}{currentTeam?.league_name ? ` · ${currentTeam.league_name}` : ''}</button>
      <button type="button" aria-pressed={scope === 'club'} onClick={() => setScope('club')} className={`rounded-xl px-4 py-2 text-sm ${scope === 'club' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>Todo el club · distintas ligas</button>
    </div>
    <p className="text-xs text-muted-foreground mb-4">Todas las temporadas, antes de este encuentro y de la fecha actual. Fuente: marcadores registrados; se consideran finales por fecha pasada, sin estado de finalización. Un 0–0 pasado puede ser un partido sin jugar. Fechas en Tijuana.</p>
    {matches.length ? <>
      <dl className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">{[
        ['Encuentros', summary.played], ['Victorias', summary.wins], ['Empates', summary.draws], ['Derrotas', summary.losses], ['Goles a favor', summary.goalsFor], ['Goles en contra', summary.goalsAgainst],
      ].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="text-2xl font-semibold tabular-nums">{value}</dd></div>)}</dl>
      <h3 className="font-semibold mb-2">Últimos cinco · V / E / D</h3>
      <div className="flex flex-wrap gap-2 mb-5">{matches.slice(0, 5).map((match) => <Link key={match.id} href={`/partido/${encodeURIComponent(match.id)}`} className="rounded-xl bg-secondary px-3 py-2 text-sm hover:underline" aria-label={`${OUTCOMES[matchOutcome(match)]}, ${match.scoreHome} a ${match.scoreAway}, ${formatVenueDateTime(match.date)}, Tijuana`}>{matchOutcome(match)} · {match.scoreHome}–{match.scoreAway}<span className="block text-xs text-muted-foreground">{formatVenueDateTime(match.date)} · TJ</span></Link>)}</div>
      <details><summary className="cursor-pointer font-semibold text-sm">Ver todos los encuentros ({matches.length})</summary><ul className="mt-3 space-y-3">{matches.map((match) => {
        const team = teams.find((item) => item.id === match.teamId)
        return <li key={match.id} className="border-t pt-3"><Link href={`/partido/${encodeURIComponent(match.id)}`} className="flex flex-wrap justify-between gap-2 text-sm hover:underline"><span>{formatVenueDateTime(match.date)} · TJ<span className="block text-xs text-muted-foreground">{team?.name ?? match.myTeam} · {team?.league_name ?? 'Liga sin registrar'} · {seasons.find((season) => season.id === match.seasonid)?.name ?? 'Temporada sin referencia'}</span></span><span>{OUTCOMES[matchOutcome(match)]} · {match.scoreHome}–{match.scoreAway}</span></Link></li>
      })}</ul></details>
    </> : <div className="text-center"><Image src="/brand/empty-head-to-head.webp" alt="" width={160} height={160} className="mx-auto mb-3" /><p role="status" className="text-sm text-muted-foreground">Primer encuentro registrado frente a este rival en este ámbito: no hay partidos anteriores.</p></div>}
  </section>
}
