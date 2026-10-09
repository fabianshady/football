import type { MetadataRoute } from 'next'
import { absoluteUrl, isIndexable } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export default function robots(): MetadataRoute.Robots {
  return isIndexable()
    ? { rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }, sitemap: absoluteUrl('/sitemap.xml') }
    : { rules: { userAgent: '*', disallow: '/' } }
}
