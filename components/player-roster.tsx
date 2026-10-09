'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Player, PlayerPosition, Team } from '@/lib/types'
import { playerDisplayName, playerLine, playerPositions, playersInTeam, POSITION_LABELS } from '@/lib/public'
import { EmptyState } from '@/components/page-heading'
import { PlayerName, PlayerPositions } from '@/components/player-identity'

const LINES = ['Porteros', 'Defensas', 'Carrileros', 'Mediocampistas', 'Delanteros', 'Sin posición definida']
export function PlayerRoster({ players, teams = [] }: { players: Player[]; teams?: Team[] }) {
  const [search, setSearch] = useState('')
  const [position, setPosition] = useState('')
  const [teamId, setTeamId] = useState('')
  const [sort, setSort] = useState('dorsal')
  const visible = playersInTeam(players, teamId).filter((player) =>
    `${player.name} ${player.nickname ?? ''} ${player.dorsal}`.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es')) &&
    (!position || playerPositions(player).includes(position as PlayerPosition)))
    .sort((a, b) => (sort === 'name' ? playerDisplayName(a).localeCompare(playerDisplayName(b), 'es') : sort === 'goals' ? (b.goals ?? 0) - (a.goals ?? 0) : a.dorsal - b.dorsal) || a.id.localeCompare(b.id))
  return <>
    <div className="surface grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      <label className="text-xs text-muted-foreground">Buscar jugador<input type="search" className="field mt-2" placeholder="Nombre, apodo o dorsal" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <label className="text-xs text-muted-foreground">Posición<select className="field mt-2" value={position} onChange={(event) => setPosition(event.target.value)}><option value="">Todas las posiciones</option>{Object.entries(POSITION_LABELS).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
      <label className="text-xs text-muted-foreground">Equipo<select className="field mt-2" value={teamId} onChange={(event) => setTeamId(event.target.value)}><option value="">Todo el club</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
      <label className="text-xs text-muted-foreground">Ordenar por<select className="field mt-2" value={sort} onChange={(event) => setSort(event.target.value)}><option value="dorsal">Dorsal</option><option value="name">Nombre</option><option value="goals">Goles</option></select></label>
    </div>
    <p className="text-sm text-muted-foreground mb-4" role="status">{visible.length} jugadores activos</p>
    {teams.length > 0 && <p className="text-xs text-muted-foreground mb-6">Los equipos corresponden a membresías registradas. La carga inicial se basó en convocatorias históricas y requiere revisión del club.</p>}
    {visible.length ? LINES.map((line) => {
      const group = visible.filter((player) => playerLine(player) === line)
      return group.length ? <section key={line} className="mb-8" aria-label={line}>
        <h2 className="text-2xl mb-4">{line}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{group.map((player) => <article key={player.id} className="surface">
          <div className="flex items-start justify-between gap-4"><span className="flex items-center justify-center w-16 h-16 rounded-[22px] bg-secondary font-bold text-2xl text-primary">{player.dorsal}</span><span className="eyebrow !text-[10px] pt-2">ITJAGUARS FC</span></div>
          <h3 className="text-xl mt-5 mb-3"><Link className="hover:underline" href={`/plantilla/${encodeURIComponent(player.id)}`}><PlayerName player={player} /></Link></h3>
          <PlayerPositions player={player} />
          <p className="text-xs text-muted-foreground mt-3">{teams.filter((team) => player.teamIds?.includes(team.id)).map((team) => team.name).join(' · ') || 'Sin equipo registrado'}</p>
          <dl className="grid grid-cols-2 gap-3 pt-4 border-t mt-4"><div><dt className="text-xs text-muted-foreground">Convocatorias · carrera</dt><dd className="text-2xl font-semibold mt-1">{player.callUps ?? 0}</dd></div><div><dt className="text-xs text-muted-foreground">Goles · carrera</dt><dd className="text-2xl font-semibold mt-1">{player.goals ?? 0}</dd></div></dl>
        </article>)}</div>
      </section> : null
    }) : <EmptyState>No encontramos jugadores con estos filtros.</EmptyState>}
  </>
}
