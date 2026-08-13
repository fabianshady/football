import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin, Target, Users } from 'lucide-react'
import { ClubLogo } from '@/components/club-logo'
import { FormationLab } from '@/components/formation-lab'
import { ClientDateTime } from '@/components/client-datetime'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MatchKit } from '@/components/match-kit'
import { MatchScoreboard } from '@/components/match-scoreboard'
import { parseMatchDate } from '@/lib/datetime'
import { applyPlayerStats, getPlayerCareerStats, mapRawMatch } from '@/lib/matches'
import { opponentStrength, strengthLabel } from '@/lib/tactics'
import { supabase } from '@/lib/supabase'

export const revalidate = 60

interface PageProps {
  params: Promise<{ id: string }>
}

async function getMatch(id: string) {
  const { data, error } = await supabase
    .from('Match')
    .select('*, Goal(*, Player(*)), MatchSquad(*, Player(*))')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.warn('⚠️ Fallo al obtener partido:', error.message)
    return null
  }
  if (!data) return null
  const match = mapRawMatch(data as Record<string, unknown>)
  const stats = await getPlayerCareerStats()
  return applyPlayerStats(match, stats)
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const match = await getMatch(id)
  if (!match) return { title: 'Partido' }
  return {
    title: `${match.myTeam} vs ${match.rivalTeam}`,
    description: `Detalle, convocatoria y formaciones · ${match.location}`,
  }
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { id } = await params
  const match = await getMatch(id)
  if (!match) notFound()

  const isPast = parseMatchDate(match.date) < new Date()
  const result = !isPast
    ? null
    : match.scoreHome > match.scoreAway
      ? 'Victoria'
      : match.scoreHome < match.scoreAway
        ? 'Derrota'
        : 'Empate'
  const strength = opponentStrength(match.rivalPos)
  const squad = match.squad ?? []
  const goals = match.goals ?? []

  return (
    <main className="relative container mx-auto px-4 py-8 max-w-7xl animate-fade-in">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al dashboard
      </Link>

      <header className="flex items-start gap-3 sm:gap-4 mb-8">
        <ClubLogo size="md" className="glow-primary shrink-0" />
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">
            {isPast ? 'Resultado' : 'Próximo partido'}
          </p>
          <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl tracking-wide mt-1 break-words">
            {match.myTeam} vs {match.rivalTeam}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <ClientDateTime date={match.date} />
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4 text-gold" />
              {match.location}
            </span>
          </div>
        </div>
      </header>

      <Card className="glass-card mb-8 overflow-hidden">
        <CardContent className="p-4 sm:p-8">
          <MatchScoreboard
            myTeam={match.myTeam}
            rivalTeam={match.rivalTeam}
            myPos={match.myPos}
            rivalPos={match.rivalPos}
            scoreHome={match.scoreHome}
            scoreAway={match.scoreAway}
            isPast={isPast}
            size="hero"
            rivalExtra={
              <Badge className="bg-gold/15 text-foreground border-gold/40">{strengthLabel(strength)}</Badge>
            }
          />
          <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4">
            {result && (
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{result}</p>
            )}
            <MatchKit kit={match.kit} size="md" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {isPast && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-2xl">
                <Target className="h-5 w-5 text-gold" />
                Goles
              </CardTitle>
              <CardDescription>Quiénes marcaron en este partido</CardDescription>
            </CardHeader>
            <CardContent>
              {goals.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin goles registrados</p>
              ) : (
                <ul className="space-y-2">
                  {goals.map((goal, index) => (
                    <li
                      key={`${goal.playerId}-${index}`}
                      className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2"
                    >
                      <span className="font-medium">
                        #{goal.player.dorsal} {goal.player.name}
                      </span>
                      <Badge variant="secondary">Gol</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-2xl">
              <Users className="h-5 w-5 text-gold" />
              {isPast ? 'Jugaron' : 'Convocatoria'}
            </CardTitle>
            <CardDescription>
              {squad.length > 0
                ? `${squad.length} jugador${squad.length === 1 ? '' : 'es'}`
                : 'Todavía no hay lista'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {squad.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Convocatoria pendiente</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {squad.map((entry) => (
                  <Badge key={entry.player.id} variant="secondary" className="px-3 py-1.5">
                    <span className="font-bold mr-1">#{entry.player.dorsal}</span>
                    {entry.player.name}
                    {entry.player.positions[0] && (
                      <span className="ml-1.5 text-muted-foreground">{entry.player.positions[0]}</span>
                    )}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <FormationLab rivalPos={match.rivalPos} rivalTeam={match.rivalTeam} squad={squad} />
    </main>
  )
}
