import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DataUnavailable } from '@/components/page-heading'
import { PlayerName, PlayerPositions } from '@/components/player-identity'
import { dataConfigured, getPlayer, getPlayerStats, getSeasons, getTeams } from '@/lib/queries'
import { playerDisplayName, playersWithStats } from '@/lib/public'
import { pageMetadata } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const path = `/plantilla/${encodeURIComponent(id)}`
  if (!dataConfigured) return pageMetadata('Jugador', 'Ficha del jugador de ITJAGUARS FC.', path, '/opengraph-image', false)
  const player = await getPlayer(id)
  if (!player) notFound()
  return pageMetadata(playerDisplayName(player), `Ficha de ${playerDisplayName(player)} · Dorsal #${player.dorsal}. Posiciones, goles y convocatorias registrados en ITJAGUARS FC.`, path)
}

export default async function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!dataConfigured) return <DataUnavailable />
  const { id } = await params
  const player = await getPlayer(id)
  if (!player) notFound()
  const [stats, teams, seasons] = await Promise.all([getPlayerStats(), getTeams(), getSeasons()])
  const career = playersWithStats([player], stats)[0]
  const rows = stats.filter((row) => row.player_id === id).sort((a, b) =>
    (seasons.findIndex((season) => season.id === a.season_id) - seasons.findIndex((season) => season.id === b.season_id)) || a.team_id.localeCompare(b.team_id))
  return <main className="page-shell">
    <Link href="/plantilla" className="text-sm text-muted-foreground hover:underline">← Volver a plantilla</Link>
    <header className="my-8"><p className="eyebrow">Ficha del jugador · #{player.dorsal}</p><h1 className="text-4xl my-3"><PlayerName player={player} /></h1>
      {player.nickname?.trim() && <p className="text-muted-foreground mb-4">{player.name}</p>}
      <PlayerPositions player={player} />
      <p className="text-sm text-muted-foreground mt-4">{player.active === false ? 'Inactivo' : 'Activo'} · {teams.filter((team) => player.teamIds?.includes(team.id)).map((team) => team.name).join(' · ') || 'Sin equipo registrado'}</p>
    </header>
    <section className="surface mb-6" aria-labelledby="career-title"><h2 id="career-title" className="text-2xl mb-4">Carrera registrada</h2>
      <dl className="grid grid-cols-2 gap-4"><div><dt className="text-sm text-muted-foreground">Convocatorias</dt><dd className="text-3xl font-semibold">{career.callUps}</dd></div><div><dt className="text-sm text-muted-foreground">Goles</dt><dd className="text-3xl font-semibold">{career.goals}</dd></div></dl>
      <p className="text-xs text-muted-foreground mt-4">Todos los equipos y temporadas. Una convocatoria no confirma participación ni minutos jugados.</p>
    </section>
    <section className="surface" aria-labelledby="season-title"><h2 id="season-title" className="text-2xl mb-4">Por equipo y temporada</h2>
      {rows.length ? <div className="overflow-x-auto"><table className="w-full text-sm text-left"><caption className="sr-only">Convocatorias y goles por equipo y temporada</caption><thead><tr className="border-b">{['Equipo / liga', 'Temporada', 'Convocatorias', 'Goles'].map((label) => <th scope="col" className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{rows.map((row) => {
        const team = teams.find((item) => item.id === row.team_id)
        const season = seasons.find((item) => item.id === row.season_id)
        return <tr key={`${row.team_id}-${row.season_id}`} className="border-b"><th scope="row" className="p-3 font-medium">{team ? <Link className="hover:underline" href={`/${team.slug}/estadisticas?temporada=${encodeURIComponent(row.season_id)}`}>{team.name}</Link> : 'Equipo sin referencia'}<span className="block text-xs text-muted-foreground">{team?.league_name ?? 'Liga sin registrar'}</span></th><td className="p-3">{season?.name ?? 'Temporada sin referencia'}</td><td className="p-3 tabular-nums">{row.call_ups}</td><td className="p-3 tabular-nums">{row.goals}</td></tr>
      })}</tbody></table></div> : <p className="text-sm text-muted-foreground">Sin estadísticas registradas.</p>}
    </section>
  </main>
}
