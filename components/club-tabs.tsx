'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/stat-card'
import { MatchCard } from '@/components/match-card'
import { GoalsChart } from '@/components/charts/goals-chart'
import { ResultsChart } from '@/components/charts/results-chart'
import { MonthlyGoalsChart } from '@/components/charts/monthly-goals-chart'
import { MatchesHistory } from '@/components/matches-history'
import { formatCurrency } from '@/lib/utils'
import {
  Trophy,
  Target,
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  Zap,
  Shield,
  User,
  CalendarRange,
  ScrollText,
  Briefcase,
} from 'lucide-react'
import { useMemo, useState } from 'react'

export interface SeasonInfo {
  id: string
  name: string
  startdate: string
  enddate: string
  active: boolean
}

export interface PlayerRosterEntry {
  id: string
  name: string
  dorsal: number
  positions: string[]
  callUps: number
  goals: number
}

export interface ClubStats {
  clubName: string
  seasonId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase data
  pastMatches: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase data
  futureMatches: any[]
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  topScorers: { name: string; dorsal: number; goals: number }[]
  totalPlayers: number
  totalMatches: number
  monthlyGoals: { month: string; scored: number; conceded: number }[]
  mostCalled: { name: string; count: number } | null
}

export interface DebtEvent {
  name: string
  date: string | null
}

export interface DebtInfo {
  name: string
  dorsal: number
  totalDebt: number
  events: DebtEvent[]
}

interface ClubTabsProps {
  seasons: SeasonInfo[]
  clubStats: ClubStats[]
  /** Full player registry — not filtered by club or season */
  allPlayers: PlayerRosterEntry[]
  debts: DebtInfo[]
  totalTeamDebt: number
  totalPlayers: number
}

function defaultSeasonId(seasons: SeasonInfo[]): string {
  const active = seasons.find((s) => s.active)
  if (active) return active.id
  return seasons[0]?.id ?? ''
}

function formatSeasonRange(season: SeasonInfo): string | null {
  if (!season.startdate || !season.enddate) return null
  const opts: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }
  const start = new Date(season.startdate).toLocaleDateString('es-MX', opts)
  const end = new Date(season.enddate).toLocaleDateString('es-MX', opts)
  return `${start} – ${end}`
}

