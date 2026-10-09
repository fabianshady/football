import type { MetadataRoute } from 'next'
import { dataConfigured, getMatches, getPlayers, getTeams } from '@/lib/queries'
import { absoluteUrl, isIndexable } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isIndexable()) return []
  const paths = ['/', '/plantilla', '/finanzas']
  if (dataConfigured) {
    const [teams, matches, players] = await Promise.all([getTeams(), getMatches(), getPlayers(false)])
    for (const team of teams) {
      const base = `/${encodeURIComponent(team.slug)}`
      paths.push(base, `${base}/partidos`, `${base}/estadisticas`)
    }
    paths.push(...matches.map((match) => `/partido/${encodeURIComponent(match.id)}`))
    paths.push(...players.map((player) => `/plantilla/${encodeURIComponent(player.id)}`))
  }
  // No guessed lastModified dates, finance records or query-string variants.
  return [...new Set(paths)].map((path) => ({ url: absoluteUrl(path) }))
}
