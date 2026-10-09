import 'server-only'
import { cache } from 'react'
import { supabase } from '@/lib/supabase'
import { mapPlayer, mapRawMatch } from '@/lib/matches'
import { headToHeadCutoff } from '@/lib/public'
import type { ClubSettings, MonthlyGoals, Player, PlayerDebt, PlayerStats, Season, SeasonStats, Team } from '@/lib/types'

export const dataConfigured = Boolean(supabase)

function requireClient() {
  if (!supabase) throw new Error('La conexión de datos no está configurada.')
  return supabase
}

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(`No se pudieron obtener los datos: ${error.message}`)
  if (data === null) throw new Error('La consulta no devolvió una respuesta válida.')
  return data
}

export const getTeams = cache(async () => unwrap(await requireClient().from('team').select('*').order('sort_order').returns<Team[]>()))
export const getSeasons = cache(async () => unwrap(await requireClient().from('season').select('*').order('startdate', { ascending: false }).returns<Season[]>()))
export const getPlayers = cache(async (activeOnly = true) => {
  let query = requireClient().from('Player').select('*, player_team(team_id)').order('dorsal')
  if (activeOnly) query = query.eq('active', true)
  return unwrap(await query.returns<Record<string, unknown>[]>()).map((raw) => mapPlayer(raw)!)
})
export const getPlayer = cache(async (id: string): Promise<Player | null> => {
  const response = await requireClient().from('Player').select('*, player_team(team_id)').eq('id', id).maybeSingle<Record<string, unknown>>()
  if (response.error) throw new Error(response.error.message)
  return mapPlayer(response.data)
})
export const getPlayerStats = cache(async () => unwrap(await requireClient().from('v_player_stats').select('*').returns<PlayerStats[]>()))
export const getDebts = cache(async () => unwrap(await requireClient().from('v_player_debt').select('*').order('total_debt', { ascending: false }).returns<PlayerDebt[]>()))
export const getSettings = cache(async () => {
  const response = await requireClient().from('club_settings').select('*').eq('id', 1).maybeSingle<ClubSettings>()
  if (response.error) throw new Error(response.error.message)
  return response.data
})

export const getMatches = cache(async (teamId?: string, seasonId?: string) => {
  let query = requireClient().from('v_match').select('*').order('date', { ascending: false })
  if (teamId) query = query.eq('teamId', teamId)
  if (seasonId) query = query.eq('seasonid', seasonId)
  return unwrap(await query.returns<Record<string, unknown>[]>()).map(mapRawMatch)
})

export const getSeasonStats = cache(async (teamId: string, seasonId: string) => {
  const response = await requireClient().from('v_team_season_stats').select('*').eq('team_id', teamId).eq('season_id', seasonId).maybeSingle<SeasonStats>()
  if (response.error) throw new Error(response.error.message)
  return response.data
})
export const getMonthlyGoals = cache(async (teamId: string, seasonId: string) => unwrap(await requireClient().from('v_team_season_monthly').select('*').eq('team_id', teamId).eq('season_id', seasonId).order('month').returns<MonthlyGoals[]>()))

export const getMatch = cache(async (id: string) => {
  const response = await requireClient().from('Match').select('*, Goal(*, Player(*)), MatchSquad(*, Player(*))').eq('id', id).maybeSingle<Record<string, unknown>>()
  if (response.error) throw new Error(response.error.message)
  if (!response.data) return null
  const match = mapRawMatch(response.data)
  const [teams, identity] = await Promise.all([
    getTeams(),
    requireClient().from('v_match').select('*').eq('id', id).maybeSingle<Record<string, unknown>>(),
  ])
  if (identity.error) throw new Error(identity.error.message)
  const team = teams.find((item) => item.id === match.teamId)
  return { ...match, ...(identity.data ? mapRawMatch({ ...response.data, ...identity.data }) : {}), myTeam: team?.name ?? match.myTeam, teamSlug: team?.slug }
})

/** v_head_to_head is an all-time aggregate and cannot answer a historical reference time.
 * Compute summaries from these date-bounded v_match rows instead (past date is the completion heuristic).
 */
export const getHeadToHead = cache(async (rivalId: string, currentId: string, currentDate: string, teamId?: string, now = new Date().toISOString()) => {
  let query = requireClient().from('v_match').select('*').eq('rivalId', rivalId)
    .neq('id', currentId).lt('date', headToHeadCutoff(currentDate, new Date(now))).order('date', { ascending: false }).order('id')
  if (teamId) query = query.eq('teamId', teamId)
  return unwrap(await query.returns<Record<string, unknown>[]>()).map(mapRawMatch)
})
