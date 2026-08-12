import Link from 'next/link'

export default function MatchNotFound() {
  return (
    <main className="container mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">Partido</p>
      <h1 className="font-display text-5xl mt-2">No encontramos ese partido</h1>
      <p className="text-muted-foreground mt-3">
        Puede que el enlace esté viejo o que el partido todavía no esté cargado.
      </p>
      <Link
        href="/"
        className="inline-flex mt-8 rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-primary-foreground dark:bg-gold dark:text-navy"
      >
        Volver al dashboard
      </Link>
    </main>
  )
}
