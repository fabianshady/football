import type { SeasonStats } from '@/lib/types'
export function Metrics({ stats }: { stats: SeasonStats | null }) {
  const entries = [{ label: 'Partidos jugados', value: stats?.played ?? 0 }, { label: 'Victorias', value: stats?.wins ?? 0 }, { label: 'Goles a favor', value: stats?.goals_for ?? 0 }, { label: 'Diferencia de goles', value: (stats?.goals_for ?? 0) - (stats?.goals_against ?? 0) }]
  return <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">{entries.map((entry) => <div className="surface !p-5 sm:!p-6" key={entry.label}><dt className="text-xs sm:text-sm text-muted-foreground">{entry.label}</dt><dd className="metric mt-3">{entry.value}</dd></div>)}</dl>
}
