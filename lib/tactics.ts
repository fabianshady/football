import formationsData from '@/data/formations.json'
import aliasesData from '@/data/position-aliases.json'
import insightsData from '@/data/formation-insights.json'
import type { FieldRole, FieldSide, MatchSquadEntry, OpponentStrength, Player } from '@/lib/types'

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

export interface FormationBook {
  defaultId: string
  playersOnField: number
  formations: FormationDef[]
}

export interface InsightBlock {
  title: string
  pros: string[]
  cons: string[]
}

export type LineupAssignment = Record<string, Player | null>

export interface LineupVariant {
  gk: Player | null
  assignment: LineupAssignment
  bench: Player[]
}

const book = formationsData as FormationBook
const aliases = aliasesData as Record<FieldRole, string[]>
const insights = insightsData as Record<string, Record<OpponentStrength, InsightBlock>>

const ROLE_ORDER: FieldRole[] = ['gk', 'def', 'mid', 'fwd']

function normalizePos(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

const aliasMap: Array<{ role: FieldRole; keys: Set<string> }> = ROLE_ORDER.map((role) => ({
  role,
  keys: new Set((aliases[role] ?? []).map(normalizePos)),
}))

export function getFormations(): FormationDef[] {
  return book.formations
}

export function getDefaultFormationId(): string {
  return book.defaultId
}

export function getFormation(id: string): FormationDef | undefined {
  return book.formations.find((f) => f.id === id) ?? book.formations[0]
}

export function opponentStrength(rivalPos: number | null | undefined): OpponentStrength {
  if (rivalPos == null || Number.isNaN(rivalPos)) return 'mid'
  if (rivalPos <= 10) return 'strong'
  if (rivalPos <= 20) return 'mid'
  return 'weak'
}

export function strengthLabel(strength: OpponentStrength): string {
  if (strength === 'strong') return 'Equipo fuerte'
  if (strength === 'weak') return 'Equipo débil'
  return 'Equipo intermedio'
}

const SIDE_MARK = /\(\s*(l|r|c|i|izq\.?|der\.?|cen\.?|centro)\s*\)\s*$/i

function roleKeyFromPosition(value: string): string {
  return normalizePos(value.replace(SIDE_MARK, ''))
}

/** Reads `(L)` / `(R)` / `(C)` from the position that defines the player's line. */
export function preferredSide(positions: string[] | undefined): FieldSide | null {
  if (!positions?.length) return null
  for (const pos of positions) {
    const mark = pos.match(SIDE_MARK)
    if (!mark) continue
    const token = mark[1].toLowerCase()
    if (token === 'l' || token === 'i' || token.startsWith('izq')) return 'L'
    if (token === 'r' || token.startsWith('der')) return 'R'
    return 'C'
  }
  return null
}

export function classifyRole(positions: string[] | undefined): FieldRole | null {
  if (!positions?.length) return null
  for (const pos of positions) {
    const key = roleKeyFromPosition(pos)
    for (const entry of aliasMap) {
      if (entry.keys.has(key)) return entry.role
    }
  }
  return null
}

export function slotSide(slot: FormationSlot): FieldSide {
  if (slot.side) return slot.side
  if (slot.x < 40) return 'L'
  if (slot.x > 60) return 'R'
  return 'C'
}

export function isGoalkeeper(positions: string[] | undefined): boolean {
  if (!positions?.length) return false
  const gkKeys = aliasMap.find((entry) => entry.role === 'gk')?.keys
  if (!gkKeys) return false
  return positions.some((pos) => gkKeys.has(roleKeyFromPosition(pos)))
}

export function getInsight(formationId: string, strength: OpponentStrength): InsightBlock | null {
  return insights[formationId]?.[strength] ?? null
}

function neighborRoles(role: FieldRole): FieldRole[] {
  switch (role) {
    case 'gk':
      return ['def']
    case 'def':
      return ['mid', 'gk']
    case 'mid':
      return ['def', 'fwd']
    case 'fwd':
      return ['mid']
  }
}

function roleFit(playerRole: FieldRole | null, slotRole: FieldRole): number {
  if (playerRole === slotRole) return 2
  if (playerRole && neighborRoles(slotRole).includes(playerRole)) return 1
  return 0
}

function sideFit(playerSide: FieldSide | null, needed: FieldSide): number {
  const side = playerSide ?? 'C'
  if (needed === 'C') return side === 'C' ? 2 : 1
  if (side === needed) return 2
  if (side === 'C') return 1
  return 0
}

function compareStarters(a: Player, b: Player): number {
  const callUps = (b.callUps ?? 0) - (a.callUps ?? 0)
  if (callUps !== 0) return callUps
  const goals = (b.goals ?? 0) - (a.goals ?? 0)
  if (goals !== 0) return goals
  return a.dorsal - b.dorsal
}

function pickPlayer(pool: Player[], slot: FormationSlot, used: Set<string>): Player | null {
  const available = pool.filter((p) => !used.has(p.id))
  if (available.length === 0) return null
  const needed = slotSide(slot)
  return [...available].sort((a, b) => {
    const roleDiff =
      roleFit(classifyRole(b.positions), slot.role) - roleFit(classifyRole(a.positions), slot.role)
    if (roleDiff !== 0) return roleDiff
    const sideDiff = sideFit(preferredSide(b.positions), needed) - sideFit(preferredSide(a.positions), needed)
    if (sideDiff !== 0) return sideDiff
    return compareStarters(a, b)
  })[0]
}

export function squadPlayers(squad: MatchSquadEntry[] | undefined): Player[] {
  if (!squad) return []
  const seen = new Set<string>()
  const players: Player[] = []
  for (const entry of squad) {
    const player = entry.player
    if (!player?.id || seen.has(player.id)) continue
    seen.add(player.id)
    players.push({
      id: player.id,
      name: player.name,
      dorsal: player.dorsal,
      positions: player.positions ?? [],
      callUps: player.callUps ?? 0,
      goals: player.goals ?? 0,
    })
  }
  return players
}

export function goalkeepersInSquad(players: Player[]): Player[] {
  return players.filter((p) => isGoalkeeper(p.positions))
}

export function buildLineup(formation: FormationDef, players: Player[], gk: Player | null): LineupVariant {
  const used = new Set<string>()
  const assignment: LineupAssignment = {}

  for (const slot of formation.slots) {
    if (slot.role === 'gk') {
      assignment[slot.id] = gk
      if (gk) used.add(gk.id)
      continue
    }
    const picked = pickPlayer(players, slot, used)
    assignment[slot.id] = picked
    if (picked) used.add(picked.id)
  }

  const bench = players.filter((p) => !used.has(p.id))
  return { gk, assignment, bench }
}

export function buildLineupVariants(formation: FormationDef, squad: MatchSquadEntry[] | undefined): LineupVariant[] {
  const players = squadPlayers(squad)
  const keepers = goalkeepersInSquad(players)
  const gkOptions = keepers.length > 0 ? keepers : [null]
  return gkOptions.map((gk) => buildLineup(formation, players, gk))
}
