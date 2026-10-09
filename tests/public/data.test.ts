import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyPlayerStats, mapRawMatch } from '../../lib/matches.ts'
import { playersWithStats, selectSeason, splitMatches } from '../../lib/public.ts'
import type { Season } from '../../lib/types.ts'

test('maps nested detail relations, canonical team identity, kit and schedule exceptions', () => {
  const player = { id: 'p', name: 'Ana', dorsal: 9, positions: ['Delantero'] }
  const match = mapRawMatch({ id: 'm', teamId: 't', team_slug: 'itj', team_name: 'ITJ', date: '2026-10-07T01:50:00Z', kit: 2, schedule_override: true, Goal: [{ playerId: 'p', Player: player }], MatchSquad: [{ playerId: 'p', Player: player }] })
  assert.equal(match.myTeam, 'ITJ')
  assert.equal(match.teamSlug, 'itj')
  assert.equal(match.kit, 2)
  assert.equal(match.scheduleOverride, true)
   assert.equal(match.goals?.[0].player?.id, 'p')
  const withStats = applyPlayerStats(match, { p: { callUps: 4, goals: 2 } })
  assert.equal(withStats.squad?.[0].player.callUps, 4)
  assert.equal(match.squad?.[0].player.callUps, undefined)
})
test('aggregate DTOs stay scoped by team and season; career totals include all rows', () => {
  const players = [{ id: 'p', name: 'Ana', dorsal: 9, positions: [] }]
  const rows = [{ player_id: 'p', team_id: 'a', season_id: 's1', call_ups: 3, goals: 2 }, { player_id: 'p', team_id: 'b', season_id: 's1', call_ups: 4, goals: 1 }, { player_id: 'p', team_id: 'a', season_id: 's2', call_ups: 2, goals: 0 }]
  assert.equal(playersWithStats(players, rows, 'a', 's1')[0].callUps, 3)
  assert.equal(playersWithStats(players, rows)[0].callUps, 9)
  assert.equal(playersWithStats(players, rows)[0].goals, 3)
})
test('season selection honors explicit archives, current season and invalid links', () => {
  const seasons: Season[] = [{ id: 'a', name: 'Archive', active: false, startdate: '', enddate: '' }, { id: 'b', name: 'Current', active: true, startdate: '', enddate: '' }]
  assert.equal(selectSeason(seasons)?.id, 'b')
  assert.equal(selectSeason(seasons, 'a')?.id, 'a')
  assert.equal(selectSeason(seasons, 'missing'), null)
})
test('match lists sort independently and classify by UTC instant, including boundary', () => {
  const matches = ['2026-10-08T01:00:00Z', '2026-10-06T01:00:00Z', '2026-10-07T01:00:00Z'].map((date, index) => mapRawMatch({ id: String(index), date }))
  const { upcoming, past } = splitMatches(matches, new Date('2026-10-07T01:00:00Z'))
  assert.deepEqual(upcoming.map((match) => match.id), ['2', '0'])
  assert.deepEqual(past.map((match) => match.id), ['1'])
  assert.equal(matches[0].id, '0')
})
