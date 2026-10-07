import 'server-only'
import { notFound } from 'next/navigation'
import { getSeasons, getTeams } from '@/lib/queries'
import { selectSeason } from '@/lib/public'

export type TeamPageProps = { params: Promise<{ equipo: string }>; searchParams: Promise<{ temporada?: string }> }
export async function getTeamContext(props: TeamPageProps) {
  const [{ equipo }, search, teams, seasons] = await Promise.all([props.params, props.searchParams, getTeams(), getSeasons()])
  const team = teams.find((item) => item.slug === equipo)
  if (!team) notFound()
  const season = selectSeason(seasons, search.temporada)
  if (search.temporada && !season) notFound()
  return { team, seasons, season }
}
