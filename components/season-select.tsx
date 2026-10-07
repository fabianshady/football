'use client'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { Season } from '@/lib/types'

export function SeasonSelect({ seasons, selected }: { seasons: Season[]; selected?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearchParams()
  if (!seasons.length) return null
  return <label className="flex flex-col gap-2 text-xs text-muted-foreground w-full sm:w-64"><span>Temporada</span><select aria-label="Temporada" className="field text-sm" value={selected ?? ''} onChange={(event) => {
    const params = new URLSearchParams(search.toString())
    params.set('temporada', event.target.value)
    router.push(`${pathname}?${params}`)
  }}>{seasons.map((season) => <option key={season.id} value={season.id}>{season.name}{season.active ? ' · Actual' : ''}</option>)}</select></label>
}
