import { getTeamContext, type TeamPageProps } from '@/lib/team-page'
import { dataConfigured, getMatches } from '@/lib/queries'
import { splitMatches } from '@/lib/public'
import { DataUnavailable, PageHeading } from '@/components/page-heading'
import { TeamNavigation } from '@/components/team-navigation'
import { SeasonSelect } from '@/components/season-select'
import { MatchArchive } from '@/components/match-archive'
import { teamMetadata } from '@/lib/team-metadata'

export const dynamic = 'force-dynamic'
export async function generateMetadata(props: TeamPageProps) { return teamMetadata(props, 'partidos') }
export default async function MatchesPage(props: TeamPageProps) {
  if (!dataConfigured) return <DataUnavailable />
  const { team, seasons, season } = await getTeamContext(props)
  const matches = season ? await getMatches(team.id, season.id) : []
  return <main className="page-shell"><div className="flex flex-wrap justify-between gap-6"><PageHeading eyebrow={team.name} title="Cada partido cuenta." description="El calendario completo, los rivales y los resultados. Toda la temporada en un solo lugar." /><SeasonSelect seasons={seasons} selected={season?.id} /></div><TeamNavigation team={team} season={season} active="partidos" /><MatchArchive {...splitMatches(matches)} /></main>
}
