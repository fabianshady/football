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
} from 'lucide-react'
import { useState } from 'react'

export interface ClubStats {
  clubName: string
  pastMatches: any[]
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
    <div className="space-y-6">
      {/* Club Selector */}
      {clubStats.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-medium text-sm text-muted-foreground mr-2">Club:</span>
          {clubStats.map((club) => (
            <button
              key={club.clubName}
              onClick={() => setSelectedClub(club.clubName)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedClub === club.clubName
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {club.clubName}
            </button>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Partidos Jugados"
          value={currentStats.totalMatches}
          subtitle={`${currentStats.wins}V - ${currentStats.draws}E - ${currentStats.losses}D`}
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
          value={`${currentStats.goalsFor} - ${currentStats.goalsAgainst}`}
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
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="matches">Partidos</TabsTrigger>
          <TabsTrigger value="scorers">Goleadores</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          <TabsTrigger value="debts">Deudas</TabsTrigger>
        </TabsList>

        {/* Partidos */}
        <TabsContent value="matches" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  Próximos Partidos
                </CardTitle>
                <CardDescription>
                  {currentStats.futureMatches.length} partido(s) programado(s)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentStats.futureMatches.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No hay partidos programados
                  </p>
                ) : (
                  currentStats.futureMatches.slice(0, 3).map((match: any) => (
                    <MatchCard key={match.id} match={match} isPast={false} />
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
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
        <TabsContent value="scorers" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-500" />
                  Tabla de Goleo
                </CardTitle>
                <CardDescription>Top goleadores de {currentStats.clubName}</CardDescription>
              </CardHeader>
              <CardContent>
                {currentStats.topScorers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No hay goles registrados
                  </p>
                ) : (
                  <div className="space-y-3">
                    {currentStats.topScorers.map((scorer, index) => (
                      <div
                        key={scorer.name}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
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
                        <Badge variant="secondary" className="text-lg px-3">
                          {scorer.goals} ⚽
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución de Goles</CardTitle>
                <CardDescription>Goles por jugador en {currentStats.clubName}</CardDescription>
              </CardHeader>
              <CardContent>
                {currentStats.topScorers.length > 0 ? (
                  <GoalsChart data={currentStats.topScorers.slice(0, 6)} />
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Sin datos disponibles
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Estadísticas */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
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

            <Card>
              <CardHeader>
                <CardTitle>Goles por Mes</CardTitle>
                <CardDescription>Evolución de goles a favor y en contra</CardDescription>
              </CardHeader>
              <CardContent>
                {currentStats.monthlyGoals.length > 0 ? (
                  <MonthlyGoalsChart data={currentStats.monthlyGoals} />
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Sin datos disponibles
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-emerald-500">{currentStats.goalsFor}</p>
                  <p className="text-muted-foreground mt-1">Goles a Favor</p>
                  <p className="text-sm text-muted-foreground">
                    {currentStats.totalMatches > 0
                      ? (currentStats.goalsFor / currentStats.totalMatches).toFixed(1)
                      : 0}{' '}
                    por partido
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-red-500">{currentStats.goalsAgainst}</p>
                  <p className="text-muted-foreground mt-1">Goles en Contra</p>
                  <p className="text-sm text-muted-foreground">
                    {currentStats.totalMatches > 0
                      ? (currentStats.goalsAgainst / currentStats.totalMatches).toFixed(1)
                      : 0}{' '}
                    por partido
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p
                    className={`text-4xl font-bold ${
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
                  <p className="text-muted-foreground mt-1">Diferencia de Goles</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Deudas - Shared across clubs */}
        <TabsContent value="debts" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-amber-500" />
                  Tabla de Deudas
                </CardTitle>
                <CardDescription>Jugadores con pagos pendientes (todos los clubes)</CardDescription>
              </CardHeader>
              <CardContent>
                {debts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-emerald-500 font-medium">🎉 ¡Todos al corriente!</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      No hay deudas pendientes
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {debts.map((debt) => (
                      <div
                        key={debt.name}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <span className="font-bold text-amber-500">#{debt.dorsal}</span>
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
                          <p className="text-lg font-bold text-red-500">
                            {formatCurrency(debt.totalDebt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-muted-foreground">Deuda Total del Equipo</p>
                  <p className="text-3xl font-bold text-red-500 mt-1">
                    {formatCurrency(totalTeamDebt)}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Jugadores con deuda</span>
                    <span className="font-medium">{debts.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Jugadores al corriente</span>
                    <span className="font-medium text-emerald-500">
                      {totalPlayers - debts.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deuda promedio</span>
                    <span className="font-medium">
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
