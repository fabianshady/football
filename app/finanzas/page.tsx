import { dataConfigured, getDebts, getSettings } from '@/lib/queries'
import { DataUnavailable, EmptyState, PageHeading } from '@/components/page-heading'
import { PaymentDetails } from '@/components/payment-details'
import { formatCurrency } from '@/lib/utils'
import { pageMetadata } from '@/lib/seo'
export const dynamic = 'force-dynamic'
export const metadata = pageMetadata('Finanzas', 'Información de aportaciones y cuotas del club ITJAGUARS FC.', '/finanzas')
export default async function FinancesPage() {
  if (!dataConfigured) return <DataUnavailable />
  const [rows, settings] = await Promise.all([getDebts(), getSettings()])
  const debts = rows.filter((row) => Number(row.total_debt) > 0)
  const total = debts.reduce((sum, row) => sum + Number(row.total_debt), 0)
  return <main className="page-shell"><PageHeading eyebrow="Cuidamos el club" title="Cuentas claras. Equipo unido." description="Consulta las aportaciones pendientes y los datos para transferir. Información de la plantilla activa, sin filtro de temporada." /><div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]"><div><div className="surface tonal mb-6"><p className="text-sm text-muted-foreground">Total pendiente del equipo</p><p className="metric mt-3">{formatCurrency(total)}</p><p className="text-xs text-muted-foreground mt-3">{debts.length} jugadores con aportaciones pendientes</p></div><h2 className="text-xl mb-4">Aportaciones pendientes</h2>{debts.length ? <div className="space-y-3">{debts.map((debt) => <details key={debt.id} className="surface !p-5"><summary className="cursor-pointer flex items-center justify-between gap-3"><span className="flex items-center gap-3"><span className="text-gold text-sm font-bold">#{debt.dorsal}</span><span className="font-medium text-sm">{debt.name}</span></span><span className="font-semibold text-sm whitespace-nowrap">{formatCurrency(Number(debt.total_debt))}<span className="block text-[10px] font-normal text-muted-foreground text-right">Ver detalle</span></span></summary><ul className="mt-4 border-t pt-3 space-y-3">{debt.events.map((event, index) => <li key={`${event.name}-${index}`} className="flex justify-between gap-3 text-sm"><span>{event.name}<span className="block text-xs text-muted-foreground">{event.date ? new Intl.DateTimeFormat('es-MX', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(event.date)) : 'Sin fecha'}</span></span><span className="text-muted-foreground">{formatCurrency(Number(event.cost))}</span></li>)}</ul></details>)}</div> : <EmptyState>Todo al día. No hay aportaciones pendientes en la plantilla activa.</EmptyState>}</div><div className="lg:sticky lg:top-6 self-start"><PaymentDetails settings={settings} /></div></div></main>
}
