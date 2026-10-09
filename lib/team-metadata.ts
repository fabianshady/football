import 'server-only'
import { dataConfigured } from '@/lib/queries'
import { getTeamContext, type TeamPageProps } from '@/lib/team-page'
import { pageMetadata } from '@/lib/seo'

export async function teamMetadata(props: TeamPageProps, section: 'resumen' | 'partidos' | 'estadisticas') {
  const slug = (await props.params).equipo
  const suffix = section === 'resumen' ? '' : `/${section}`
  const path = `/${encodeURIComponent(slug)}${suffix}`
  if (!dataConfigured) return pageMetadata('Equipo', 'Información del equipo de ITJAGUARS FC.', path, '/opengraph-image', false)
  const { team, season } = await getTeamContext(props)
  const label = section === 'resumen' ? team.name : `${section === 'partidos' ? 'Partidos' : 'Estadísticas'} · ${team.name}`
  const description = `${section === 'partidos' ? 'Calendario, rivales y resultados' : section === 'estadisticas' ? 'Resultados, goles y convocatorias' : 'Partidos, resultados y estadísticas'} de ${team.name}${season ? ` · ${season.name}` : ''}${team.league_name ? ` · ${team.league_name}` : ''}.`
  const search = await props.searchParams
  const query = search.temporada && season ? `?temporada=${encodeURIComponent(season.id)}` : ''
  // The card explicitly labels its all-season history; page descriptions reflect the selected season.
  return pageMetadata(label, description, `${path}${query}`, `/${encodeURIComponent(team.slug)}/opengraph-image`)
}
