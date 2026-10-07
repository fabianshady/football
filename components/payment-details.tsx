'use client'
import { useState } from 'react'
import { Check, Copy, Landmark } from 'lucide-react'
import type { ClubSettings } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
export function PaymentDetails({ settings }: { settings: ClubSettings | null }) {
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState('')
  async function copy(label: string, value: string) {
    try { await navigator.clipboard.writeText(value); setCopied(label); setMessage(`${label} copiado al portapapeles.`) }
    catch { setCopied(''); setMessage('No se pudo copiar. Selecciona el dato y cópialo manualmente.') }
  }
  return <section className="surface"><div className="flex items-center gap-3 mb-5"><span className="p-3 rounded-2xl bg-accent text-accent-foreground"><Landmark size={22} aria-hidden="true" /></span><h2 className="text-xl">Datos para transferir</h2></div>{settings ? <><p className="text-sm text-muted-foreground mb-5">{settings.bank || 'Banco por confirmar'}{settings.weekly_fee != null && <> · Cuota semanal: <strong className="text-foreground">{formatCurrency(Number(settings.weekly_fee))}</strong></>}</p><div className="space-y-3">{[{ label: 'Teléfono', value: settings.phone }, { label: 'CLABE', value: settings.clabe }, { label: 'Cuenta', value: settings.account }].map(({ label, value }) => value && <div key={label} className="rounded-2xl bg-muted p-4 flex justify-between items-center gap-3"><div className="min-w-0"><p className="text-xs text-muted-foreground mb-1">{label}</p><p className="font-semibold tabular-nums break-all select-all">{value}</p></div><button className="p-3 rounded-full hover:bg-card shrink-0" type="button" aria-label={`Copiar ${label}`} onClick={() => copy(label, value)}>{copied === label ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}</button></div>)}</div><p className="text-xs text-muted-foreground mt-4" role="status" aria-live="polite">{message || 'Usa el botón junto a cada dato para copiarlo.'}</p></> : <p className="text-sm text-muted-foreground">El club aún no ha publicado sus datos para transferir.</p>}</section>
}
