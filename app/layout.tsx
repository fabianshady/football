import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed, Inter } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-barlow-condensed',
})

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f1ea' },
    { media: '(prefers-color-scheme: dark)', color: '#071221' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL('https://itjaguars.fabianms.com'),
  title: {
    default: 'ITJAGUARS FC Stats',
    template: '%s | ITJAGUARS FC',
  },
  description: 'Estadísticas y resultados del equipo ITJAGUARS FC. Goles, partidos, jugadores y más.',
  keywords: ['futbol', 'estadísticas', 'ITJAGUARS', 'soccer', 'stats'],
  authors: [{ name: 'ITJAGUARS FC' }],
  openGraph: {
    title: 'ITJAGUARS FC Stats',
    description: 'Estadísticas y resultados del equipo ITJAGUARS FC',
    url: 'https://itjaguars.fabianms.com/',
    siteName: 'ITJAGUARS FC Stats',
    images: [
      {
        url: 'https://vpl0mb2pgnbucvy2.public.blob.vercel-storage.com/preview.jpg',
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
    description: 'Estadísticas y resultados del equipo ITJAGUARS FC',
    images: ['https://vpl0mb2pgnbucvy2.public.blob.vercel-storage.com/preview.jpg'],
  },
  icons: {
    icon: 'https://vpl0mb2pgnbucvy2.public.blob.vercel-storage.com/logo.png',
    apple: 'https://vpl0mb2pgnbucvy2.public.blob.vercel-storage.com/logo.png',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${barlowCondensed.variable}`}>
      <body className={inter.className}>
        <div className="min-h-screen animated-gradient-bg">
          {children}
          <Analytics />
          <SpeedInsights />
        </div>
      </body>
    </html>
  )
}
