import { prisma } from '@/lib/prisma'
import { ClubLogo } from '@/components/club-logo'
import { ClubTabs, type ClubStats, type DebtInfo } from '@/components/club-tabs'

// Forzar renderizado dinámico - NO pre-renderizar en build
export const dynamic = 'force-dynamic'

export const revalidate = 60

async function getStats() {
  const now = new Date()

  // Partidos con goals y squad
  const matches = await prisma.match.findMany({
    include: { goals: { include: { player: true } }, squad: { include: { player: true } } },
    orderBy: { date: 'desc' },
  })

  // Obtener los clubes únicos (myTeam)
  const clubNames = Array.from(new Set(matches.map((m) => m.myTeam)))

  // Calcular stats por club
  const clubStats: ClubStats[] = clubNames.map((clubName) => {
    const clubMatches = matches.filter((m) => m.myTeam === clubName)
    const pastMatches = clubMatches.filter((m) => new Date(m.date) < now)
    const futureMatches = clubMatches.filter((m) => new Date(m.date) >= now).reverse()

    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0
    pastMatches.forEach((m) => {
      goalsFor += m.scoreHome
      goalsAgainst += m.scoreAway
      if (m.scoreHome > m.scoreAway) wins++
      else if (m.scoreHome < m.scoreAway) losses++
      else draws++
    })

    // Goleadores de este club (solo goles en partidos de este club)
    const clubMatchIds = new Set(clubMatches.map((m) => m.id))
    const goalCountMap: Record<string, { name: string; dorsal: number; goals: number }> = {}
    clubMatches.forEach((m) => {
      m.goals.forEach((g) => {
        const pid = g.playerId
        if (!goalCountMap[pid]) {
          goalCountMap[pid] = { name: g.player.name, dorsal: g.player.dorsal, goals: 0 }
        }
        goalCountMap[pid].goals++
      })
    })
    const topScorers = Object.values(goalCountMap)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 10)

    // Jugadores únicos en convocatorias de este club
    const playerSquadCount: Record<string, { name: string; count: number }> = {}
    clubMatches.forEach((m) => {
      m.squad.forEach((s) => {
        const pid = s.playerId
        if (!playerSquadCount[pid]) {
          playerSquadCount[pid] = { name: s.player.name, count: 0 }
        }
        playerSquadCount[pid].count++
      })
    })
    const uniquePlayerIds = new Set(clubMatches.flatMap((m) => m.squad.map((s) => s.playerId)))
    const totalPlayers = uniquePlayerIds.size

    const mostCalledEntry = Object.values(playerSquadCount).sort((a, b) => b.count - a.count)[0]
    const mostCalled = mostCalledEntry ? { name: mostCalledEntry.name, count: mostCalledEntry.count } : null

    // Goles por mes
    const monthlyData: Record<string, { scored: number; conceded: number }> = {}
    pastMatches.forEach((m) => {
      const month = new Date(m.date).toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })
      if (!monthlyData[month]) monthlyData[month] = { scored: 0, conceded: 0 }
      monthlyData[month].scored += m.scoreHome
      monthlyData[month].conceded += m.scoreAway
    })
    const monthlyGoals = Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .reverse()
      .slice(-6)

    return {
      clubName,
      pastMatches,
      futureMatches,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      topScorers,
      totalPlayers,
      totalMatches: pastMatches.length,
      monthlyGoals,
      mostCalled,
    } satisfies ClubStats
  })

  // Deudas (compartidas, no separadas por club)
  const activePlayers = await prisma.player.findMany({
    where: { active: true },
    include: {
      payments: { include: { event: true } },
    },
  })

  const debts: DebtInfo[] = activePlayers
    .map((p) => {
      const unpaid = p.payments.filter((pay) => !pay.paid)
      const totalDebt = unpaid.reduce((acc, pay) => acc + pay.event.cost, 0)
      return {
        name: p.name,
        dorsal: p.dorsal,
        totalDebt,
        events: unpaid.map((pay) => pay.event.name),
      }
    })
    .filter((d) => d.totalDebt > 0)
    .sort((a, b) => b.totalDebt - a.totalDebt)

  const totalTeamDebt = debts.reduce((acc, d) => acc + d.totalDebt, 0)

  return {
    clubStats,
    debts,
    totalTeamDebt,
    totalPlayers: activePlayers.length,
  }
}

export default async function HomePage() {
  const { clubStats, debts, totalTeamDebt, totalPlayers } = await getStats()

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex items-center gap-4">
          <ClubLogo size="lg" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ITJAGUARS FC</h1>
            <p className="text-muted-foreground">Dashboard de estadísticas del equipo</p>
          </div>
        </div>
      </div>

      {/* Club-separated content */}
      <ClubTabs
        clubStats={clubStats}
        debts={debts}
        totalTeamDebt={totalTeamDebt}
        totalPlayers={totalPlayers}
      />

      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>Última actualización: {new Date().toLocaleString('es-MX')}</p>
      </footer>
    </main>
  )
}
