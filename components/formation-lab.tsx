'use client'

import { useState } from 'react'
import { Lightbulb, ShieldAlert, Swords, UserRound } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FormationPitch } from '@/components/formation-pitch'
import {
  buildLineupVariants,
  getDefaultFormationId,
  getFormation,
  getFormations,
  getInsight,
  rankingLabel,
  recommendFormation,
} from '@/lib/tactics'
import { PlayerName } from '@/components/player-identity'
import type { MatchSquadEntry } from '@/lib/types'

interface FormationLabProps {
  rivalPos: number
  rivalTeam: string
  squad?: MatchSquadEntry[]
}

export function FormationLab({ rivalPos, rivalTeam, squad }: FormationLabProps) {
  const formations = getFormations()
  const [formationId, setFormationId] = useState(getDefaultFormationId())
  const formation = getFormation(formationId) ?? formations[0]
  const insight = getInsight(formation.id)
  const recommendation = recommendFormation(squad)
  const variants = buildLineupVariants(formation, squad)
  const [gkIndex, setGkIndex] = useState(0)
  const safeIndex = Math.min(gkIndex, Math.max(0, variants.length - 1))
  const current = variants[safeIndex]

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <Card>
        <CardHeader>
           <CardTitle className="text-2xl">Probar formación</CardTitle>
          <CardDescription>
            Fútbol 7 · portero + 6. Propuesta para el entrenador por posiciones principales,
            secundarias y lado preferido. No es una alineación confirmada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendation && <p className="text-sm text-muted-foreground">Mejor cobertura posicional: {recommendation.formation.name} · {recommendation.lineup.coverage}/{recommendation.formation.slots.length} puestos compatibles. Es una orientación táctica, no un pronóstico.</p>}
          <div className="flex flex-wrap gap-2">
            {formations.map((item) => (
              <button
                key={item.id}
                 type="button"
                 aria-pressed={formation.id === item.id}
                onClick={() => {
                  setFormationId(item.id)
                  setGkIndex(0)
                }}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  formation.id === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted border border-border/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {variants.length > 1 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Porteros en la convocatoria
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant, index) => (
                  <button
                    key={variant.gk?.id ?? `empty-${index}`}
                     type="button"
                     aria-pressed={safeIndex === index}
                    onClick={() => setGkIndex(index)}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all ${
                      safeIndex === index
                        ? 'bg-gold/15 border border-gold/50 text-foreground'
                        : 'bg-muted/40 border border-border/40 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <UserRound className="h-4 w-4" />
                     {variant.gk ? <span>#{variant.gk.dorsal} <PlayerName player={variant.gk} /></span> : 'Sin portero'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {current ? (
            <FormationPitch formation={formation} assignment={current.assignment} />
          ) : (
             <p className="text-sm text-muted-foreground">No hay convocatoria para armar la alineación.</p>
          )}

          {current && <>
            {current.warnings.length > 0 && <div role="status" className="rounded-xl border border-border p-3 text-sm"><p className="font-semibold mb-2">Puestos sin cubrir</p><ul className="list-disc pl-5">{current.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}
            <details className="text-sm"><summary className="cursor-pointer font-semibold">Por qué encaja cada jugador</summary><ul className="space-y-2 mt-3">{formation.slots.map((slot) => <li key={slot.id}><span className="font-medium">{slot.label}: {current.assignment[slot.id] ? <PlayerName player={current.assignment[slot.id]!} /> : 'Vacante'}</span><span className="block text-xs text-muted-foreground">{current.reasons[slot.id]}</span></li>)}</ul></details>
          </>}

          {current && current.bench.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Banca</p>
              <div className="flex flex-wrap gap-1.5">
                {current.bench.map((player) => (
                  <Badge key={player.id} variant="secondary">
                    #{player.dorsal} <PlayerName player={player} />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-2xl tracking-wide">
            <Swords className="h-5 w-5 text-gold" />
            Lectura táctica
          </CardTitle>
          <CardDescription>
            {rivalTeam} · {rankingLabel(rivalPos)}. Ideas generales de la formación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">{formation.summary}</p>
          {insight ? (
            <>
              <div>
                <p className="font-semibold flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-gold" />
                  {insight.title}
                </p>
                <ul className="space-y-2">
                  {insight.pros.map((item) => (
                    <li key={item} className="text-sm leading-relaxed flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold flex items-center gap-2 mb-2">
                  <ShieldAlert className="h-4 w-4 text-banner" />
                  Ojo con esto
                </p>
                <ul className="space-y-2">
                  {insight.cons.map((item) => (
                    <li key={item} className="text-sm leading-relaxed flex gap-2 text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-banner shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sin notas generales para esta formación.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
