import type { FormationDef, LineupAssignment } from '@/lib/tactics'
import { cn } from '@/lib/utils'

interface FormationPitchProps {
  formation: FormationDef
  assignment: LineupAssignment
  className?: string
}

export function FormationPitch({ formation, assignment, className }: FormationPitchProps) {
  return (
    <div
      className={cn(
        'pitch-board relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-white/10 shadow-inner',
        className
      )}
    >
      <svg viewBox="0 0 100 140" className="absolute inset-0 h-full w-full" aria-hidden>
        <rect x="4" y="4" width="92" height="132" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
        <line x1="4" y1="70" x2="96" y2="70" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" />
        <circle cx="50" cy="70" r="10" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" />
        <circle cx="50" cy="70" r="0.8" fill="rgba(255,255,255,0.5)" />
        <rect x="28" y="4" width="44" height="18" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" />
        <rect x="36" y="4" width="28" height="8" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" />
        <rect x="28" y="118" width="44" height="18" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" />
        <rect x="36" y="128" width="28" height="8" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" />
      </svg>

      {formation.slots.map((slot) => {
        const player = assignment[slot.id]
        return (
          <div
            key={slot.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-center w-24"
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
          >
            <div
              className={cn(
                'mx-auto flex h-11 w-11 items-center justify-center rounded-full border-2 text-sm font-bold shadow-lg',
                player
                  ? 'border-gold bg-navy text-navy-foreground'
                  : 'border-dashed border-white/50 bg-black/20 text-white/70'
              )}
              title={slot.label}
            >
              {player ? `#${player.dorsal}` : '—'}
            </div>
            <p className="mt-1 truncate text-[11px] font-semibold text-white drop-shadow">
              {player ? player.name.split(' ')[0] : slot.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}
