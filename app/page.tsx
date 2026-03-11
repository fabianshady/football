import { supabase } from '@/lib/supabase'
import { ClubLogo } from '@/components/club-logo'
import { ClubTabs, type ClubStats, type DebtInfo } from '@/components/club-tabs'


// Usamos ISR (Incremental Static Regeneration) 
// La página mostrará HTML ultrarrápido por 60 segundos antes de recargarse.
export const revalidate = 60

/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase responses are untyped without generated DB types */
async function getStats() {
  const now = new Date()

  // Peticiones paralelas de Partidos y Jugadores para reducir latencia
  let rawMatches = []
  let rawPlayers = []

  try {
    const [matchesRes, playersRes] = await Promise.all([
      supabase
        .from('Match')
        .select('*, Goal(*, Player(*)), MatchSquad(*, Player(*))')
        .order('date', { ascending: false }),
      supabase
        .from('Player')
        .select('*, Payment(*, Event(*))')
        .eq('active', true),
    ])

    if (matchesRes.error) console.warn('⚠️ Fallo al obtener partidos:', matchesRes.error.message)
    else rawMatches = matchesRes.data ?? []

    if (playersRes.error) console.warn('⚠️ Fallo al obtener jugadores:', playersRes.error.message)
    else rawPlayers = playersRes.data ?? []
  } catch (err) {
    console.warn('⚠️ Error durante el fetch a Supabase en build:', err)
  }

  const matches = rawMatches.map((m: any) => ({
    ...m,
    goals: (m.Goal ?? []).map((g: any) => ({
      ...g,
      player: g.Player,
    })),
    squad: (m.MatchSquad ?? []).map((s: any) => ({
      ...s,
      player: s.Player,
    })),
  }))

  // Get unique club names from matches (reversed to prioritize most recent clubs)
  const clubNames = Array.from(new Set(matches.toReversed().map((m) => m.myTeam)))

  // Calculate stats for each club
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

    // Scorers (only counting goals from matches of this club)
    const goalCountMap: Record<string, { name: string; dorsal: number; goals: number }> = {}
    clubMatches.forEach((m) => {
      m.goals.forEach((g: any) => {
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

    // Unique players in squads
    const playerSquadCount: Record<string, { name: string; count: number }> = {}
    clubMatches.forEach((m) => {
      m.squad.forEach((s: any) => {
        const pid = s.playerId
        if (!playerSquadCount[pid]) {
          playerSquadCount[pid] = { name: s.player.name, count: 0 }
        }
        playerSquadCount[pid].count++
      })
    })
    const uniquePlayerIds = new Set(clubMatches.flatMap((m) => m.squad.map((s: any) => s.playerId)))
    const totalPlayers = uniquePlayerIds.size

    const mostCalledEntry = Object.values(playerSquadCount).sort((a, b) => b.count - a.count)[0]
    const mostCalled = mostCalledEntry ? { name: mostCalledEntry.name, count: mostCalledEntry.count } : null

    // Monthly goals (only counting past matches)
    const monthlyData: Record<string, { scored: number; conceded: number }> = {}
    pastMatches.forEach((m) => {
      const month = new Date(m.date).toLocaleDateString('es-MX', { month: 'short', year: '2-digit', timeZone: 'UTC' })
      if (!monthlyData[month]) monthlyData[month] = { scored: 0, conceded: 0 }
      monthlyData[month].scored += m.scoreHome
      monthlyData[month].conceded += m.scoreAway
    })
    const monthlyGoals = Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .reverse()
      .slice(-6)

    // Build complete player roster with stats
    const playerRosterMap: Record<string, any> = {}
    clubMatches.forEach((m) => {
      m.squad.forEach((s: any) => {
        const pid = s.playerId
        if (!playerRosterMap[pid]) {
          playerRosterMap[pid] = {
            id: s.player.id,
            name: s.player.name,
            dorsal: s.player.dorsal,
            positions: s.player.positions || [],
            callUps: 0,
            goals: 0,
          }
        }
        playerRosterMap[pid].callUps++
      })
      m.goals.forEach((g: any) => {
        const pid = g.playerId
        if (playerRosterMap[pid]) {
          playerRosterMap[pid].goals++
        }
      })
    })
    const players = Object.values(playerRosterMap).sort((a, b) => b.callUps - a.callUps)

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
      players,
    } satisfies ClubStats
  })

  // Debts
  // La información de 'rawPlayers' ya se consultó al inicio paralelamente.

  const activePlayers = rawPlayers.map((p: any) => ({
    ...p,
    payments: (p.Payment ?? []).map((pay: any) => ({
      ...pay,
      event: pay.Event,
    })),
  }))

  const debts: DebtInfo[] = activePlayers
    .map((p) => {
      const unpaid = p.payments.filter((pay: any) => !pay.paid)
      const totalDebt = unpaid.reduce((acc: number, pay: any) => acc + pay.event.cost, 0)
      return {
        name: p.name,
        dorsal: p.dorsal,
        totalDebt,
        events: unpaid.map((pay: any) => pay.event.name),
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
    <main className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in">
      {/* Header */}
      <header className="relative mb-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative">
            <div className="absolute -inset-2 rounded-full bg-primary/10 blur-xl animate-pulse-soft" />
            <ClubLogo size="lg" className="relative glow-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight gradient-text">
              ITJAGUARS FC
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Dashboard de estadísticas del equipo
            </p>
          </div>
        </div>
        {/* Decorative accent line */}
        <div className="mt-6 h-px bg-gradient-to-r from-primary/50 via-primary/20 to-transparent" />
      </header>

      {/* Club-separated content */}
      <ClubTabs
        clubStats={clubStats}
        debts={debts}
        totalTeamDebt={totalTeamDebt}
        totalPlayers={totalPlayers}
      />

      {/* Footer */}
      <footer className="mt-16 pb-8">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} ITJAGUARS FC</p>
          <p className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-soft" />
            Datos en tiempo real
          </p>
        </div>
      </footer>
    </main>
  )
}
