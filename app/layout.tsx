import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://itjaguars.fabianms.com'),
  title: 'ITJAGUARS FC Stats',
  description: 'Estadísticas y resultados del equipo',
  icons: {
    icon: '/icon',
  },
  openGraph: {
    title: 'ITJaguars FC',
    description: 'Sigue los partidos, resultados y noticias de ITJaguars FC.',
    url: 'https://itjaguars.fabianms.com/',
    siteName: 'ITJaguars FC',
    images: [
      {
        url: 'https://itjaguars.fabianms.com/preview.png',
        width: 1200,
        height: 630,
        alt: 'ITJaguars FC Preview',
      },
    ],
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
          {children}
        </div>
      </body>
    </html>
  )
}
