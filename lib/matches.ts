import type { Match, MatchGoal, MatchSquadEntry, Player } from '@/lib/types'
import { supabase } from '@/lib/supabase'

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

export async function getPlayerCareerStats(): Promise<Record<string, { callUps: number; goals: number }>> {
  const [squadRes, goalRes] = await Promise.all([
    supabase.from('MatchSquad').select('playerId'),
    supabase.from('Goal').select('playerId'),
  ])

  const callUps: Record<string, number> = {}
  for (const row of squadRes.data ?? []) {
    const id = row.playerId as string | null
    if (!id) continue
    callUps[id] = (callUps[id] ?? 0) + 1
  }

  const goals: Record<string, number> = {}
  for (const row of goalRes.data ?? []) {
    const id = row.playerId as string | null
    if (!id) continue
    goals[id] = (goals[id] ?? 0) + 1
  }

  const stats: Record<string, { callUps: number; goals: number }> = {}
  for (const id of new Set([...Object.keys(callUps), ...Object.keys(goals)])) {
    stats[id] = { callUps: callUps[id] ?? 0, goals: goals[id] ?? 0 }
  }
  return stats
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
    myTeam: String(raw.myTeam ?? ''),
    rivalTeam: String(raw.rivalTeam ?? ''),
    myPos: Number(raw.myPos ?? 0),
    rivalPos: Number(raw.rivalPos ?? 0),
    date: String(raw.date ?? ''),
    location: String(raw.location ?? ''),
    scoreHome: Number(raw.scoreHome ?? 0),
    scoreAway: Number(raw.scoreAway ?? 0),
    seasonid: (raw.seasonid as string | null | undefined) ?? null,
    goals,
    squad,
  }
}
