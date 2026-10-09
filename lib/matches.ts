import type { Match, MatchGoal, MatchSquadEntry, Player, PlayerPosition, PlayerFoot, PreferredSide } from './types.ts'

export function mapPlayer(raw: Record<string, unknown> | null | undefined): Player | null {
  if (!raw || typeof raw.id !== 'string') return null
  return {
    id: raw.id,
    name: String(raw.name ?? ''),
    dorsal: Number(raw.dorsal ?? 0),
    positions: Array.isArray(raw.positions) ? (raw.positions as string[]) : [],
    nickname: raw.nickname == null ? null : String(raw.nickname),
    // Preserve absence for legacy callers; explicit null is a canonical unclassified player.
    ...(raw.primary_position !== undefined ? { primary_position: raw.primary_position as PlayerPosition | null } : {}),
    ...(raw.secondary_positions !== undefined ? { secondary_positions: raw.secondary_positions as PlayerPosition[] } : {}),
    ...(raw.preferred_side !== undefined ? { preferred_side: raw.preferred_side as PreferredSide } : {}),
    foot: (raw.foot as PlayerFoot | null | undefined) ?? null,
    active: typeof raw.active === 'boolean' ? raw.active : undefined,
    teamIds: Array.isArray(raw.player_team)
      ? raw.player_team.map((membership: { team_id: string }) => membership.team_id)
      : Array.isArray(raw.teamIds) ? raw.teamIds as string[] : [],
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
    goals.push({
      id: typeof g.id === 'string' ? g.id : undefined,
      kind: (g.kind as MatchGoal['kind']) ?? 'player',
      minute: g.minute == null ? null : Number(g.minute),
      playerId: g.playerId == null ? player?.id ?? null : String(g.playerId),
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
    rivalTeam: String(raw.rival_name ?? raw.rivalTeam ?? ''),
    rivalId: typeof (raw.rival_id ?? raw.rivalId) === 'string' ? String(raw.rival_id ?? raw.rivalId) : undefined,
    rivalSlug: typeof raw.rival_slug === 'string' ? raw.rival_slug : undefined,
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
