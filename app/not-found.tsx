import Link from 'next/link'
import { PageHeading } from '@/components/page-heading'
export default function NotFound() {
  return <main className="page-shell"><PageHeading eyebrow="404" title="Fuera de la cancha." description="No encontramos la página que buscas." /><Link className="action" href="/">Volver al inicio</Link></main>
}
