import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { ClubLogo } from '@/components/club-logo'
import { SiteNav } from '@/components/site-nav'
import { ThemeControl } from '@/components/theme-control'
import { themeScript } from '@/lib/theme'
import { BRAND, HOME_DESCRIPTION, canonicalOrigin, pageMetadata } from '@/lib/seo'
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
  ...pageMetadata(BRAND, HOME_DESCRIPTION, '/'),
  metadataBase: canonicalOrigin(),
  title: {
    default: BRAND,
    template: '%s | ITJAGUARS FC',
  },
  authors: [{ name: 'ITJAGUARS FC' }],
  applicationName: BRAND,
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/brand/icon-32.png', sizes: '32x32', type: 'image/png' }],
    apple: [{ url: '/brand/icon-180.png', sizes: '180x180', type: 'image/png' }],
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
          {process.env.VERCEL === '1' && <><Analytics /><SpeedInsights /></>}
        </div>
      </body>
    </html>
  )
}
