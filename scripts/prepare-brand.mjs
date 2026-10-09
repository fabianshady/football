import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = new URL('../', import.meta.url)
const source = (name) => fileURLToPath(new URL(`resources/${name}.png`, root))
const destination = (name) => fileURLToPath(new URL(`public/brand/${name}`, root))
const logo = fileURLToPath(new URL('public/logo.png', root))
await mkdir(new URL('public/brand/', root), { recursive: true })

async function report(name, pipeline) {
  const info = await pipeline.toFile(destination(name))
  console.log(`${name}: ${info.width}×${info.height}, ${info.size} bytes`)
}

// PNG is supported by ImageResponse; the illustrations retain alpha in WebP.
for (const name of ['og-home', 'og-background']) {
  await report(`${name}.png`, sharp(source(name)).resize(1200, 630, { fit: 'cover' }).png({ compressionLevel: 9, palette: true, colours: 256 }))
}
for (const [index, name] of ['empty-goals', 'empty-lineup', 'empty-head-to-head'].entries()) {
  await report(`${name}.webp`, sharp(source(`empty-states-${index + 1}`)).resize(640, 640).webp({ quality: 85, alphaQuality: 100 }))
}
await report('logo.webp', sharp(logo).resize(384, 384).webp({ quality: 90 }))
await report('logo.png', sharp(logo).resize(256, 256).png({ compressionLevel: 9 }))
for (const size of [32, 180, 192, 512]) {
  await report(`icon-${size}.png`, sharp(logo).resize(size, size).flatten({ background: '#1b2d50' }).png({ compressionLevel: 9 }))
}
// Keep the crest inside the central 40% radius safe zone. The gold ring is decoration.
const safeLogo = await sharp(logo).resize(170, 170).png().toBuffer()
await report('icon-maskable-512.png', sharp(source('icon-maskable')).resize(512, 512)
  .composite([{ input: safeLogo, left: 171, top: 171 }]).png({ compressionLevel: 9 }))
