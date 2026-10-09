import { brandImage, ogSize } from '@/lib/og'
import { dataConfigured, getMatches, getTeams } from '@/lib/queries'
import { headToHeadSummary, splitMatches } from '@/lib/public'

export const alt = 'ITJAGUARS FC · Historial registrado del equipo'
export const size = ogSize
export const contentType = 'image/png'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function Image({ params }: { params: Promise<{ equipo: string }> }) {
  if (!dataConfigured) return brandImage()
  const { equipo } = await params
  // Social images stay available during configuration/schema outages. Pages still expose errors.
  try {
    const team = (await getTeams()).find((item) => item.slug === equipo)
    if (!team) return brandImage()
    const past = splitMatches(await getMatches(team.id)).past
    const stats = headToHeadSummary(past)
    return brandImage({
      title: team.name, eyebrow: team.league_name ?? 'Nuestro equipo',
      detail: past.length ? `${stats.played} registros · ${stats.wins} V · ${stats.draws} E · ${stats.losses} D · ${stats.goalsFor} goles a favor` : 'Partidos · Resultados · Estadísticas',
      note: past.length ? 'Todas las temporadas · Fechas pasadas; no confirman finalización.' : 'Sin resultados registrados.',
    })
  } catch { return brandImage() }
}
