import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { ClubLogo } from '@/components/club-logo'
import { SiteNav } from '@/components/site-nav'
import { ThemeControl } from '@/components/theme-control'
import { themeScript } from '@/lib/theme'
import './globals.css'
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f8fc' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
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
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className={inter.className}>
        <div className="min-h-screen">
          <a className="skip-link" href="#contenido">Saltar al contenido</a>
          <header className="site-header">
            <Link className="brand" href="/" aria-label="ITJAGUARS FC · Inicio"><ClubLogo size="sm" /><span>ITJAGUARS <span className="text-muted-foreground font-normal">FC</span></span></Link>
            <SiteNav />
            <ThemeControl />
          </header>
          <div id="contenido">{children}</div>
          <footer className="page-shell !py-6 flex flex-wrap justify-between gap-3 text-xs text-muted-foreground border-t"><p>© {new Date().getFullYear()} ITJAGUARS FC</p><p>Hecho para el equipo. Desde Tijuana.</p></footer>
          <Analytics />
          <SpeedInsights />
        </div>
      </body>
    </html>
  )
}
