import { useId } from 'react'
import type { MonthlyGoals } from '@/lib/types'
import { EmptyState } from '@/components/page-heading'

export function MonthlyGoalsChart({ data }: { data: MonthlyGoals[] }) {
  const id = useId()
  if (!data.length) return <EmptyState>Aún no hay goles por mes en esta temporada.</EmptyState>
  const max = Math.max(...data.flatMap((row) => [row.scored, row.conceded]), 1)
  const width = Math.max(400, data.length * 86 + 60)
  const step = (width - 60) / data.length
  const description = `Goles por mes: ${data.map((row) => `${row.month}: ${row.scored} a favor, ${row.conceded} en contra`).join('; ')}`
  return <figure><div className="overflow-x-auto" role="region" aria-label="Gráfica mensual desplazable" tabIndex={0}><svg viewBox={`0 0 ${width} 240`} style={{ minWidth: width }} className="w-full h-64" role="img" aria-labelledby={id}><title id={id}>{description}</title>{[0, .5, 1].map((ratio) => <g key={ratio}><line x1="35" x2={width - 10} y1={195 - 150 * ratio} y2={195 - 150 * ratio} stroke="var(--border)" /><text x="25" y={199 - 150 * ratio} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">{Math.round(max * ratio)}</text></g>)}{data.map((row, index) => {
    const x = 40 + index * step
    return <g key={row.month}><rect x={x + step / 2 - 25} y={195 - row.scored / max * 150} width="21" height={row.scored / max * 150} rx="5" fill="var(--primary)" /><rect x={x + step / 2 + 2} y={195 - row.conceded / max * 150} width="21" height={row.conceded / max * 150} rx="5" fill="var(--gold-fill)" /><text x={x + step / 2} y="218" textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">{row.month}</text></g>
  })}</svg></div><figcaption className="flex flex-wrap gap-5 text-xs text-muted-foreground mt-2"><span><span className="inline-block w-3 h-3 bg-primary rounded mr-2" />A favor</span><span><span className="inline-block w-3 h-3 rounded mr-2 bg-[#d5af62]" />En contra</span></figcaption><details className="mt-4"><summary className="text-sm cursor-pointer text-muted-foreground">Ver datos de la gráfica</summary><table className="w-full text-sm mt-3"><caption className="sr-only">Goles por mes</caption><thead><tr className="text-left"><th scope="col" className="py-2">Mes</th><th scope="col">A favor</th><th scope="col">En contra</th></tr></thead><tbody>{data.map((row) => <tr key={row.month} className="border-t"><th scope="row" className="py-2 text-left font-normal">{row.month}</th><td>{row.scored}</td><td>{row.conceded}</td></tr>)}</tbody></table></details></figure>
}
