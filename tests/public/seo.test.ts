import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canonicalOrigin, isIndexable, matchDescription, pageMetadata, serializeJsonLd, sportsEventJsonLd } from '../../lib/seo.ts'
import type { Match } from '../../lib/types.ts'

test('production origin is stable and preview cannot override index protection', () => {
  assert.equal(canonicalOrigin({ SITE_URL: 'https://example.com/path?x=1' }).href, 'https://example.com/')
  assert.equal(canonicalOrigin({}).href, 'https://itjaguars.fabianms.com/')
  assert.throws(() => canonicalOrigin({ SITE_URL: 'file:///tmp/test' }))
  assert.equal(isIndexable({ NODE_ENV: 'production', VERCEL_ENV: 'preview', SITE_ENV: 'production' }), false)
  assert.equal(isIndexable({ NODE_ENV: 'production', SITE_ENV: 'preview' }), false)
  assert.equal(isIndexable({ NODE_ENV: 'development' }), false)
  assert.equal(isIndexable({ NODE_ENV: 'production' }), true)
})

const match: Match = { id: 'match-1', myTeam: 'Jaguars', rivalTeam: '</script><script>alert(1)</script>', myPos: 1, rivalPos: 2, date: '2026-01-02T02:00:00Z', location: 'Cancha', scoreHome: 3, scoreAway: 1 }

test('JSON-LD escapes database strings without inferring home side or completion', () => {
  const value = sportsEventJsonLd(match)
  const serialized = serializeJsonLd(value)
  assert.equal(serialized.includes('<'), false)
  assert.deepEqual(JSON.parse(serialized), value)
  assert.equal(value.startDate, '2026-01-02T02:00:00.000Z')
  assert.equal('homeTeam' in value, false)
  assert.equal('eventStatus' in value, false)
  assert.equal(value.competitor[1].name, match.rivalTeam)
})

test('match descriptions use Tijuana date and distinguish registered scores from future fixtures', () => {
  const past = matchDescription(match, new Date('2026-01-03T00:00:00Z'))
  assert.match(past, /3–1/)
  assert.match(past, /1 ene 2026, 18:00/)
  assert.match(past, /no confirma su finalización/)
  const future = matchDescription(match, new Date('2025-01-01T00:00:00Z'))
  assert.equal(future.includes('3–1'), false)
})

test('route metadata owns canonical and social image instead of inheriting home URLs', () => {
  const metadata = pageMetadata('Partido', 'Detalle', '/partido/match-1', '/partido/match-1/opengraph-image', false)
  assert.match(String(metadata.alternates?.canonical), /\/partido\/match-1$/)
  assert.deepEqual(metadata.robots, { index: false, follow: false })
  assert.match(JSON.stringify(metadata.openGraph), /\/partido\/match-1\/opengraph-image/)
  assert.match(JSON.stringify(metadata.twitter), /\/partido\/match-1\/opengraph-image/)
})
