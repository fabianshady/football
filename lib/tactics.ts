import formationsData from '../data/formations.json' with { type: 'json' }
import { playerPositions, playerSide, positionRoles } from './public.ts'
import type { FieldRole, FieldSide, MatchSquadEntry, Player } from './types.ts'

export interface FormationSlot {
  id: string
  role: FieldRole
  side?: FieldSide
  label: string
  x: number
  y: number
}
export interface FormationDef {
  id: string
  name: string
  label: string
  summary: string
  slots: FormationSlot[]
}
export interface FormationBook { defaultId: string; playersOnField: number; formations: FormationDef[] }
export interface InsightBlock { title: string; pros: string[]; cons: string[] }
export type LineupAssignment = Record<string, Player | null>
export interface LineupVariant {
  gk: Player | null
  assignment: LineupAssignment
  bench: Player[]
  score: number
  coverage: number
  reasons: Record<string, string>
  warnings: string[]
}
const book = formationsData as FormationBook
export function getFormations(): FormationDef[] { return book.formations }
export function getDefaultFormationId(): string { return book.defaultId }
export function getFormation(id: string): FormationDef | undefined { return book.formations.find((formation) => formation.id === id) ?? book.formations[0] }

// Legacy array callers are supported, while structured player callers are canonical-first.
function asPlayer(value: Player | string[] | undefined): Player {
  return Array.isArray(value) || !value ? { id: '', name: '', dorsal: 0, positions: value ?? [] } : value
}
export function classifyRole(value: Player | string[] | undefined): FieldRole | null {
  return positionRoles(playerPositions(asPlayer(value))[0])[0] ?? null
}
export function preferredSide(value: Player | string[] | undefined): FieldSide | null {
  const side = playerSide(asPlayer(value))
  return side === 'ANY' ? null : side
}
export function isGoalkeeper(value: Player | string[] | undefined): boolean {
  return playerPositions(asPlayer(value)).includes('GK')
}
export function slotSide(slot: FormationSlot): FieldSide {
  return slot.side ?? (slot.x < 40 ? 'L' : slot.x > 60 ? 'R' : 'C')
}
export function rankingLabel(position: number | null | undefined): string {
  return position && Number.isFinite(position) && position > 0 ? `Posición #${position}°` : 'Sin clasificación'
}
export function getInsight(formationId: string): InsightBlock | null {
  if (formationId === '2-3-1') return {
    title: 'Amplitud y apoyos en el medio',
    pros: ['Tres medios ofrecen apoyos para circular el balón.', 'Los interiores pueden ocupar los costados.'],
    cons: ['Coordinar las subidas para cubrir a los dos defensas.', 'Acompañar al delantero para que no quede aislado.'],
  }
  if (formationId === '3-2-1') return {
    title: 'Cobertura y doble pivote',
    pros: ['Tres defensas ofrecen una línea adicional de cobertura.', 'El doble pivote puede repartirse los apoyos centrales.'],
    cons: ['La amplitud requiere movimientos de defensas o medios.', 'Conectar con el delantero requiere apoyos cercanos.'],
  }
  return null
}

/** Only declared positions in this band are eligible; a vacancy is preferable to an invented role. */
export function slotFit(player: Player, slot: FormationSlot): { score: number; reason: string } | null {
  const positions = playerPositions(player)
  const index = positions.findIndex((position) => positionRoles(position).includes(slot.role))
  if (index < 0) return null
  const side = playerSide(player)
  const needed = slotSide(slot)
  const sideScore = slot.role === 'gk' || side === 'ANY' ? 0 : side === needed ? 6 : -6
  const reason = `${index === 0 ? 'Posición principal' : 'Posición secundaria'}${positions[index] === 'WB' ? ' · carrilero compatible con defensa y medio' : ''}${slot.role === 'gk' ? '' : side === 'ANY' ? ' · lado libre' : side === needed ? ' · lado preferido' : ' · otro lado'}`
  return { score: (index === 0 ? 40 : 30) + sideScore, reason }
}
function comparePlayers(a: Player, b: Player): number { return a.id.localeCompare(b.id) || a.name.localeCompare(b.name, 'es') }
export function squadPlayers(squad: MatchSquadEntry[] | undefined): Player[] {
  const players = new Map<string, Player>()
  for (const { player } of squad ?? []) if (player?.id && !players.has(player.id)) players.set(player.id, { ...player })
  return [...players.values()].sort(comparePlayers)
}
export function goalkeepersInSquad(players: Player[]): Player[] { return players.filter(isGoalkeeper).sort(comparePlayers) }

