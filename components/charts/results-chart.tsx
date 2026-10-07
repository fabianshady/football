import { useId } from 'react'

export function ResultsChart({ wins, draws, losses }: { wins: number; draws: number; losses: number }) {
  const id = useId()
  const total = wins + draws + losses
  const segments = [{ label: 'Victorias', value: wins, color: 'var(--success)' }, { label: 'Empates', value: draws, color: 'var(--gold-fill)' }, { label: 'Derrotas', value: losses, color: 'var(--danger)' }]
  let offset = 0
  return <figure><svg viewBox="0 0 240 190" className="w-full h-56" role="img" aria-labelledby={id}><title id={id}>{`Resultados: ${wins} victorias, ${draws} empates y ${losses} derrotas; ${total} partidos.`}</title><circle cx="120" cy="90" r="62" fill="none" stroke="var(--muted)" strokeWidth="22" />{segments.map((segment) => {
    const length = total ? segment.value / total * 100 : 0
    const start = offset
    offset += length
    return <circle key={segment.label} cx="120" cy="90" r="62" fill="none" stroke={segment.color} strokeWidth="22" pathLength="100" strokeDasharray={`${length} ${100 - length}`} strokeDashoffset={-start} transform="rotate(-90 120 90)" />
  })}<text x="120" y="92" textAnchor="middle" fill="var(--foreground)" fontSize="30" fontWeight="650">{total}</text><text x="120" y="114" textAnchor="middle" fill="var(--muted-foreground)" fontSize="11">partidos</text></svg><figcaption><dl className="grid grid-cols-3 gap-2 text-center text-xs">{segments.map((segment) => <div key={segment.label}><dt className="text-muted-foreground"><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: segment.color }} />{segment.label}</dt><dd className="font-semibold text-lg mt-1">{segment.value}</dd></div>)}</dl></figcaption></figure>
}
