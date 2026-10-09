import type { Metadata } from 'next'
import type { Match, Team } from './types.ts'
import { formatVenueDateTime, parseMatchDate } from './datetime.ts'

export const BRAND = 'ITJAGUARS FC'
export const HOME_DESCRIPTION = 'Partidos, resultados, estadísticas y plantilla de ITJAGUARS FC. Sigue el camino del club desde Tijuana.'

export function canonicalOrigin(env: Record<string, string | undefined> = process.env): URL {
  const url = new URL(env.SITE_URL || 'https://itjaguars.fabianms.com')
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('SITE_URL debe ser una URL HTTP(S).')
  return new URL(url.origin)
}
export function isIndexable(env: Record<string, string | undefined> = process.env): boolean {
  if (env.VERCEL_ENV) return env.VERCEL_ENV === 'production'
  if (env.SITE_ENV) return env.SITE_ENV === 'production'
  return env.NODE_ENV === 'production'
}
export function absoluteUrl(path: string): string { return new URL(path, canonicalOrigin()).href }
export function pageMetadata(title: string, description: string, path: string, image = '/opengraph-image', index = isIndexable()): Metadata {
  const socialTitle = title === BRAND ? BRAND : `${title} | ${BRAND}`
  const images = [{ url: absoluteUrl(image), width: 1200, height: 630, alt: socialTitle }]
  return {
    title: title === BRAND ? { absolute: BRAND } : title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    robots: { index, follow: index },
    openGraph: { title: socialTitle, description, url: absoluteUrl(path), siteName: BRAND, locale: 'es_MX', type: 'website', images },
    twitter: { card: 'summary_large_image', title: socialTitle, description, images },
  }
}
export function matchDescription(match: Match, now = new Date()): string {
  const past = parseMatchDate(match.date) < now
  return `${past ? `Marcador registrado: ${match.scoreHome}–${match.scoreAway}. ` : ''}${formatVenueDateTime(match.date)} (Tijuana)${match.location ? ` · ${match.location}` : ''}. Convocatoria y detalle del partido.${past ? ' La fecha pasada no confirma su finalización.' : ''}`
}
export function sportsTeamJsonLd(team?: Team) {
  return {
    '@context': 'https://schema.org', '@type': 'SportsTeam',
    '@id': absoluteUrl(team ? `/${encodeURIComponent(team.slug)}#equipo` : '/#club'),
    name: team?.name ?? BRAND, sport: 'Fútbol',
    url: absoluteUrl(team ? `/${encodeURIComponent(team.slug)}` : '/'),
    logo: absoluteUrl('/brand/logo.png'),
    ...(team ? { parentOrganization: { '@id': absoluteUrl('/#club'), name: BRAND } } : {}),
  }
}
export function sportsEventJsonLd(match: Match) {
  return {
    '@context': 'https://schema.org', '@type': 'SportsEvent',
    '@id': absoluteUrl(`/partido/${encodeURIComponent(match.id)}#partido`),
    name: `${match.myTeam} vs ${match.rivalTeam}`,
    url: absoluteUrl(`/partido/${encodeURIComponent(match.id)}`),
    startDate: parseMatchDate(match.date).toISOString(), sport: 'Fútbol',
    ...(match.location ? { location: { '@type': 'Place', name: match.location } } : {}),
    competitor: [{ '@type': 'SportsTeam', name: match.myTeam, logo: absoluteUrl('/brand/logo.png') }, { '@type': 'SportsTeam', name: match.rivalTeam }],
  }
}
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
}