/** Player-stream DP over slot masks: O(n * slots * 2^slots), no permutations.
 * Every occupied slot contributes a large coverage bonus; every vacancy carries a penalty.
 * Stable ID/name order resolves equal scores without career, dorsal, or scoring biases.
 */
export function buildLineup(formation: FormationDef, players: Player[], gk: Player | null): LineupVariant {
  const pool = squadPlayers(players.map((player) => ({ player })))
  const keeper = gk ? pool.find((player) => player.id === gk.id && isGoalkeeper(player)) ?? null : null
  const slots = formation.slots
  type State = { score: number; picks: (Player | null)[] }
  const dp: (State | undefined)[] = Array(1 << slots.length)
  dp[0] = { score: 0, picks: slots.map(() => null) }
  for (const player of pool) {
    for (let mask = dp.length - 1; mask >= 0; mask--) {
      const state = dp[mask]
      if (!state) continue
      for (let index = 0; index < slots.length; index++) {
        if (mask & (1 << index)) continue
        const slot = slots[index]
        if (slot.role === 'gk' ? player.id !== keeper?.id : player.id === keeper?.id) continue
        const fit = slotFit(player, slot)
        if (!fit) continue
        const next = mask | (1 << index)
        const score = state.score + 1000 + fit.score
        if (!dp[next] || score > dp[next]!.score) {
          const picks = [...state.picks]
          picks[index] = player
          dp[next] = { score, picks }
        }
      }
    }
  }
  let best = dp[0]!
  let bestScore = -1000 * slots.length
  for (const state of dp) {
    if (!state) continue
    const score = state.score - state.picks.filter((player) => !player).length * 1000
    if (score > bestScore) { best = state; bestScore = score }
  }
  const assignment: LineupAssignment = {}
  const reasons: Record<string, string> = {}
  const warnings: string[] = []
  const used = new Set<string>()
  slots.forEach((slot, index) => {
    const player = best.picks[index]
    assignment[slot.id] = player
    reasons[slot.id] = player ? slotFit(player, slot)!.reason : 'Vacante: sin jugador con posición compatible'
    if (player) used.add(player.id)
    else warnings.push(`${slot.label}: falta ${slot.role === 'gk' ? 'un portero declarado' : 'un jugador compatible'}.`)
  })
  return { gk: keeper, assignment, bench: pool.filter((player) => !used.has(player.id)), score: bestScore, coverage: used.size, reasons, warnings }
}
export function buildLineupVariants(formation: FormationDef, squad: MatchSquadEntry[] | undefined): LineupVariant[] {
  const players = squadPlayers(squad)
  const keepers = goalkeepersInSquad(players)
  return (keepers.length ? keepers : [null]).map((keeper) => buildLineup(formation, players, keeper))
}
export function recommendFormation(squad: MatchSquadEntry[] | undefined, formations = getFormations()): { formation: FormationDef; lineup: LineupVariant } | null {
  const candidates = formations.flatMap((formation) => buildLineupVariants(formation, squad).map((lineup) => ({ formation, lineup })))
  return candidates.sort((a, b) => b.lineup.score - a.lineup.score || a.formation.id.localeCompare(b.formation.id) || (a.lineup.gk?.id ?? '').localeCompare(b.lineup.gk?.id ?? ''))[0] ?? null
}
