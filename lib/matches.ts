import type { Match, MatchGoal, MatchSquadEntry, Player } from './types.ts'

function mapPlayer(raw: Record<string, unknown> | null | undefined): Player | null {
  if (!raw || typeof raw.id !== 'string') return null
  return {
    id: raw.id,
    name: String(raw.name ?? ''),
    dorsal: Number(raw.dorsal ?? 0),
    positions: Array.isArray(raw.positions) ? (raw.positions as string[]) : [],
    callUps: typeof raw.callUps === 'number' ? raw.callUps : undefined,
    goals: typeof raw.goals === 'number' ? raw.goals : undefined,
  }
}

export function applyPlayerStats(
  match: Match,
  stats: Record<string, { callUps: number; goals: number }>
): Match {
  return {
    ...match,
    squad: (match.squad ?? []).map((entry) => ({
      ...entry,
      player: {
        ...entry.player,
        callUps: stats[entry.player.id]?.callUps ?? 0,
        goals: stats[entry.player.id]?.goals ?? 0,
      },
    })),
  }
}

export function mapRawMatch(raw: Record<string, unknown>): Match {
  const goals: MatchGoal[] = []
  const rawGoals = (raw.Goal ?? raw.goals) as Array<Record<string, unknown>> | undefined
  for (const g of rawGoals ?? []) {
    const player = mapPlayer((g.Player ?? g.player) as Record<string, unknown>)
    if (!player) continue
    goals.push({
      playerId: String(g.playerId ?? player.id),
      player,
    })
  }

  const squad: MatchSquadEntry[] = []
  const rawSquad = (raw.MatchSquad ?? raw.squad) as Array<Record<string, unknown>> | undefined
  for (const s of rawSquad ?? []) {
    const player = mapPlayer((s.Player ?? s.player) as Record<string, unknown>)
    if (!player) continue
    squad.push({
      playerId: String(s.playerId ?? player.id),
      player,
    })
  }

  return {
    id: String(raw.id),
    teamId: typeof raw.teamId === 'string' ? raw.teamId : undefined,
    teamSlug: typeof raw.team_slug === 'string' ? raw.team_slug : undefined,
    scheduleOverride: raw.schedule_override === true,
    myTeam: String(raw.team_name ?? raw.myTeam ?? ''),
    rivalTeam: String(raw.rivalTeam ?? ''),
    myPos: Number(raw.myPos ?? 0),
    rivalPos: Number(raw.rivalPos ?? 0),
    date: String(raw.date ?? ''),
    location: String(raw.location ?? ''),
    scoreHome: Number(raw.scoreHome ?? 0),
    scoreAway: Number(raw.scoreAway ?? 0),
    kit: raw.kit == null || raw.kit === '' ? null : Number(raw.kit),
    seasonid: (raw.seasonid as string | null | undefined) ?? null,
    goals,
    squad,
  }
}
