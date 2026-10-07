import type { Match, Player, PlayerStats, Season } from './types.ts'
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
