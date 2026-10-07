import Link from 'next/link'
import type { Season, Team } from '@/lib/types'

export function TeamNavigation({ team, season, active }: { team: Team; season: Season | null; active: 'resumen' | 'partidos' | 'estadisticas' }) {
  const query = season ? `?temporada=${encodeURIComponent(season.id)}` : ''
  return <nav className="team-nav" aria-label={`Secciones de ${team.name}`}>
    {[{ id: 'resumen', label: 'Resumen', path: '' }, { id: 'partidos', label: 'Partidos', path: '/partidos' }, { id: 'estadisticas', label: 'Estadísticas', path: '/estadisticas' }].map((item) => <Link key={item.id} href={`/${team.slug}${item.path}${query}`} aria-current={active === item.id ? 'page' : undefined}>{item.label}</Link>)}
  </nav>
}
