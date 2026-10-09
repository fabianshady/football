import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getTeamContext, type TeamPageProps } from '@/lib/team-page'
import { dataConfigured, getMatches, getSeasonStats } from '@/lib/queries'
import { splitMatches, weekdayLabel } from '@/lib/public'
import { DataUnavailable, EmptyState, PageHeading } from '@/components/page-heading'
import { TeamNavigation } from '@/components/team-navigation'
import { SeasonSelect } from '@/components/season-select'
import { Metrics } from '@/components/metrics'
import { MatchCard } from '@/components/match-card'
import { teamMetadata } from '@/lib/team-metadata'
import { sportsTeamJsonLd } from '@/lib/seo'
import { JsonLd } from '@/components/json-ld'

export const dynamic = 'force-dynamic'
export async function generateMetadata(props: TeamPageProps) { return teamMetadata(props, 'resumen') }
export default async function TeamPage(props: TeamPageProps) {
  if (!dataConfigured) return <DataUnavailable />
  const { team, seasons, season } = await getTeamContext(props)
  const [matches, stats] = season ? await Promise.all([getMatches(team.id, season.id), getSeasonStats(team.id, season.id)]) : [[], null]
  const { upcoming, past } = splitMatches(matches)
  const query = season ? `?temporada=${encodeURIComponent(season.id)}` : ''
  return <main className="page-shell">
    <JsonLd value={sportsTeamJsonLd(team)} />
    <div className="flex flex-wrap items-start justify-between gap-6"><PageHeading eyebrow={team.league_name ?? 'ITJAGUARS FC'} title={team.name} description={`Nuestra jornada se juega los ${weekdayLabel(team.match_weekday)}. Sigue el camino del equipo, partido a partido.`} /><SeasonSelect seasons={seasons} selected={season?.id} /></div>
    <TeamNavigation team={team} season={season} active="resumen" />
    {!season ? <EmptyState>Aún no hay temporadas registradas.</EmptyState> : <><Metrics stats={stats} /><div className="section-heading"><h2>La próxima jornada</h2><span className="text-xs text-muted-foreground">{season.name}</span></div>{upcoming.length ? <div className="grid gap-4 md:grid-cols-2">{upcoming.slice(0, 2).map((match) => <MatchCard key={match.id} match={match} />)}</div> : <EmptyState>No hay partidos programados para esta temporada.</EmptyState>}<div className="section-heading"><h2>Últimos resultados</h2><Link className="text-sm font-semibold flex items-center gap-2" href={`/${team.slug}/partidos${query}`}>Ver todos <ArrowRight size={17} /></Link></div>{past.length ? <div className="grid gap-4 md:grid-cols-2">{past.slice(0, 4).map((match) => <MatchCard key={match.id} match={match} isPast />)}</div> : <EmptyState>Los resultados aparecerán después de la primera jornada.</EmptyState>}<Link className="action mt-8" href={`/${team.slug}/estadisticas${query}`}>El equipo en números <ArrowRight size={18} /></Link></>}
  </main>
}
