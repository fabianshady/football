import Link from 'next/link'
import Image from 'next/image'
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
import { dataConfigured, getHeadToHead, getMatch, getSeasons, getTeams } from '@/lib/queries'
import { DataUnavailable } from '@/components/page-heading'
import { goalLabel, priorRivalMatches } from '@/lib/public'
import { PlayerName, PlayerPositions } from '@/components/player-identity'
import { HeadToHead } from '@/components/head-to-head'
import { matchDescription, pageMetadata, sportsEventJsonLd } from '@/lib/seo'
import { JsonLd } from '@/components/json-ld'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const path = `/partido/${encodeURIComponent(id)}`
  if (!dataConfigured) return pageMetadata('Partido', 'Detalle del partido de ITJAGUARS FC.', path, '/opengraph-image', false)
  const match = await getMatch(id)
  if (!match) notFound()
  return pageMetadata(`${match.myTeam} vs ${match.rivalTeam}`, matchDescription(match), path, `${path}/opengraph-image`)
}

export default async function MatchDetailPage({ params }: PageProps) {
  if (!dataConfigured) return <DataUnavailable />
  const { id } = await params
  const match = await getMatch(id)
  if (!match) notFound()

  const now = new Date()
  const isPast = parseMatchDate(match.date) < now
  const result = !isPast
    ? null
    : match.scoreHome > match.scoreAway
      ? 'Victoria'
      : match.scoreHome < match.scoreAway
        ? 'Derrota'
        : 'Empate'
  const squad = match.squad ?? []
  const goals = match.goals ?? []
  const [teams, seasons, sameTeam, previous] = await Promise.all([
    getTeams(), getSeasons(),
    match.rivalId && match.teamId ? getHeadToHead(match.rivalId, match.id, match.date, match.teamId, now.toISOString()) : Promise.resolve([]),
    match.rivalId ? getHeadToHead(match.rivalId, match.id, match.date, undefined, now.toISOString()) : Promise.resolve([]),
  ])

  return (
    <main className="page-shell">
      <JsonLd value={sportsEventJsonLd(match)} />
      <Link
        href={match.teamSlug ? `/${match.teamSlug}/partidos${match.seasonid ? `?temporada=${encodeURIComponent(match.seasonid)}` : ''}` : '/'}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a partidos
      </Link>

      <header className="flex items-start gap-3 sm:gap-4 mb-8">
        <ClubLogo size="md" className="shrink-0" />
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">
            {isPast ? 'Resultado' : 'Próximo partido'}
          </p>
           <h1 className="text-3xl sm:text-4xl lg:text-5xl mt-2 break-words">
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

      <Card className="mb-8 overflow-hidden bg-secondary">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-2xl">
                <Target className="h-5 w-5 text-gold" />
                Goles
              </CardTitle>
              <CardDescription>Goles registrados a favor; el marcador puede incluir goles sin registro de autor.</CardDescription>
            </CardHeader>
            <CardContent>
              {goals.length === 0 ? (
                <div className="text-center"><Image src="/brand/empty-goals.webp" alt="" width={160} height={160} className="mx-auto mb-3" /><p className="text-sm text-muted-foreground">Sin goles registrados</p></div>
              ) : (
                <ul className="space-y-2">
                  {goals.map((goal, index) => (
                    <li
                      key={goal.id ?? `${goal.playerId}-${index}`}
                      className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2"
                    >
                      <span className="font-medium">
                        {goal.kind !== 'own_goal' && goal.kind !== 'unknown' && goal.player ? <Link href={`/plantilla/${encodeURIComponent(goal.player.id)}`} aria-label={`${goal.player.name}, goleador`} className="hover:underline">{goalLabel(goal)}</Link> : goalLabel(goal)}
                      </span>
                      <Badge variant="secondary">{goal.minute != null ? `${goal.minute}′` : 'Gol'}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-2xl">
              <Users className="h-5 w-5 text-gold" />
              Convocatoria
            </CardTitle>
            <CardDescription>
              {squad.length > 0
                ? `${squad.length} jugador${squad.length === 1 ? '' : 'es'}`
                : 'Todavía no hay lista'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {squad.length === 0 ? (
              <div className="text-center"><Image src="/brand/empty-lineup.webp" alt="" width={160} height={160} className="mx-auto mb-3" /><p className="text-sm text-muted-foreground italic">Convocatoria pendiente</p></div>
            ) : (
              <div className="space-y-3">
                {squad.map((entry) => (
                  <div key={entry.player.id} className="rounded-xl bg-muted/40 p-3">
                    <Link href={`/plantilla/${encodeURIComponent(entry.player.id)}`} className="text-sm hover:underline"><span className="font-bold mr-1">#{entry.player.dorsal}</span><PlayerName player={entry.player} /></Link>
                    <div className="mt-2"><PlayerPositions player={entry.player} /></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <HeadToHead sameTeam={priorRivalMatches(sameTeam, match, match.teamId, now)} club={priorRivalMatches(previous, match, '', now)} teams={teams} seasons={seasons} currentTeamId={match.teamId} />
      <FormationLab rivalPos={match.rivalPos} rivalTeam={match.rivalTeam} squad={squad} />
    </main>
  )
}
