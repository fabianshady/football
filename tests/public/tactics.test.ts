import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildLineup, buildLineupVariants, classifyRole, getFormation, isGoalkeeper, rankingLabel, recommendFormation, slotFit, squadPlayers } from '../../lib/tactics.ts'
import type { FormationDef } from '../../lib/tactics.ts'
import type { Player, PlayerPosition } from '../../lib/types.ts'
import { playerLine, playerPositions, playerSide } from '../../lib/public.ts'

function player(id: string, primary: PlayerPosition, secondary: PlayerPosition[] = []): Player {
  return { id, name: id, dorsal: 1, positions: [], primary_position: primary, secondary_positions: secondary, preferred_side: 'ANY' }
}
const small: FormationDef = { id: 'small', name: 'Small', label: '', summary: '', slots: [
  { id: 'def', role: 'def', label: 'Defensa', side: 'L', x: 25, y: 70 },
  { id: 'mid', role: 'mid', label: 'Medio', side: 'R', x: 75, y: 50 },
] }

test('global assignment reserves the versatile starter where greedy loses coverage', () => {
  const versatile = player('a', 'CB', ['CM'])
  const specialist = player('b', 'CB')
  const result = buildLineup(small, [versatile, specialist], null)
  assert.equal(result.assignment.def?.id, 'b')
  assert.equal(result.assignment.mid?.id, 'a')
  assert.equal(result.coverage, 2)
  assert.equal(result.warnings.length, 0)
})

test('slot-mask DP agrees with exhaustive optimum on small competing position and side pools', () => {
  const pools = [
    [player('a', 'WB'), player('b', 'CB'), player('c', 'CM')],
    [{ ...player('a', 'CB', ['CM']), preferred_side: 'R' as const }, player('b', 'CB'), player('c', 'ST')],
    [player('a', 'GK'), player('b', 'CM')],
  ]
  for (const pool of pools) {
    // Small independent exhaustive oracle is used only in this test, never in production.
    function optimum(index: number, used: Set<string>): number {
      if (index === small.slots.length) return 0
      const slot = small.slots[index]
      let best = -1000 + optimum(index + 1, used)
      for (const candidate of pool) {
        const fit = slotFit(candidate, slot)
        if (!fit || used.has(candidate.id)) continue
        best = Math.max(best, 1000 + fit.score + optimum(index + 1, new Set([...used, candidate.id])))
      }
      return best
    }
    assert.equal(buildLineup(small, pool, null).score, optimum(0, new Set()))
  }
})

test('WB is equally compatible with both bands; canonical secondary and side are respected once', () => {
  const wb = player('wb', 'WB')
  assert.equal(slotFit(wb, small.slots[0])?.score, slotFit(wb, small.slots[1])?.score)
  assert.equal(playerLine(wb), 'Carrileros')
  const secondary = { ...player('a', 'ST', ['CB']), positions: ['Portero (L)'], preferred_side: 'R' as const }
  assert.equal(classifyRole(secondary), 'fwd')
  assert.equal(isGoalkeeper(secondary), false)
  assert.equal(playerSide(secondary), 'R')
  assert.match(slotFit(secondary, small.slots[0])!.reason, /secundaria/)
  assert.equal(slotFit(secondary, small.slots[0])?.score, 24)
})

test('legacy compatibility keeps distinct ordered roles and conflicting sides become ANY', () => {
  const legacy: Player = { id: 'l', name: 'Legacy', dorsal: 9, positions: ['Lateral (L)', 'Mediocentro defensivo', 'GK', 'Lateral (R)', 'Etiqueta sin mapear'] }
  assert.deepEqual(playerPositions(legacy), ['WB', 'DM', 'GK'])
  assert.equal(playerSide(legacy), 'ANY')
  assert.equal(isGoalkeeper(legacy), true)
  assert.equal(classifyRole(['Portero']), 'gk')
  assert.equal(classifyRole({ ...legacy, primary_position: null, secondary_positions: [] }), null)
  assert.equal(legacy.positions.at(-1), 'Etiqueta sin mapear')
})

test('missing GK stays vacant and GK-only players are never assigned to field slots', () => {
  const formation = getFormation('2-3-1')!
  const fieldPlayers = [player('d', 'CB'), player('w', 'WB'), player('m', 'CM'), player('s', 'ST')]
  const missing = buildLineupVariants(formation, fieldPlayers.map((p) => ({ player: p })))[0]
  assert.equal(missing.assignment.gk, null)
  assert.match(missing.warnings.join(' '), /portero declarado/)
  const variants = buildLineupVariants(formation, [...fieldPlayers, player('g1', 'GK'), player('g2', 'GK')].map((p) => ({ player: p })))
  assert.equal(variants.length, 2)
  for (const variant of variants) {
    const assigned = Object.values(variant.assignment).filter((p): p is Player => Boolean(p))
    assert.equal(new Set(assigned.map((p) => p.id)).size, assigned.length)
    assert.equal(assigned.filter((p) => p.primary_position === 'GK').length, 1)
    assert.equal(variant.assignment.gk?.id, variant.gk?.id)
    assert.ok(variant.bench.some((p) => p.primary_position === 'GK'))
  }
})

test('secondary GK variants retain declared field eligibility without duplicating selected keeper', () => {
  const pool = [player('a', 'CB', ['GK']), player('b', 'GK', ['CM']), player('c', 'GK')]
  const formation = { ...small, slots: [{ id: 'gk', role: 'gk' as const, label: 'Portero', x: 50, y: 90 }, ...small.slots] }
  const variants = buildLineupVariants(formation, pool.map((p) => ({ player: p })))
  assert.equal(variants.length, 3)
  const withPureKeeper = variants.find((variant) => variant.gk?.id === 'c')!
  assert.equal(withPureKeeper.assignment.def?.id, 'a')
  assert.equal(withPureKeeper.assignment.mid?.id, 'b')
  for (const variant of variants) {
    assert.equal(Object.values(variant.assignment).filter((p) => p?.id === variant.gk?.id).length, 1)
  }
})

test('ties ignore dorsal/career totals and input order; squad DTO preserves canonical fields', () => {
  const a = { ...player('a', 'CB'), dorsal: 99, goals: 0, callUps: 0, nickname: 'Apodo', foot: 'BOTH' as const }
  const b = { ...player('b', 'CB'), dorsal: 1, goals: 999, callUps: 999 }
  const single = { ...small, slots: [small.slots[0]] }
  assert.equal(buildLineup(single, [b, a], null).assignment.def?.id, 'a')
  assert.deepEqual(buildLineup(single, [a, b], null).assignment, buildLineup(single, [b, a], null).assignment)
  assert.deepEqual(squadPlayers([{ player: a }, { player: a }]), [a])
})

test('formation recommendation favors global coverage, penalizes vacancies, never claims rival strength', () => {
  const mids = { ...small, id: 'mids', slots: small.slots.map((slot) => ({ ...slot, role: 'mid' as const })) }
  const squad = [player('a', 'CM'), player('b', 'DM')].map((p) => ({ player: p }))
  assert.equal(recommendFormation(squad, [small, mids])?.formation.id, 'mids')
  assert.ok(buildLineup(mids, [], null).score < buildLineup(mids, squad.map((p) => p.player), null).score)
  assert.equal(rankingLabel(0), 'Sin clasificación')
  assert.equal(rankingLabel(1), 'Posición #1°')
  assert.equal(rankingLabel(28), 'Posición #28°')
})
