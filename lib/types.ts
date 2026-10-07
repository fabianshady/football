export type FieldSide = 'L' | 'R' | 'C'

export interface Player {
  id: string
  name: string
  dorsal: number
  positions: string[]
  callUps?: number
  goals?: number
}

export interface MatchGoal {
  playerId: string
  player: Player
}

export interface MatchSquadEntry {
  playerId?: string
  player: Player
}

export interface Match {
  id: string
  teamId?: string
  teamSlug?: string
  scheduleOverride?: boolean
  myTeam: string
  rivalTeam: string
  myPos: number
  rivalPos: number
  date: string
  location: string
  scoreHome: number
  scoreAway: number
  kit?: number | null
  seasonid?: string | null
  goals?: MatchGoal[]
  squad?: MatchSquadEntry[]
}

export type OpponentStrength = 'strong' | 'mid' | 'weak'
export type FieldRole = 'gk' | 'def' | 'mid' | 'fwd'

export interface Team { id: string; slug: string; name: string; match_weekday: number; league_name: string | null; sort_order: number }
export interface Season { id: string; name: string; active: boolean; startdate: string; enddate: string }
export interface SeasonStats { team_id: string; season_id: string; played: number; wins: number; draws: number; losses: number; goals_for: number; goals_against: number }
export interface MonthlyGoals { team_id: string; season_id: string; month: string; scored: number; conceded: number }
export interface PlayerStats { player_id: string; team_id: string; season_id: string; call_ups: number; goals: number }
export interface ClubSettings { id: number; phone: string | null; clabe: string | null; account: string | null; bank: string | null; weekly_fee: number | string | null }
export interface PlayerDebt { id: string; name: string; dorsal: number; total_debt: number | string; events: { name: string; date: string | null; cost: number | string }[] }
