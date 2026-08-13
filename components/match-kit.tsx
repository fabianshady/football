import Image from 'next/image'
import { cn } from '@/lib/utils'

const KIT_ASSETS = {
  1: {
    src: 'https://vpl0mb2pgnbucvy2.public.blob.vercel-storage.com/1u.png',
    label: 'Local (Azul)',
    short: 'Local',
  },
  2: {
    src: 'https://vpl0mb2pgnbucvy2.public.blob.vercel-storage.com/2u.png',
    label: 'Visitante (Guinda)',
    short: 'Visitante',
  },
} as const

export function resolveKit(kit: number | null | undefined): 1 | 2 | null {
  return kit === 1 || kit === 2 ? kit : null
}

export function MatchKit({
  kit,
  size = 'sm',
  className,
}: {
  kit: number | null | undefined
  size?: 'sm' | 'md'
  className?: string
}) {
  const resolved = resolveKit(kit)
  if (!resolved) return null

  const asset = KIT_ASSETS[resolved]
  const px = size === 'md' ? 36 : 18

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 min-w-0',
        size === 'md' && 'rounded-xl border border-border/50 bg-muted/40 px-2.5 py-1.5',
        className
      )}
    >
      <Image
        src={asset.src}
        alt={`Uniforme ${asset.short}`}
        width={px}
        height={px}
        className="object-contain drop-shadow-sm shrink-0"
      />
      <span className={cn(size === 'md' ? 'text-sm' : 'text-sm truncate')}>
        Uniforme:{' '}
        <span className="font-semibold text-foreground">{asset.label}</span>
      </span>
    </span>
  )
}
