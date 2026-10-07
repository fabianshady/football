import Link from 'next/link'
import { ArrowRight, CalendarDays, Shield, Users, Wallet } from 'lucide-react'
import { dataConfigured, getMatches, getTeams } from '@/lib/queries'
import { splitMatches, weekdayLabel } from '@/lib/public'
import { DataUnavailable, EmptyState } from '@/components/page-heading'
import { MatchCard } from '@/components/match-card'

export const dynamic = 'force-dynamic'
export default async function HomePage() {
  if (!dataConfigured) return <DataUnavailable />
  const [teams, matches] = await Promise.all([getTeams(), getMatches()])
  const upcoming = splitMatches(matches).upcoming.slice(0, 2)
  return <main className="page-shell">
    <section className="hero"><div className="hero-orbit" /><div className="relative"><p className="eyebrow mb-5">Nuestro club · Nuestra cancha</p><h1>El siguiente capítulo<br /><span className="text-[#e5c685]">se juega juntos.</span></h1><p className="text-[#c8d3e7] mt-6 max-w-lg leading-relaxed">Todo lo que mueve a ITJAGUARS FC. Sigue cada partido, conoce al equipo y prepárate para la próxima jornada.</p><div className="flex flex-wrap gap-3 mt-8"><a className="action action-gold" href="#equipos">Explorar equipos <ArrowRight size={18} /></a><Link className="action !bg-white/10 !text-white" href="/plantilla">Nuestra plantilla <Users size={18} /></Link></div></div></section>
    <div className="section-heading" id="equipos"><h2>Dos equipos. Una identidad.</h2><Shield size={22} className="text-gold" aria-hidden="true" /></div>
    {teams.length ? <div className="grid gap-4 md:grid-cols-2">{teams.map((team, index) => <Link href={`/${team.slug}`} key={team.id} className="surface tonal group flex flex-col gap-7 hover:ring-2 hover:ring-ring transition-shadow"><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">EQUIPO {String(index + 1).padStart(2, '0')}</span><span className="rounded-full bg-card p-3"><ArrowRight size={20} aria-hidden="true" /></span></div><div><h2 className="text-3xl">{team.name}</h2><p className="text-muted-foreground mt-3 text-sm flex flex-wrap gap-2"><CalendarDays size={17} aria-hidden="true" /><span className="capitalize">{weekdayLabel(team.match_weekday)}</span>{team.league_name && <span>· {team.league_name}</span>}</p></div><p className="text-sm font-semibold text-gold">Partidos, resultados y estadísticas</p></Link>)}</div> : <EmptyState>Aún no hay equipos registrados.</EmptyState>}
    <div className="section-heading"><h2>Nos vemos en la cancha.</h2><span className="text-xs text-muted-foreground">Hora de Tijuana</span></div>
    {upcoming.length ? <div className="grid gap-4 md:grid-cols-2">{upcoming.map((match) => <MatchCard key={match.id} match={match} />)}</div> : <EmptyState>La próxima jornada está por anunciarse. Consulta los equipos para ver sus últimos resultados.</EmptyState>}
    <Link href="/finanzas" className="surface mt-8 flex items-center justify-between gap-4"><div className="flex items-center gap-4"><span className="rounded-2xl bg-accent text-accent-foreground p-3"><Wallet size={24} aria-hidden="true" /></span><div><h2 className="text-lg">El club también se construye fuera de la cancha.</h2><p className="text-sm text-muted-foreground mt-1">Cuotas, aportaciones y datos para transferir.</p></div></div><ArrowRight size={22} aria-hidden="true" /></Link>
  </main>
}
