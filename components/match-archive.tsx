'use client'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { MatchCard } from '@/components/match-card'
import { EmptyState } from '@/components/page-heading'
import type { Match } from '@/lib/types'

export function MatchArchive({ past, upcoming }: { past: Match[]; upcoming: Match[] }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('todos')
  const [visible, setVisible] = useState(12)
  const matches = [...upcoming.map((match) => ({ match, isPast: false })), ...past.map((match) => ({ match, isPast: true }))].filter(({ match, isPast }) => {
    const result = match.scoreHome > match.scoreAway ? 'victorias' : match.scoreHome < match.scoreAway ? 'derrotas' : 'empates'
    return match.rivalTeam.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es')) && (filter === 'todos' || (filter === 'proximos' ? !isPast : isPast && (filter === 'jugados' || filter === result)))
  })
  return <section aria-label="Archivo de partidos"><div className="surface flex flex-col sm:flex-row gap-4 mb-5"><label className="flex-1"><span className="text-xs text-muted-foreground flex gap-2 items-center mb-2"><Search size={14} aria-hidden="true" />Buscar rival</span><input className="field" type="search" value={search} placeholder="Nombre del rival" onChange={(event) => { setSearch(event.target.value); setVisible(12) }} /></label><label className="sm:w-56"><span className="text-xs text-muted-foreground block mb-2">Filtrar partidos</span><select className="field" value={filter} onChange={(event) => { setFilter(event.target.value); setVisible(12) }}>{[['todos', 'Todos los partidos'], ['proximos', 'Próximos'], ['jugados', 'Jugados'], ['victorias', 'Victorias'], ['empates', 'Empates'], ['derrotas', 'Derrotas']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><p className="text-sm text-muted-foreground mb-4" role="status">{matches.length} partidos encontrados</p>{matches.length ? <div className="grid gap-4 md:grid-cols-2">{matches.slice(0, visible).map(({ match, isPast }) => <MatchCard key={match.id} match={match} isPast={isPast} />)}</div> : <EmptyState>No hay partidos que coincidan con estos filtros.</EmptyState>}{matches.length > visible && <button type="button" className="action mt-6" onClick={() => setVisible(visible + 12)}>Ver más partidos ({matches.length - visible})</button>}</section>
}
