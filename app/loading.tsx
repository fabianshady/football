export default function Loading() {
  return <main className="page-shell" aria-busy="true" aria-label="Cargando información del club"><div className="surface tonal h-64 motion-safe:animate-pulse" /><div className="grid gap-4 sm:grid-cols-3 mt-6">{[1, 2, 3].map((id) => <div key={id} className="surface h-36 motion-safe:animate-pulse" />)}</div><span className="sr-only" role="status">Cargando…</span></main>
}
