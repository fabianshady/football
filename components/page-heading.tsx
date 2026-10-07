export function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header className="page-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></header>
}
export function EmptyState({ children }: { children: React.ReactNode }) { return <div className="empty-state">{children}</div> }
export function DataUnavailable() {
  return <main className="page-shell"><PageHeading eyebrow="Conexión de datos" title="Volvemos en un momento." description="La conexión del club todavía no está configurada en este entorno." /><EmptyState>Los partidos, la plantilla y las finanzas estarán disponibles cuando se configure la conexión de datos.</EmptyState></main>
}
