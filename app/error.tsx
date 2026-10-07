'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
export default function ErrorPage({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return <main className="page-shell"><div className="surface max-w-2xl mx-auto py-12"><p className="eyebrow">Conexión interrumpida</p><h1 className="text-4xl mt-4">No pudimos cargar los datos.</h1><p className="text-muted-foreground my-6 leading-relaxed">Hubo un problema al consultar la información del club. Intenta de nuevo en un momento.</p><Button onClick={() => window.location.reload()}>Volver a intentar</Button></div></main>
}
