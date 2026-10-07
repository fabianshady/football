import { dataConfigured, getPlayers, getPlayerStats } from '@/lib/queries'
import { playersWithStats } from '@/lib/public'
import { DataUnavailable, PageHeading } from '@/components/page-heading'
import { PlayerRoster } from '@/components/player-roster'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Plantilla' }
export default async function RosterPage() {
  if (!dataConfigured) return <DataUnavailable />
  const [players, stats] = await Promise.all([getPlayers(), getPlayerStats()])
  return <main className="page-shell"><PageHeading eyebrow="Nuestra gente" title="Un equipo empieza aquí." description="La plantilla activa del club. Convocatorias y goles acumulados de todos los equipos y temporadas." /><PlayerRoster players={playersWithStats(players, stats)} /></main>
}
