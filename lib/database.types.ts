// Generated from Supabase after club_contract (20261007024919); formatting condensed.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

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
        Row: { id: string; matchId: string; minute: number | null; playerId: string }
        Insert: { id?: string; matchId: string; minute?: number | null; playerId: string }
        Update: { id?: string; matchId?: string; minute?: number | null; playerId?: string }
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
        Row: { date: string; id: string; kit: number; location: string; myPos: number; myTeam: string; rivalPos: number; rivalTeam: string; schedule_override: boolean; scoreAway: number; scoreHome: number; seasonid: string; teamId: string }
        Insert: { date: string; id?: string; kit?: number; location: string; myPos: number; myTeam: string; rivalPos: number; rivalTeam: string; schedule_override?: boolean; scoreAway?: number; scoreHome?: number; seasonid: string; teamId: string }
        Update: { date?: string; id?: string; kit?: number; location?: string; myPos?: number; myTeam?: string; rivalPos?: number; rivalTeam?: string; schedule_override?: boolean; scoreAway?: number; scoreHome?: number; seasonid?: string; teamId?: string }
        Relationships: [
          { foreignKeyName: 'match_seasonid_fkey'; columns: ['seasonid']; isOneToOne: false; referencedRelation: 'season'; referencedColumns: ['id'] },
          { foreignKeyName: 'Match_teamId_fkey'; columns: ['teamId']; isOneToOne: false; referencedRelation: 'team'; referencedColumns: ['id'] },
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
        Row: { active: boolean; createdAt: string; dorsal: number; id: string; name: string; positions: string[] | null }
        Insert: { active?: boolean; createdAt?: string; dorsal: number; id?: string; name: string; positions?: string[] | null }
        Update: { active?: boolean; createdAt?: string; dorsal?: number; id?: string; name?: string; positions?: string[] | null }
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
      v_match: {
        Row: { date: string | null; id: string | null; kickoff_local: string | null; kickoff_slot: string | null; kickoff_weekday: number | null; kit: number | null; location: string | null; myPos: number | null; myTeam: string | null; rivalPos: number | null; rivalTeam: string | null; schedule_override: boolean | null; scoreAway: number | null; scoreHome: number | null; seasonid: string | null; team_name: string | null; team_slug: string | null; teamId: string | null }
        Relationships: [
          { foreignKeyName: 'match_seasonid_fkey'; columns: ['seasonid']; isOneToOne: false; referencedRelation: 'season'; referencedColumns: ['id'] },
          { foreignKeyName: 'Match_teamId_fkey'; columns: ['teamId']; isOneToOne: false; referencedRelation: 'team'; referencedColumns: ['id'] },
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
      create_event_with_payments: { Args: { p_cost: number; p_date: string; p_name: string; p_season_id: string }; Returns: string }
      get_public_player_debts: { Args: never; Returns: { dorsal: number; events: Json; id: string; name: string; total_debt: number }[] }
      is_admin: { Args: never; Returns: boolean }
      save_match: { Args: { p_match: Json; p_player_ids: string[] }; Returns: string }
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
