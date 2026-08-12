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
