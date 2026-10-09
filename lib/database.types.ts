// Regenerated from Supabase after phase2_players_rivals_goals (20261008235036).
// Formatting condensed; CHECK text narrowed to unions and nullable RPC arguments
// refined manually. Generated normalized_name typing permits strings; SQL forbids writes.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type PlayerPosition = 'GK' | 'CB' | 'WB' | 'DM' | 'CM' | 'AM' | 'W' | 'ST'
export type PreferredSide = 'L' | 'R' | 'C' | 'ANY'
export type PlayerFoot = 'L' | 'R' | 'BOTH'
export type GoalKind = 'player' | 'own_goal' | 'unknown'

export type Database = {
  __InternalSupabase: { PostgrestVersion: '14.5' }
  public: {
    Tables: {
      club_settings: {
        Row: { account: string | null; bank: string | null; clabe: string | null; id: number; phone: string | null; weekly_fee: number | null }
        Insert: { account?: string | null; bank?: string | null; clabe?: string | null; id: number; phone?: string | null; weekly_fee?: number | null }
        Update: { account?: string | null; bank?: string | null; clabe?: string | null; id?: number; phone?: string | null; weekly_fee?: number | null }
        Relationships: []
      }
      Event: {
        Row: { cost: number; date: string; id: string; name: string; seasonid: string }
        Insert: { cost: number; date: string; id?: string; name: string; seasonid: string }
        Update: { cost?: number; date?: string; id?: string; name?: string; seasonid?: string }
        Relationships: [{ foreignKeyName: 'event_seasonid_fkey'; columns: ['seasonid']; isOneToOne: false; referencedRelation: 'season'; referencedColumns: ['id'] }]
      }
      Goal: {
        Row: { id: string; kind: GoalKind; matchId: string; minute: number | null; playerId: string | null }
        Insert: { id?: string; kind?: GoalKind; matchId: string; minute?: number | null; playerId?: string | null }
        Update: { id?: string; kind?: GoalKind; matchId?: string; minute?: number | null; playerId?: string | null }
        Relationships: [
          { foreignKeyName: 'Goal_matchId_fkey'; columns: ['matchId']; isOneToOne: false; referencedRelation: 'Match'; referencedColumns: ['id'] },
          { foreignKeyName: 'Goal_matchId_fkey'; columns: ['matchId']; isOneToOne: false; referencedRelation: 'v_match'; referencedColumns: ['id'] },
          { foreignKeyName: 'Goal_playerId_fkey'; columns: ['playerId']; isOneToOne: false; referencedRelation: 'Player'; referencedColumns: ['id'] },
        ]
      }
      kickoff_slot: {
        Row: { time: string }
        Insert: { time: string }
        Update: { time?: string }
        Relationships: []
      }
      Match: {
        Row: { date: string; id: string; kit: number; location: string; myPos: number; myTeam: string; rivalId: string; rivalPos: number; rivalTeam: string; schedule_override: boolean; scoreAway: number; scoreHome: number; seasonid: string; teamId: string }
        Insert: { date: string; id?: string; kit?: number; location: string; myPos: number; myTeam: string; rivalId: string; rivalPos: number; rivalTeam: string; schedule_override?: boolean; scoreAway?: number; scoreHome?: number; seasonid: string; teamId: string }
        Update: { date?: string; id?: string; kit?: number; location?: string; myPos?: number; myTeam?: string; rivalId?: string; rivalPos?: number; rivalTeam?: string; schedule_override?: boolean; scoreAway?: number; scoreHome?: number; seasonid?: string; teamId?: string }
        Relationships: [
          { foreignKeyName: 'match_seasonid_fkey'; columns: ['seasonid']; isOneToOne: false; referencedRelation: 'season'; referencedColumns: ['id'] },
          { foreignKeyName: 'Match_teamId_fkey'; columns: ['teamId']; isOneToOne: false; referencedRelation: 'team'; referencedColumns: ['id'] },
          { foreignKeyName: 'Match_rivalId_fkey'; columns: ['rivalId']; isOneToOne: false; referencedRelation: 'rival'; referencedColumns: ['id'] },
          { foreignKeyName: 'Match_rivalId_fkey'; columns: ['rivalId']; isOneToOne: false; referencedRelation: 'v_match'; referencedColumns: ['rival_id'] },
        ]
      }
      MatchSquad: {
        Row: { id: string; matchId: string; playerId: string }
        Insert: { id?: string; matchId: string; playerId: string }
        Update: { id?: string; matchId?: string; playerId?: string }
        Relationships: [
          { foreignKeyName: 'MatchSquad_matchId_fkey'; columns: ['matchId']; isOneToOne: false; referencedRelation: 'Match'; referencedColumns: ['id'] },
          { foreignKeyName: 'MatchSquad_matchId_fkey'; columns: ['matchId']; isOneToOne: false; referencedRelation: 'v_match'; referencedColumns: ['id'] },
          { foreignKeyName: 'MatchSquad_playerId_fkey'; columns: ['playerId']; isOneToOne: false; referencedRelation: 'Player'; referencedColumns: ['id'] },
        ]
      }
      Payment: {
        Row: { eventId: string; id: string; paid: boolean; playerId: string }
        Insert: { eventId: string; id?: string; paid?: boolean; playerId: string }
        Update: { eventId?: string; id?: string; paid?: boolean; playerId?: string }
        Relationships: [
          { foreignKeyName: 'Payment_eventId_fkey'; columns: ['eventId']; isOneToOne: false; referencedRelation: 'Event'; referencedColumns: ['id'] },
          { foreignKeyName: 'Payment_playerId_fkey'; columns: ['playerId']; isOneToOne: false; referencedRelation: 'Player'; referencedColumns: ['id'] },
        ]
      }
      Player: {
        Row: { active: boolean; createdAt: string; dorsal: number; foot: PlayerFoot | null; id: string; name: string; nickname: string | null; positions: string[] | null; preferred_side: PreferredSide; primary_position: PlayerPosition | null; secondary_positions: PlayerPosition[] }
        Insert: { active?: boolean; createdAt?: string; dorsal: number; foot?: PlayerFoot | null; id?: string; name: string; nickname?: string | null; positions?: string[] | null; preferred_side?: PreferredSide; primary_position?: PlayerPosition | null; secondary_positions?: PlayerPosition[] }
        Update: { active?: boolean; createdAt?: string; dorsal?: number; foot?: PlayerFoot | null; id?: string; name?: string; nickname?: string | null; positions?: string[] | null; preferred_side?: PreferredSide; primary_position?: PlayerPosition | null; secondary_positions?: PlayerPosition[] }
        Relationships: []
      }
      player_team: {
        Row: { player_id: string; team_id: string }
        Insert: { player_id: string; team_id: string }
        Update: { player_id?: string; team_id?: string }
        Relationships: [
          { foreignKeyName: 'player_team_player_id_fkey'; columns: ['player_id']; isOneToOne: false; referencedRelation: 'Player'; referencedColumns: ['id'] },
          { foreignKeyName: 'player_team_team_id_fkey'; columns: ['team_id']; isOneToOne: false; referencedRelation: 'team'; referencedColumns: ['id'] },
        ]
      }
      rival: {
        Row: { id: string; name: string; normalized_name: string; slug: string }
        Insert: { id?: string; name: string; normalized_name?: string; slug: string }
        Update: { id?: string; name?: string; normalized_name?: string; slug?: string }
        Relationships: []
      }
      season: {
        Row: { active: boolean; enddate: string; id: string; name: string; startdate: string }
        Insert: { active?: boolean; enddate: string; id?: string; name: string; startdate: string }
        Update: { active?: boolean; enddate?: string; id?: string; name?: string; startdate?: string }
        Relationships: []
      }
      team: {
        Row: { id: string; league_name: string | null; match_weekday: number; name: string; slug: string; sort_order: number }
        Insert: { id?: string; league_name?: string | null; match_weekday: number; name: string; slug: string; sort_order?: number }
        Update: { id?: string; league_name?: string | null; match_weekday?: number; name?: string; slug?: string; sort_order?: number }
        Relationships: []
      }
    }
    Views: {
      v_head_to_head: {
        Row: { draws: number | null; goals_against: number | null; goals_for: number | null; last_played: string | null; losses: number | null; played: number | null; rival_id: string | null; team_id: string | null; wins: number | null }
        Relationships: [
          { foreignKeyName: 'Match_teamId_fkey'; columns: ['team_id']; isOneToOne: false; referencedRelation: 'team'; referencedColumns: ['id'] },
          { foreignKeyName: 'Match_rivalId_fkey'; columns: ['rival_id']; isOneToOne: false; referencedRelation: 'rival'; referencedColumns: ['id'] },
          { foreignKeyName: 'Match_rivalId_fkey'; columns: ['rival_id']; isOneToOne: false; referencedRelation: 'v_match'; referencedColumns: ['rival_id'] },
        ]
      }
      v_match: {
        Row: { date: string | null; id: string | null; kickoff_local: string | null; kickoff_slot: string | null; kickoff_weekday: number | null; kit: number | null; location: string | null; myPos: number | null; myTeam: string | null; rival_id: string | null; rival_name: string | null; rival_slug: string | null; rivalId: string | null; rivalPos: number | null; rivalTeam: string | null; schedule_override: boolean | null; scoreAway: number | null; scoreHome: number | null; seasonid: string | null; team_name: string | null; team_slug: string | null; teamId: string | null }
        Relationships: [
          { foreignKeyName: 'match_seasonid_fkey'; columns: ['seasonid']; isOneToOne: false; referencedRelation: 'season'; referencedColumns: ['id'] },
          { foreignKeyName: 'Match_teamId_fkey'; columns: ['teamId']; isOneToOne: false; referencedRelation: 'team'; referencedColumns: ['id'] },
          { foreignKeyName: 'Match_rivalId_fkey'; columns: ['rivalId']; isOneToOne: false; referencedRelation: 'rival'; referencedColumns: ['id'] },
          { foreignKeyName: 'Match_rivalId_fkey'; columns: ['rivalId']; isOneToOne: false; referencedRelation: 'v_match'; referencedColumns: ['rival_id'] },
        ]
      }
      v_player_debt: {
        Row: { dorsal: number | null; events: Json | null; id: string | null; name: string | null; total_debt: number | null }
        Relationships: []
      }
      v_player_stats: {
        Row: { call_ups: number | null; goals: number | null; player_id: string | null; season_id: string | null; team_id: string | null }
        Relationships: []
      }
      v_team_season_monthly: {
        Row: { conceded: number | null; month: string | null; scored: number | null; season_id: string | null; team_id: string | null }
        Relationships: [
          { foreignKeyName: 'match_seasonid_fkey'; columns: ['season_id']; isOneToOne: false; referencedRelation: 'season'; referencedColumns: ['id'] },
          { foreignKeyName: 'Match_teamId_fkey'; columns: ['team_id']; isOneToOne: false; referencedRelation: 'team'; referencedColumns: ['id'] },
        ]
      }
      v_team_season_stats: {
        Row: { draws: number | null; goals_against: number | null; goals_for: number | null; losses: number | null; played: number | null; season_id: string | null; team_id: string | null; wins: number | null }
        Relationships: [
          { foreignKeyName: 'match_seasonid_fkey'; columns: ['season_id']; isOneToOne: false; referencedRelation: 'season'; referencedColumns: ['id'] },
          { foreignKeyName: 'Match_teamId_fkey'; columns: ['team_id']; isOneToOne: false; referencedRelation: 'team'; referencedColumns: ['id'] },
        ]
      }
    }
    Functions: {
      add_goal: { Args: { p_match_id: string; p_player_id?: string | null; p_kind?: GoalKind; p_minute?: number | null }; Returns: string }
      create_event_with_payments: { Args: { p_cost: number; p_date: string; p_name: string; p_season_id: string }; Returns: string }
      get_public_player_debts: { Args: never; Returns: { dorsal: number; events: Json; id: string; name: string; total_debt: number }[] }
      is_admin: { Args: never; Returns: boolean }
      normalize_rival_name: { Args: { p_name: string }; Returns: string }
      player_position_code: { Args: { p_label: string }; Returns: string }
      player_position_codes: { Args: { p_labels: string[] }; Returns: string[] }
      player_position_side: { Args: { p_labels: string[] }; Returns: string }
      remove_goal: { Args: { p_goal_id: string }; Returns: undefined }
      save_match: { Args: { p_match: Json; p_player_ids: string[] }; Returns: string }
      save_player: { Args: { p_player: Json; p_team_ids?: string[] | null }; Returns: string }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views']) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views']) : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends { Row: infer R } ? R : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends { Row: infer R } ? R : never : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends { Insert: infer I } ? I : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends { Insert: infer I } ? I : never : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends { Update: infer U } ? U : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends { Update: infer U } ? U : never : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'] : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions] : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'] : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes'] ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions] : never

export const Constants = { public: { Enums: {} } } as const
