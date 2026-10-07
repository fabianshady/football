import Link from 'next/link'

export default function MatchNotFound() {
  return (
    <main className="page-shell text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">Partido</p>
      <h1 className="font-display text-5xl mt-2">No encontramos ese partido</h1>
      <p className="text-muted-foreground mt-3">
        Puede que el enlace esté viejo o que el partido todavía no esté cargado.
      </p>
      <Link
        href="/"
        className="action mt-8"
      >
        Volver al inicio
      </Link>
    </main>
  )
}
