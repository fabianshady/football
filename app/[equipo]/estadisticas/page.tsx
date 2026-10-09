import { getTeamContext, type TeamPageProps } from '@/lib/team-page'
import { dataConfigured, getMonthlyGoals, getPlayers, getPlayerStats, getSeasonStats } from '@/lib/queries'
import { playersWithStats } from '@/lib/public'
import { DataUnavailable, EmptyState, PageHeading } from '@/components/page-heading'
import { TeamNavigation } from '@/components/team-navigation'
import { SeasonSelect } from '@/components/season-select'
import { Metrics } from '@/components/metrics'
import { ResultsChart } from '@/components/charts/results-chart'
import { GoalsChart } from '@/components/charts/goals-chart'
import { MonthlyGoalsChart } from '@/components/charts/monthly-goals-chart'
import { teamMetadata } from '@/lib/team-metadata'

export const dynamic = 'force-dynamic'
export async function generateMetadata(props: TeamPageProps) { return teamMetadata(props, 'estadisticas') }

export default async function StatsPage(props: TeamPageProps) {
  if (!dataConfigured) return <DataUnavailable />
  const { team, season, seasons } = await getTeamContext(props)
  const [stats, monthly, players, rows] = await Promise.all([
    season ? getSeasonStats(team.id, season.id) : null,
    season ? getMonthlyGoals(team.id, season.id) : [],
    getPlayers(false),
    getPlayerStats(),
  ])
  const scoped = season ? playersWithStats(players, rows, team.id, season.id) : []
  const scorers = scoped.filter((player) => (player.goals ?? 0) > 0)
    .sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0)).slice(0, 10)
  const called = scoped.filter((player) => (player.callUps ?? 0) > 0)
    .sort((a, b) => (b.callUps ?? 0) - (a.callUps ?? 0)).slice(0, 10)

  return (
    <main className="page-shell">
      <div className="flex flex-wrap justify-between gap-6">
        <PageHeading eyebrow={team.name} title="El juego, en números." description="Resultados, goles y protagonistas. Una mirada clara al rendimiento del equipo esta temporada." />
        <SeasonSelect seasons={seasons} selected={season?.id} />
      </div>
      <TeamNavigation team={team} season={season} active="estadisticas" />
      <Metrics stats={stats} />
      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <section className="surface">
          <h2 className="text-xl mb-5">Balance de resultados</h2>
          <ResultsChart wins={stats?.wins ?? 0} draws={stats?.draws ?? 0} losses={stats?.losses ?? 0} />
        </section>
        <section className="surface">
          <h2 className="text-xl mb-5">Balance de goles</h2>
          <GoalsChart goalsFor={stats?.goals_for ?? 0} goalsAgainst={stats?.goals_against ?? 0} />
        </section>
      </div>
      <section className="surface mt-4">
        <h2 className="text-xl mb-6">El ritmo de la temporada</h2>
        <MonthlyGoalsChart data={monthly} />
      </section>
      <div className="grid gap-4 md:grid-cols-2 mt-4">
        {[
          { title: 'Goleadores', players: scorers, key: 'goals' as const, label: 'goles' },
          { title: 'Más convocados', players: called, key: 'callUps' as const, label: 'convocatorias' },
        ].map((list) => (
          <section key={list.title} className="surface">
            <h2 className="text-xl mb-5">{list.title}</h2>
            {list.players.length ? (
              <ol className="space-y-3">
                {list.players.map((player, index) => (
                  <li key={player.id} className="flex items-center gap-3 bg-muted rounded-2xl p-3">
                    <span className="text-xs text-muted-foreground w-5">{index + 1}</span>
                    <span className="text-gold font-bold text-sm">#{player.dorsal}</span>
                    <span className="flex-1 text-sm font-medium">{player.name}</span>
                    <span className="text-right font-semibold">
                      {player[list.key]}
                      <span className="block text-[10px] font-normal text-muted-foreground">{list.label}</span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : <EmptyState>Aún no hay registros en esta temporada.</EmptyState>}
          </section>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-6">
        Clasificaciones individuales de la temporada, incluidos jugadores inactivos · {season?.name ?? 'Sin temporada'}
      </p>
    </main>
  )
}
