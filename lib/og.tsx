import 'server-only'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { BRAND } from '@/lib/seo'

export const ogSize = { width: 1200, height: 630 }

async function artwork(home: boolean) {
  const [background, logo] = await Promise.all([
    home ? readFile(join(process.cwd(), 'public/brand/og-home.png')) : readFile(join(process.cwd(), 'public/brand/og-background.png')),
    readFile(join(process.cwd(), 'public/brand/logo.png')),
  ])
  return { background: `data:image/png;base64,${background.toString('base64')}`, logo: `data:image/png;base64,${logo.toString('base64')}` }
}

export async function brandImage({ title = BRAND, eyebrow = 'Nuestro club · Tijuana', detail = 'Partidos · Plantilla · Estadísticas', note, home = false }: {
  title?: string; eyebrow?: string; detail?: string; note?: string; home?: boolean
} = {}) {
  const images = await artwork(home)
  const width = home ? 540 : 1056
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: home ? '#f7f8fc' : '#1b2d50', color: home ? '#1b2d50' : '#fff', fontFamily: 'sans-serif' }}>
      {/* ImageResponse uses native img elements for embedded local artwork. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images.background} alt="" width={1200} height={630} style={{ position: 'absolute', inset: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', padding: '48px 64px', width: '100%', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images.logo} width={76} height={76} alt="" style={{ borderRadius: 38 }} />
          <span style={{ fontSize: 23, fontWeight: 700 }}>{BRAND}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', width, marginTop: 32 }}>
          <span style={{ fontSize: 20, letterSpacing: 2, color: home ? '#63501d' : '#edc35a' }}>{eyebrow.slice(0, 100)}</span>
          <div style={{ display: 'flex', fontSize: title.length > 65 ? 40 : title.length > 40 ? 48 : 60, lineHeight: 1.1, fontWeight: 700, marginTop: 20 }}>{title.slice(0, 140)}</div>
          <div style={{ display: 'flex', fontSize: 26, lineHeight: 1.4, marginTop: 24 }}>{detail.slice(0, 180)}</div>
          {note && <div style={{ display: 'flex', fontSize: 18, marginTop: 12, color: home ? '#526079' : '#c8d3e7' }}>{note.slice(0, 150)}</div>}
        </div>
        <div style={{ display: 'flex', marginTop: 'auto', fontSize: 19, fontWeight: 700 }}>Sigue al equipo →</div>
      </div>
    </div>, ogSize,
  )
}
