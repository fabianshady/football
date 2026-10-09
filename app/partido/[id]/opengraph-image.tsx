import { brandImage, ogSize } from '@/lib/og'
import { dataConfigured, getMatch } from '@/lib/queries'
import { formatVenueDateTime, parseMatchDate } from '@/lib/datetime'

export const alt = 'ITJAGUARS FC · Fecha, sede y marcador registrado del partido'
export const size = ogSize
export const contentType = 'image/png'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  if (!dataConfigured) return brandImage()
  const { id } = await params
  try {
    const match = await getMatch(id)
    if (!match) return brandImage()
    const past = parseMatchDate(match.date) < new Date()
    return brandImage({
      title: `${match.myTeam} vs ${match.rivalTeam}`,
      eyebrow: past ? `Marcador registrado · ${match.scoreHome}–${match.scoreAway}` : 'Próximo partido',
      detail: `${formatVenueDateTime(match.date)} (Tijuana)${match.location ? ` · ${match.location}` : ''}`,
      note: past ? 'Fecha pasada; no confirma finalización. Consulta convocatoria y detalle.' : 'Consulta convocatoria y detalle del partido.',
    })
  } catch { return brandImage() }
}
