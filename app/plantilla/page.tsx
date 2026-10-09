import { dataConfigured, getPlayers, getPlayerStats, getTeams } from '@/lib/queries'
import { playersWithStats } from '@/lib/public'
import { DataUnavailable, PageHeading } from '@/components/page-heading'
import { PlayerRoster } from '@/components/player-roster'
import { pageMetadata } from '@/lib/seo'
export const dynamic = 'force-dynamic'
export const metadata = pageMetadata('Plantilla', 'Conoce la plantilla activa de ITJAGUARS FC: posiciones, dorsales, goles y convocatorias registrados.', '/plantilla')
export default async function RosterPage() {
  if (!dataConfigured) return <DataUnavailable />
  const [players, stats, teams] = await Promise.all([getPlayers(), getPlayerStats(), getTeams()])
  return <main className="page-shell"><PageHeading eyebrow="Nuestra gente" title="Un equipo empieza aquí." description="La plantilla activa del club. Convocatorias y goles acumulados de todos los equipos y temporadas." /><PlayerRoster players={playersWithStats(players, stats)} teams={teams} /></main>
}