export function ClubTabs({
  seasons,
  clubStats,
  allPlayers,
  debts,
  totalTeamDebt,
  totalPlayers,
}: ClubTabsProps) {
  const [selectedSeasonId, setSelectedSeasonId] = useState(() => defaultSeasonId(seasons))
  const [selectedClub, setSelectedClub] = useState(() => {
    const initialSeason = defaultSeasonId(seasons)
    const names = clubStats
      .filter((c) => c.seasonId === initialSeason)
      .map((c) => c.clubName)
    return names[0] ?? ''
  })

  const clubsInSeason = useMemo(() => {
    const names = clubStats
      .filter((c) => c.seasonId === selectedSeasonId)
      .map((c) => c.clubName)
    return [...new Set(names)]
  }, [clubStats, selectedSeasonId])

  // Derive a valid club for the current season (avoids setState-in-effect)
  const activeClub = clubsInSeason.includes(selectedClub)
    ? selectedClub
    : (clubsInSeason[0] ?? '')

  const selectedSeason =
    seasons.find((s) => s.id === selectedSeasonId) ?? seasons[0] ?? null

  const currentStats =
    clubStats.find(
      (c) => c.clubName === activeClub && c.seasonId === selectedSeasonId
    ) ?? null

  if (seasons.length === 0 && clubStats.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No hay datos disponibles</p>
  }

  const winRate =
    currentStats && currentStats.totalMatches > 0
      ? Math.round((currentStats.wins / currentStats.totalMatches) * 100)
      : 0

  const seasonRange = selectedSeason ? formatSeasonRange(selectedSeason) : null

  return (
    <div className="space-y-8">
      {/* Filters: Club + Season */}
      <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-4 sm:p-5 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-stretch gap-4 lg:gap-0">
          {/* Club filter */}
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="font-semibold text-sm text-foreground">Club</span>
                <p className="text-[11px] text-muted-foreground leading-none mt-0.5">Equipo</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {clubsInSeason.length === 0 ? (
                <span className="text-sm text-muted-foreground italic">
                  Sin clubes en esta temporada
                </span>
              ) : (
                clubsInSeason.map((clubName) => (
                  <button
                    key={clubName}
                    type="button"
                    onClick={() => setSelectedClub(clubName)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      activeClub === clubName
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted border border-border/50'
                    }`}
                  >
                    {clubName}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Visual separator */}
          <div
            className="hidden lg:block w-px self-stretch bg-gradient-to-b from-transparent via-border to-transparent mx-5"
            aria-hidden
          />
          <div className="lg:hidden h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" aria-hidden />

          {/* Season filter */}
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <div className="p-1.5 rounded-lg bg-violet-500/10">
                <CalendarRange className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <span className="font-semibold text-sm text-foreground">Temporada</span>
                <p className="text-[11px] text-muted-foreground leading-none mt-0.5">Periodo</p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
              {seasons.length === 0 ? (
                <span className="text-sm text-muted-foreground italic">Sin temporadas</span>
              ) : seasons.length <= 4 ? (
                <div className="flex items-center gap-2 flex-wrap">
                  {seasons.map((season) => (
                    <button
                      key={season.id}
                      type="button"
                      onClick={() => setSelectedSeasonId(season.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 border ${
                        selectedSeasonId === season.id
                          ? 'bg-violet-500 text-white border-violet-500 shadow-lg shadow-violet-500/25'
                          : 'bg-violet-500/5 text-violet-700 dark:text-violet-300 border-violet-500/20 hover:bg-violet-500/10'
                      }`}
                    >
                      {season.name}
                      {season.active && (
                        <span
                          className={`ml-1.5 inline-block w-1.5 h-1.5 rounded-full ${
                            selectedSeasonId === season.id ? 'bg-white' : 'bg-violet-500'
                          }`}
                          title="Temporada activa"
                        />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <select
                  value={selectedSeasonId}
                  onChange={(e) => setSelectedSeasonId(e.target.value)}
                  className="w-full sm:max-w-xs h-10 rounded-xl border border-violet-500/30 bg-violet-500/5 px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40 cursor-pointer"
                  aria-label="Seleccionar temporada"
                >
                  {seasons.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.name}
                      {season.active ? ' (activa)' : ''}
                    </option>
                  ))}
                </select>
              )}
              {seasonRange && (
                <p className="text-[11px] text-muted-foreground pl-0.5">{seasonRange}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Competition stats (season-scoped) */}
      {currentStats ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 stagger-children">
            <StatCard
              title="Partidos Jugados"
              value={currentStats.totalMatches}
              subtitle={`${currentStats.wins}V – ${currentStats.draws}E – ${currentStats.losses}D`}
              icon={Calendar}
            />
            <StatCard
              title="Tasa de Victoria"
              value={`${winRate}%`}
              subtitle={currentStats.wins > currentStats.losses ? 'Racha positiva' : 'A mejorar'}
              icon={Trophy}
              trend={currentStats.wins > currentStats.losses ? 'up' : 'down'}
            />
            <StatCard
              title="Goles"
              value={`${currentStats.goalsFor} – ${currentStats.goalsAgainst}`}
              subtitle={`Diferencia: ${currentStats.goalsFor - currentStats.goalsAgainst > 0 ? '+' : ''}${currentStats.goalsFor - currentStats.goalsAgainst}`}
              icon={Target}
              trend={currentStats.goalsFor > currentStats.goalsAgainst ? 'up' : 'down'}
            />
            <StatCard
              title="Jugadores Activos"
              value={currentStats.totalPlayers}
              subtitle={currentStats.mostCalled ? `MVP: ${currentStats.mostCalled.name}` : undefined}
              icon={Users}
            />
          </div>

          {/* Main competition tabs — no Players / Debts */}
          <Tabs defaultValue="matches" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-[560px] h-12">
              <TabsTrigger value="matches" className="gap-1.5">
                <Calendar className="h-4 w-4 hidden sm:block" />
                Partidos
              </TabsTrigger>
              <TabsTrigger value="scorers" className="gap-1.5">
                <Target className="h-4 w-4 hidden sm:block" />
                Goles
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-1.5">
                <TrendingUp className="h-4 w-4 hidden sm:block" />
                Stats
              </TabsTrigger>
              <TabsTrigger value="rivals" className="gap-1.5">
                <Shield className="h-4 w-4 hidden sm:block" />
                Rivales
              </TabsTrigger>
            </TabsList>

            {/* Partidos */}
            <TabsContent value="matches" className="space-y-6 animate-fade-in">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-500/10">
                        <Zap className="h-5 w-5 text-blue-500" />
                      </div>
                      Próximos Partidos
                    </CardTitle>
                    <CardDescription>
                      {currentStats.futureMatches.length} partido(s) programado(s)
                      {selectedSeason ? ` · ${selectedSeason.name}` : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentStats.futureMatches.length === 0 ? (
                      <div className="text-center py-10">
                        <Calendar className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground">No hay partidos programados</p>
                      </div>
                    ) : (
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase data
                      currentStats.futureMatches.slice(0, 3).map((match: any) => (
                        <MatchCard key={match.id} match={match} isPast={false} />
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-yellow-500/10">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                      </div>
                      Últimos Resultados
                    </CardTitle>
                    <CardDescription>
                      Historial de partidos ({currentStats.pastMatches.length} total)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MatchesHistory matches={currentStats.pastMatches} initialCount={5} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Goleadores */}
            <TabsContent value="scorers" className="space-y-6 animate-fade-in">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10">
                        <Target className="h-5 w-5 text-emerald-500" />
                      </div>
                      Tabla de Goleo
                    </CardTitle>
                    <CardDescription>
                      Top goleadores de {currentStats.clubName}
                      {selectedSeason ? ` · ${selectedSeason.name}` : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {currentStats.topScorers.length === 0 ? (
                      <div className="text-center py-10">
                        <Target className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground">No hay goles registrados</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {currentStats.topScorers.map((scorer, index) => (
                          <div
                            key={scorer.name}
                            className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors duration-200"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-transform duration-200 ${
                                  index === 0
                                    ? 'bg-yellow-500/20 text-yellow-500'
                                    : index === 1
                                      ? 'bg-gray-400/20 text-gray-400'
                                      : index === 2
                                        ? 'bg-amber-600/20 text-amber-600'
                                        : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{scorer.name}</p>
                                <p className="text-sm text-muted-foreground">#{scorer.dorsal}</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-lg px-3 font-bold">
                              {scorer.goals} ⚽
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Distribución de Goles</CardTitle>
                    <CardDescription>
                      Goles por jugador en {currentStats.clubName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {currentStats.topScorers.length > 0 ? (
                      <GoalsChart data={currentStats.topScorers.slice(0, 6)} />
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-muted-foreground">Sin datos disponibles</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Estadísticas */}
            <TabsContent value="stats" className="space-y-6 animate-fade-in">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      Resultados Globales
                    </CardTitle>
                    <CardDescription>
                      Victorias, empates y derrotas de {currentStats.clubName}
                      {selectedSeason ? ` · ${selectedSeason.name}` : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResultsChart
                      wins={currentStats.wins}
                      draws={currentStats.draws}
                      losses={currentStats.losses}
                    />
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Goles por Mes</CardTitle>
                    <CardDescription>Evolución de goles a favor y en contra</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {currentStats.monthlyGoals.length > 0 ? (
                      <MonthlyGoalsChart data={currentStats.monthlyGoals} />
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-muted-foreground">Sin datos disponibles</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-3 stagger-children">
                <Card className="glass-card hover-lift">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-emerald-500 tabular-nums">
                        {currentStats.goalsFor}
                      </p>
                      <p className="text-muted-foreground mt-1 font-medium">Goles a Favor</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {currentStats.totalMatches > 0
                          ? (currentStats.goalsFor / currentStats.totalMatches).toFixed(1)
                          : 0}{' '}
                        por partido
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card hover-lift">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-red-500 tabular-nums">
                        {currentStats.goalsAgainst}
                      </p>
                      <p className="text-muted-foreground mt-1 font-medium">Goles en Contra</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {currentStats.totalMatches > 0
                          ? (currentStats.goalsAgainst / currentStats.totalMatches).toFixed(1)
                          : 0}{' '}
                        por partido
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card hover-lift">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p
                        className={`text-4xl font-bold tabular-nums ${
                          currentStats.goalsFor - currentStats.goalsAgainst > 0
                            ? 'text-emerald-500'
                            : currentStats.goalsFor - currentStats.goalsAgainst < 0
                              ? 'text-red-500'
                              : 'text-yellow-500'
                        }`}
                      >
                        {currentStats.goalsFor - currentStats.goalsAgainst > 0 ? '+' : ''}
                        {currentStats.goalsFor - currentStats.goalsAgainst}
                      </p>
                      <p className="text-muted-foreground mt-1 font-medium">Diferencia de Goles</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Rivales */}
            <TabsContent value="rivals" className="space-y-6 animate-fade-in">
              {(() => {
                const allMatches = [
                  ...currentStats.pastMatches,
                  ...currentStats.futureMatches,
                ]
                const opponentMap: Record<
                  string,
                  {
                    displayName: string
                    count: number
                    matches: {
                      date: string
                      scoreHome: number
                      scoreAway: number
                      isPast: boolean
                    }[]
                  }
                > = {}
                allMatches.forEach((m) => {
                  const key = (m.rivalTeam as string)
                    .trim()
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                  if (!opponentMap[key])
                    opponentMap[key] = { displayName: m.rivalTeam, count: 0, matches: [] }
                  opponentMap[key].count++
                  opponentMap[key].matches.push({
                    date: m.date,
                    scoreHome: m.scoreHome,
                    scoreAway: m.scoreAway,
                    isPast: new Date(m.date) < new Date(),
                  })
                })
                const opponents = Object.entries(opponentMap).sort(
                  (a, b) => b[1].count - a[1].count
                )
                const repeated = opponents.filter(([, v]) => v.count > 1)

                return (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="glass-card">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-violet-500/10">
                            <Shield className="h-5 w-5 text-violet-500" />
                          </div>
                          Rivales Enfrentados
                        </CardTitle>
                        <CardDescription>
                          {opponents.length} rival(es) distintos · {allMatches.length} partido(s)
                          total
                          {selectedSeason ? ` · ${selectedSeason.name}` : ''}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {opponents.length === 0 ? (
                          <p className="text-muted-foreground text-sm text-center py-6">
                            Sin partidos registrados
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {opponents.map(([key, data]) => (
                              <div
                                key={key}
                                className="p-3 rounded-xl bg-muted/40 border border-border/30 hover:bg-muted/60 transition-all duration-200"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">{data.displayName}</span>
                                  {data.count > 1 ? (
                                    <Badge variant="destructive" className="text-xs">
                                      {data.count}x repetido
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">
                                      1 vez
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {data.matches
                                    .sort(
                                      (a, b) =>
                                        new Date(a.date).getTime() - new Date(b.date).getTime()
                                    )
                                    .map((m, i) => (
                                      <span
                                        key={i}
                                        className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md"
                                      >
                                        {new Date(m.date).toLocaleDateString('es-MX', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: '2-digit',
                                          timeZone: 'UTC',
                                        })}
                                        {m.isPast && ` · ${m.scoreHome}–${m.scoreAway}`}
                                      </span>
                                    ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="glass-card">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-red-500/10">
                            <Target className="h-5 w-5 text-red-500" />
                          </div>
                          Rivales Repetidos
                        </CardTitle>
                        <CardDescription>
                          {repeated.length === 0
                            ? 'Sin repeticiones aún'
                            : `${repeated.length} rival(es) ya enfrentados más de una vez`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {repeated.length === 0 ? (
                          <p className="text-muted-foreground text-sm text-center py-6">
                            Todos los rivales son nuevos
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {repeated.map(([key, data]) => (
                              <div
                                key={key}
                                className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/20"
                              >
                                <span className="font-medium">{data.displayName}</span>
                                <Badge variant="destructive">{data.count} veces</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )
              })()}
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="text-center py-12 rounded-2xl border border-dashed border-border/60 bg-muted/20">
          <CalendarRange className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">
            No hay estadísticas para esta combinación de club y temporada
          </p>
        </div>
      )}

      {/* ── Team Management (secondary section) ── */}
      <section className="pt-4 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/40">
            <Briefcase className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold tracking-wide text-foreground">
              Gestión del Equipo
            </h2>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
        <p className="text-center text-xs text-muted-foreground -mt-2">
          Plantilla, finanzas y políticas · independientes de club y temporada
        </p>

        <Tabs defaultValue="players" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[480px] h-12 mx-auto">
            <TabsTrigger value="players" className="gap-1.5">
              <Users className="h-4 w-4 hidden sm:block" />
              Jugadores
            </TabsTrigger>
            <TabsTrigger value="debts" className="gap-1.5">
              <DollarSign className="h-4 w-4 hidden sm:block" />
              Deudas
            </TabsTrigger>
            <TabsTrigger value="policies" className="gap-1.5">
              <ScrollText className="h-4 w-4 hidden sm:block" />
              Políticas
            </TabsTrigger>
          </TabsList>

          {/* Jugadores — full registry; not filtered by club or season */}
          <TabsContent value="players" className="space-y-6 animate-fade-in">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  Plantilla
                </CardTitle>
                <CardDescription>
                  {allPlayers.length} jugador(es) activo(s) · registro completo del equipo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allPlayers.length === 0 ? (
                  <div className="text-center py-10">
                    <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">No hay jugadores registrados</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/30 hover:bg-muted/60 hover:border-border/60 transition-all duration-200"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <span className="font-bold text-primary text-lg">
                              #{player.dorsal}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-base">{player.name}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {player.positions.map((pos) => (
                                <Badge key={pos} variant="outline" className="text-xs">
                                  {pos}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="text-muted-foreground text-xs">Convocatorias</p>
                            <p className="font-bold text-base tabular-nums">{player.callUps}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground text-xs">Goles</p>
                            <p className="font-bold text-base text-emerald-500 tabular-nums">
                              {player.goals}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {allPlayers.length > 0 && (
              <div className="grid gap-4 md:grid-cols-3 stagger-children">
                <Card className="glass-card hover-lift">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="inline-flex p-2.5 rounded-xl bg-blue-500/10 mb-3">
                        <User className="h-6 w-6 text-blue-500" />
                      </div>
                      <p className="text-3xl font-bold tabular-nums">{allPlayers.length}</p>
                      <p className="text-muted-foreground mt-1 text-sm">Jugadores Activos</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card hover-lift">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="inline-flex p-2.5 rounded-xl bg-yellow-500/10 mb-3">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                      </div>
                      <p className="text-3xl font-bold tabular-nums">
                        {Math.max(...allPlayers.map((p) => p.callUps), 0)}
                      </p>
                      <p className="text-muted-foreground mt-1 text-sm">Máx. Convocatorias</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card hover-lift">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="inline-flex p-2.5 rounded-xl bg-emerald-500/10 mb-3">
                        <Target className="h-6 w-6 text-emerald-500" />
                      </div>
                      <p className="text-3xl font-bold tabular-nums">
                        {allPlayers.reduce((acc, p) => acc + p.goals, 0)}
                      </p>
                      <p className="text-muted-foreground mt-1 text-sm">Goles en Plantilla</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Deudas — not season-specific */}
          <TabsContent value="debts" className="space-y-6 animate-fade-in">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2 glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10">
                      <DollarSign className="h-5 w-5 text-amber-500" />
                    </div>
                    Tabla de Deudas
                  </CardTitle>
                  <CardDescription>
                    Jugadores con pagos pendientes (todos los clubes)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {debts.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="text-4xl mb-3">🎉</div>
                      <p className="text-emerald-500 font-semibold text-lg">¡Todos al corriente!</p>
                      <p className="text-muted-foreground text-sm mt-1">
                        No hay deudas pendientes
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {debts.map((debt) => (
                        <div
                          key={debt.name}
                          className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/30 hover:bg-muted/60 transition-all duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                              <span className="font-bold text-amber-500 text-sm">
                                #{debt.dorsal}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{debt.name}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {debt.events.map((event) => (
                                  <Badge key={event.name} variant="outline" className="text-xs">
                                    {event.name}
                                    {event.date && (
                                      <span className="ml-1 text-muted-foreground">
                                        {new Date(event.date).toLocaleDateString('es-MX', {
                                          day: '2-digit',
                                          month: 'short',
                                          timeZone: 'UTC',
                                        })}
                                      </span>
                                    )}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-red-500 tabular-nums">
                              {formatCurrency(debt.totalDebt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Resumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center p-5 rounded-xl bg-red-500/10 border border-red-500/15">
                    <p className="text-sm text-muted-foreground">Deuda Total del Equipo</p>
                    <p className="text-3xl font-bold text-red-500 mt-1 tabular-nums">
                      {formatCurrency(totalTeamDebt)}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Jugadores con deuda</span>
                      <span className="font-semibold tabular-nums">{debts.length}</span>
                    </div>
                    <div className="h-px bg-border/50" />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Jugadores al corriente</span>
                      <span className="font-semibold text-emerald-500 tabular-nums">
                        {totalPlayers - debts.length}
                      </span>
                    </div>
                    <div className="h-px bg-border/50" />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Deuda promedio</span>
                      <span className="font-semibold tabular-nums">
                        {debts.length > 0
                          ? formatCurrency(totalTeamDebt / debts.length)
                          : formatCurrency(0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Team Policies — placeholder for future content */}
          <TabsContent value="policies" className="space-y-6 animate-fade-in">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sky-500/10">
                    <ScrollText className="h-5 w-5 text-sky-500" />
                  </div>
                  Políticas del Equipo
                </CardTitle>
                <CardDescription>
                  Normas, acuerdos y lineamientos del club
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-14">
                  <ScrollText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground font-medium">Próximamente</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                    Aquí se publicarán las políticas y acuerdos del equipo.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}
