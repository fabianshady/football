import type { Match, MatchGoal, Player, PlayerPosition, PlayerStats, Season, FieldRole, PreferredSide } from './types.ts'
import { parseMatchDate } from './datetime.ts'

export function selectSeason(seasons: Season[], requested?: string): Season | null {
  if (requested) return seasons.find((season) => season.id === requested) ?? null
  return seasons.find((season) => season.active) ?? seasons[0] ?? null
}
export function splitMatches(matches: Match[], now = new Date()) {
  return {
    upcoming: matches.filter((match) => parseMatchDate(match.date) >= now).sort((a, b) => parseMatchDate(a.date).getTime() - parseMatchDate(b.date).getTime()),
    past: matches.filter((match) => parseMatchDate(match.date) < now).sort((a, b) => parseMatchDate(b.date).getTime() - parseMatchDate(a.date).getTime()),
  }
}
export function playersWithStats(players: Player[], rows: PlayerStats[], teamId?: string, seasonId?: string): Player[] {
  const totals = new Map<string, { callUps: number; goals: number }>()
  for (const row of rows) {
    if ((teamId && row.team_id !== teamId) || (seasonId && row.season_id !== seasonId)) continue
    const total = totals.get(row.player_id) ?? { callUps: 0, goals: 0 }
    total.callUps += Number(row.call_ups)
    total.goals += Number(row.goals)
    totals.set(row.player_id, total)
  }
  return players.map((player) => ({ ...player, ...(totals.get(player.id) ?? { callUps: 0, goals: 0 }) }))
}
export function weekdayLabel(weekday: number): string {
  return ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][weekday] ?? 'Por confirmar'
}

export const POSITION_LABELS: Record<PlayerPosition, string> = {
  GK: 'Portero', CB: 'Defensa central', WB: 'Carrilero', DM: 'Mediocentro defensivo',
  CM: 'Mediocentro', AM: 'Mediapunta', W: 'Extremo', ST: 'Delantero',
}
const LEGACY_POSITIONS: Record<string, PlayerPosition> = {
  portero: 'GK', defensa: 'CB', 'defensa central': 'CB', lateral: 'WB', carrilero: 'WB',
  'mediocentro defensivo': 'DM', mediocentro: 'CM', mediapunta: 'AM', extremo: 'W', delantero: 'ST',
}
const SIDE_MARK = /\(\s*(L|R|C)\s*\)\s*$/i

/** Structured fields take precedence, including an explicitly cleared primary. Legacy labels remain intact on the DTO. */
export function playerPositions(player: Player): PlayerPosition[] {
  if (player.primary_position !== undefined) {
    return [...new Set([...(player.primary_position ? [player.primary_position] : []), ...(player.secondary_positions ?? [])])]
  }
  const codes = player.positions.map((value) => {
    const label = value.replace(SIDE_MARK, '').trim()
    return POSITION_LABELS[label as PlayerPosition] ? label as PlayerPosition : LEGACY_POSITIONS[label.toLocaleLowerCase('es')]
  }).filter((code): code is PlayerPosition => Boolean(code))
  return [...new Set(codes)]
}
export function playerSide(player: Player): PreferredSide {
  if (player.preferred_side !== undefined) return player.preferred_side
  const sides = new Set(player.positions.map((value) => value.match(SIDE_MARK)?.[1].toUpperCase()).filter(Boolean))
  return sides.size === 1 ? [...sides][0] as PreferredSide : 'ANY'
}
export function positionRoles(position: PlayerPosition): FieldRole[] {
  switch (position) {
    case 'GK': return ['gk']
    case 'CB': return ['def']
    case 'WB': return ['def', 'mid']
    case 'DM': case 'CM': case 'AM': return ['mid']
    case 'W': case 'ST': return ['fwd']
    default: return []
  }
}
export function playerDisplayName(player: Player): string { return player.nickname?.trim() || player.name }
export function playerLine(player: Player): string {
  const primary = playerPositions(player)[0]
  if (primary === 'WB') return 'Carrileros'
  return ({ gk: 'Porteros', def: 'Defensas', mid: 'Mediocampistas', fwd: 'Delanteros' })[positionRoles(primary)[0]] ?? 'Sin posición definida'
}
export function playersInTeam(players: Player[], teamId?: string): Player[] {
  return teamId ? players.filter((player) => player.teamIds?.includes(teamId)) : players
}
export function goalLabel(goal: MatchGoal): string {
  if (goal.kind === 'own_goal') return 'Autogol rival'
  if (goal.kind === 'unknown' || !goal.player) return 'Autor desconocido'
  return `#${goal.player.dorsal} ${playerDisplayName(goal.player)}`
}
export function headToHeadCutoff(currentDate: string, now = new Date()): string {
  return new Date(Math.min(parseMatchDate(currentDate).getTime(), now.getTime())).toISOString()
}
export function priorRivalMatches(matches: Match[], current: Match, teamId: string | undefined = current.teamId, now = new Date()): Match[] {
  if (!current.rivalId) return []
  const cutoff = parseMatchDate(headToHeadCutoff(current.date, now))
  return matches.filter((match) => match.id !== current.id && match.rivalId === current.rivalId &&
    (!teamId || match.teamId === teamId) && parseMatchDate(match.date) < cutoff)
    .sort((a, b) => parseMatchDate(b.date).getTime() - parseMatchDate(a.date).getTime() || a.id.localeCompare(b.id))
}
export function matchOutcome(match: Match): 'V' | 'E' | 'D' {
  return match.scoreHome > match.scoreAway ? 'V' : match.scoreHome < match.scoreAway ? 'D' : 'E'
}
export function headToHeadSummary(matches: Match[]) {
  return matches.reduce((summary, match) => {
    summary.played++
    summary[{ V: 'wins', E: 'draws', D: 'losses' }[matchOutcome(match)] as 'wins' | 'draws' | 'losses']++
    summary.goalsFor += match.scoreHome
    summary.goalsAgainst += match.scoreAway
    return summary
  }, { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 })
}
