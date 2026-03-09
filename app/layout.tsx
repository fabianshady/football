import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://itjaguars.fabianms.com'),
  title: 'ITJAGUARS FC Stats',
  description: 'Estadísticas y resultados del equipo',
  openGraph: {
    title: 'ITJAGUARS FC Stats',
    description: 'Estadísticas y resultados del equipo',
    url: 'https://itjaguars.fabianms.com/',
    siteName: 'ITJAGUARS FC Stats',
    images: [
      {
        url: 'https://vpl0mb2pgnbucvy2.public.blob.vercel-storage.com/preview.png',
        width: 1200,
        height: 630,
        alt: 'ITJAGUARS FC Stats Preview',
      },
    ],
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ITJAGUARS FC Stats',
    description: 'Estadísticas y resultados del equipo',
    images: ['https://vpl0mb2pgnbucvy2.public.blob.vercel-storage.com/preview.png'],
  },
  icons: {
    icon: 'https://vpl0mb2pgnbucvy2.public.blob.vercel-storage.com/logo.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
          {children}
          <Analytics />
          <SpeedInsights />
        </div>
      </body>
    </html>
  )
}
