import { brandImage, ogSize } from '@/lib/og'

export const alt = 'ITJAGUARS FC · Partidos, plantilla y estadísticas'
export const size = ogSize
export const contentType = 'image/png'
export const runtime = 'nodejs'

export default async function Image() {
  return brandImage({ title: 'El siguiente capítulo se juega juntos.', home: true })
}
