import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mapPlayer, mapRawMatch } from '../../lib/matches.ts'
import { goalLabel, headToHeadCutoff, headToHeadSummary, playerDisplayName, playersInTeam, playersWithStats, priorRivalMatches } from '../../lib/public.ts'

test('player DTO preserves structured fields, unknown legacy labels and explicit memberships', () => {
  const dto = mapPlayer({ id: 'p', name: 'Nombre completo', nickname: 'Apodo', dorsal: 12, positions: ['Original sin mapear'], primary_position: 'WB', secondary_positions: ['CM'], preferred_side: 'L', foot: null, player_team: [{ team_id: 'a' }] })!
  assert.equal(dto.primary_position, 'WB')
  assert.deepEqual(dto.secondary_positions, ['CM'])
  assert.deepEqual(dto.positions, ['Original sin mapear'])
  assert.equal(dto.foot, null)
  assert.deepEqual(dto.teamIds, ['a'])
  assert.equal(playerDisplayName(dto), 'Apodo')
  assert.equal(playerDisplayName({ ...dto, nickname: ' ' }), 'Nombre completo')
  const historical = playersWithStats([dto], [{ player_id: 'p', team_id: 'b', season_id: 's', goals: 4, call_ups: 10 }])
  assert.equal(playersInTeam(historical, 'b').length, 0)
  assert.equal(playersInTeam(historical, 'a').length, 1)
  assert.equal(historical[0].callUps, 10)
})

test('mapping preserves every real goal including null-player kinds without fabricating attribution', () => {
  const match = mapRawMatch({ id: 'm', scoreHome: 9, rivalTeam: 'Old label', rival_name: 'Canonical', rival_id: 'r', rival_slug: 'r-slug', Goal: [
    { id: 'g1', kind: 'player', playerId: 'p', minute: 0, Player: { id: 'p', name: 'Nombre', nickname: 'Apodo', dorsal: 7, primary_position: 'ST', secondary_positions: [], positions: [] } },
    { id: 'g2', kind: 'own_goal', playerId: null, minute: 120, Player: null },
    { id: 'g3', kind: 'unknown', playerId: null, minute: null, Player: null },
    { id: 'g4', kind: 'player', playerId: 'unresolved', Player: null },
  ] })
  assert.equal(match.rivalTeam, 'Canonical')
  assert.equal(match.rivalId, 'r')
  assert.equal(match.rivalSlug, 'r-slug')
  assert.equal(match.goals?.length, 4)
  assert.deepEqual(match.goals?.map(goalLabel), ['#7 Apodo', 'Autogol rival', 'Autor desconocido', 'Autor desconocido'])
  assert.equal(match.goals?.[1].playerId, null)
  assert.equal(match.goals?.[1].player, null)
  assert.equal(match.goals?.[0].minute, 0)
  assert.equal(match.goals?.[1].minute, 120)
  assert.equal(match.scoreHome, 9)
})

test('H2H historical reference excludes current, equal dates, later results, different IDs and teams', () => {
  const make = (id: string, date: string, teamId = 'a', rivalId = 'r', scoreHome = 1, scoreAway = 0) => mapRawMatch({ id, date, teamId, rivalId, scoreHome, scoreAway })
  const now = new Date('2026-10-08T00:00:00Z')
  const current = make('current', '2026-09-01T00:00:00Z')
  const rows = [current, make('same-time', current.date), make('later', '2026-09-02T00:00:00Z'), make('future', '2027-01-01T00:00:00Z'),
    make('old', '2026-08-01T00:00:00Z'), make('archive', '2025-01-01T00:00:00Z', 'a', 'r', 0, 2),
    make('other-team', '2026-07-01T00:00:00Z', 'b', 'r', 0, 0), make('other-rival', '2026-07-01T00:00:00Z', 'a', 'different')]
  const same = priorRivalMatches(rows, current, current.teamId, now)
  assert.deepEqual(same.map((match) => match.id), ['old', 'archive'])
  const club = priorRivalMatches(rows, current, '', now)
  assert.deepEqual(club.map((match) => match.id), ['old', 'other-team', 'archive'])
  assert.deepEqual(headToHeadSummary(club), { played: 3, wins: 1, draws: 1, losses: 1, goalsFor: 1, goalsAgainst: 2 })
  assert.equal(headToHeadCutoff(current.date, now), new Date(current.date).toISOString())
})

test('future fixture H2H uses strict now boundary and first-recorded-match state is empty', () => {
  const now = new Date('2026-10-08T00:00:00Z')
  const current = mapRawMatch({ id: 'next', teamId: 'a', rivalId: 'r', date: '2026-10-20T00:00:00Z' })
  const rows = ['2026-10-07T23:59:59Z', now.toISOString(), '2026-10-09T00:00:00Z'].map((date, index) => mapRawMatch({ id: String(index), teamId: 'a', rivalId: 'r', date }))
  assert.equal(headToHeadCutoff(current.date, now), now.toISOString())
  assert.deepEqual(priorRivalMatches(rows, current, 'a', now).map((match) => match.id), ['0'])
  assert.deepEqual(priorRivalMatches([], current, 'a', now), [])
  assert.equal(headToHeadSummary([]).played, 0)
})
