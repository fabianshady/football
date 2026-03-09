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
} from 'lucide-react'
import { useState } from 'react'

export interface ClubStats {
  clubName: string
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
  players: { id: string; name: string; dorsal: number; positions: string[]; callUps: number; goals: number }[]
}

export interface DebtInfo {
  name: string
  dorsal: number
  totalDebt: number
  events: string[]
}

interface ClubTabsProps {
  clubStats: ClubStats[]
  debts: DebtInfo[]
  totalTeamDebt: number
  totalPlayers: number
}

export function ClubTabs({ clubStats, debts, totalTeamDebt, totalPlayers }: ClubTabsProps) {
  const [selectedClub, setSelectedClub] = useState(clubStats[0]?.clubName ?? '')

  const currentStats = clubStats.find((c) => c.clubName === selectedClub) ?? clubStats[0]

  if (!currentStats) {
    return <p className="text-muted-foreground text-center py-8">No hay datos de clubes</p>
  }

  const winRate =
    currentStats.totalMatches > 0
      ? Math.round((currentStats.wins / currentStats.totalMatches) * 100)
      : 0

  return (
    <div className="space-y-8">
      {/* Club Selector */}
      {clubStats.length > 1 && (
        <div className="flex items-center gap-3 flex-wrap animate-fade-in">
          <div className="flex items-center gap-2 mr-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-medium text-sm text-muted-foreground">Club:</span>
          </div>
          {clubStats.map((club) => (
            <button
              key={club.clubName}
              onClick={() => setSelectedClub(club.clubName)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${selectedClub === club.clubName
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted border border-border/50'
                }`}
            >
              {club.clubName}
            </button>
          ))}
        </div>
      )}

      {/* Stats Grid */}
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

      {/* Main Tabs */}
      <Tabs defaultValue="matches" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-[650px] h-12">
          <TabsTrigger value="matches" className="gap-1.5">
            <Calendar className="h-4 w-4 hidden sm:block" />
            Partidos
          </TabsTrigger>
          <TabsTrigger value="scorers" className="gap-1.5">
            <Target className="h-4 w-4 hidden sm:block" />
            Goleadores
          </TabsTrigger>
          <TabsTrigger value="players" className="gap-1.5">
            <Users className="h-4 w-4 hidden sm:block" />
            Jugadores
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-1.5">
            <TrendingUp className="h-4 w-4 hidden sm:block" />
            Estadísticas
          </TabsTrigger>
          <TabsTrigger value="debts" className="gap-1.5">
            <DollarSign className="h-4 w-4 hidden sm:block" />
            Deudas
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
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentStats.futureMatches.length === 0 ? (
                  <div className="text-center py-10">
                    <Calendar className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">
                      No hay partidos programados
                    </p>
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
                <CardDescription>Top goleadores de {currentStats.clubName}</CardDescription>
              </CardHeader>
              <CardContent>
                {currentStats.topScorers.length === 0 ? (
                  <div className="text-center py-10">
                    <Target className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">
                      No hay goles registrados
                    </p>
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
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-transform duration-200 ${index === 0
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
                <CardDescription>Goles por jugador en {currentStats.clubName}</CardDescription>
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

        {/* Jugadores */}
        <TabsContent value="players" className="space-y-6 animate-fade-in">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                Plantilla de {currentStats.clubName}
              </CardTitle>
              <CardDescription>
                {currentStats.players.length} jugador(es) activo(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentStats.players.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">
                    No hay jugadores activos
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {currentStats.players
                    .sort((a, b) => a.dorsal - b.dorsal)
                    .map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/30 hover:bg-muted/60 hover:border-border/60 transition-all duration-200"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <span className="font-bold text-primary text-lg">#{player.dorsal}</span>
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
                            <p className="font-bold text-base text-emerald-500 tabular-nums">{player.goals}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estadísticas de jugadores */}
          {currentStats.players.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3 stagger-children">
              <Card className="glass-card hover-lift">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="inline-flex p-2.5 rounded-xl bg-blue-500/10 mb-3">
                      <User className="h-6 w-6 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold tabular-nums">{currentStats.players.length}</p>
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
                      {Math.max(...currentStats.players.map((p) => p.callUps), 0)}
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
                      {currentStats.players.reduce((acc, p) => acc + p.goals, 0)}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">Goles en Plantilla</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
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
                  <p className="text-4xl font-bold text-emerald-500 tabular-nums">{currentStats.goalsFor}</p>
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
                  <p className="text-4xl font-bold text-red-500 tabular-nums">{currentStats.goalsAgainst}</p>
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
                    className={`text-4xl font-bold tabular-nums ${currentStats.goalsFor - currentStats.goalsAgainst > 0
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

        {/* Deudas - Shared across clubs */}
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
                <CardDescription>Jugadores con pagos pendientes (todos los clubes)</CardDescription>
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
                            <span className="font-bold text-amber-500 text-sm">#{debt.dorsal}</span>
                          </div>
                          <div>
                            <p className="font-medium">{debt.name}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {debt.events.map((event) => (
                                <Badge key={event} variant="outline" className="text-xs">
                                  {event}
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
      </Tabs>
    </div>
  )
}
