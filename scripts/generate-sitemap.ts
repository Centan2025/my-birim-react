/**
 * Sitemap Generator
 * Build zamanında sitemap.xml oluşturur
 * Sanity CMS'den dinamik içerikleri çeker (ürünler, haberler, projeler, tasarımcılar, kategoriler)
 *
 * HashRouter kullanıldığı için URL'ler `/#/path` formatında oluşturulur.
 * Google _escaped_fragment_ desteği kaldırıldığı için, ek olarak non-hash URL'ler de eklenir
 * (Googlebot modern SPA'ları render edebilir).
 */

import {writeFileSync} from 'fs'
import {join} from 'path'
import {createClient} from '@sanity/client'
import * as dotenv from 'dotenv'

// .env dosyasını yükle
dotenv.config()

const BASE_URL = process.env['VITE_SITE_URL'] || 'https://www.birim.com'
const TODAY = new Date().toISOString().split('T')[0]

// Sanity Client ayarları
const sanityClient = createClient({
  projectId: process.env['VITE_SANITY_PROJECT_ID'] || 'wn3a082f',
  dataset: process.env['VITE_SANITY_DATASET'] || 'production',
  apiVersion: process.env['VITE_SANITY_API_VERSION'] || '2025-01-01',
  useCdn: false, // Güncel veri için CDN kapatılabilir build sırasında
})

interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
  // SEO: sayfa için alternatif diller
  alternates?: {lang: string; href: string}[]
}

// Statik sayfalar
const staticPages: SitemapUrl[] = [
  {loc: '/', changefreq: 'daily', priority: 1.0, lastmod: TODAY},
  {loc: '/about', changefreq: 'monthly', priority: 0.8, lastmod: TODAY},
  {loc: '/contact', changefreq: 'monthly', priority: 0.8, lastmod: TODAY},
  {loc: '/products', changefreq: 'weekly', priority: 0.9, lastmod: TODAY},
  {loc: '/designers', changefreq: 'weekly', priority: 0.9, lastmod: TODAY},
  {loc: '/projects', changefreq: 'weekly', priority: 0.9, lastmod: TODAY},
  {loc: '/news', changefreq: 'daily', priority: 0.8, lastmod: TODAY},
  {loc: '/categories', changefreq: 'weekly', priority: 0.7, lastmod: TODAY},
  {loc: '/factory', changefreq: 'monthly', priority: 0.6, lastmod: TODAY},
  {loc: '/cookies', changefreq: 'yearly', priority: 0.3, lastmod: TODAY},
  {loc: '/privacy', changefreq: 'yearly', priority: 0.3, lastmod: TODAY},
  {loc: '/terms', changefreq: 'yearly', priority: 0.3, lastmod: TODAY},
  {loc: '/kvkk', changefreq: 'yearly', priority: 0.3, lastmod: TODAY},
]

/**
 * Generates clean canonical URLs and HashRouter URLs for maximum SEO compatibility.
 */
const buildCleanUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${BASE_URL}${cleanPath}`
}

const buildHashUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${BASE_URL}/#${cleanPath}`
}

// XML sitemap oluşturucu (Sitemap Protocol 0.9 + xhtml:link for hreflang)
const generateSitemapXml = (urls: SitemapUrl[]): string => {
  const urlEntries: string[] = []

  for (const url of urls) {
    const cleanLoc = buildCleanUrl(url.loc)
    const hashLoc = buildHashUrl(url.loc)

    // Clean Canonical URL Entry
    urlEntries.push(`  <url>
    <loc>${cleanLoc}</loc>
${url.lastmod ? `    <lastmod>${url.lastmod}</lastmod>\n` : ''}${url.changefreq ? `    <changefreq>${url.changefreq}</changefreq>\n` : ''}${url.priority !== undefined ? `    <priority>${url.priority}</priority>\n` : ''}  </url>`)

    // HashRouter URL Entry (if path is not root '/')
    if (url.loc !== '/') {
      urlEntries.push(`  <url>
    <loc>${hashLoc}</loc>
${url.lastmod ? `    <lastmod>${url.lastmod}</lastmod>\n` : ''}${url.changefreq ? `    <changefreq>${url.changefreq}</changefreq>\n` : ''}${url.priority !== undefined ? `    <priority>${url.priority ? Math.max(0.1, url.priority - 0.1) : 0.5}</priority>\n` : ''}  </url>`)
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries.join('\n')}
</urlset>`
}

interface SanityDoc {
  slug: string
  _updatedAt: string
}

async function run() {
  console.log('🚀 Sitemap oluşturma işlemi başlatıldı...')
  console.log(`   Base URL: ${BASE_URL}`)

  try {
    const dynamicData = (await sanityClient.fetch(`
      {
        "products": *[_type == "product" && defined(slug.current)] { "slug": slug.current, _updatedAt },
        "news": *[_type == "newsItem" && defined(slug.current)] { "slug": slug.current, _updatedAt },
        "projects": *[_type == "project" && defined(slug.current)] { "slug": slug.current, _updatedAt },
        "designers": *[_type == "designer" && defined(slug.current)] { "slug": slug.current, _updatedAt },
        "categories": *[_type == "category" && defined(slug.current)] { "slug": slug.current, _updatedAt }
      }
    `)) as {
      products: SanityDoc[]
      news: SanityDoc[]
      projects: SanityDoc[]
      designers: SanityDoc[]
      categories: SanityDoc[]
    }

    const dynamicPages: SitemapUrl[] = [
      ...dynamicData.products.map((p: SanityDoc) => ({
        loc: `/product/${p.slug}`,
        lastmod: new Date(p._updatedAt).toISOString().split('T')[0],
        changefreq: 'weekly' as const,
        priority: 0.8,
      })),
      ...dynamicData.news.map((n: SanityDoc) => ({
        loc: `/news/${n.slug}`,
        lastmod: new Date(n._updatedAt).toISOString().split('T')[0],
        changefreq: 'monthly' as const,
        priority: 0.7,
      })),
      ...dynamicData.projects.map((p: SanityDoc) => ({
        loc: `/projects/${p.slug}`,
        lastmod: new Date(p._updatedAt).toISOString().split('T')[0],
        changefreq: 'monthly' as const,
        priority: 0.7,
      })),
      ...dynamicData.designers.map((d: SanityDoc) => ({
        loc: `/designer/${d.slug}`,
        lastmod: new Date(d._updatedAt).toISOString().split('T')[0],
        changefreq: 'monthly' as const,
        priority: 0.6,
      })),
      ...dynamicData.categories.map((c: SanityDoc) => ({
        loc: `/products/${c.slug}`,
        lastmod: new Date(c._updatedAt).toISOString().split('T')[0],
        changefreq: 'weekly' as const,
        priority: 0.7,
      })),
    ]

    const allUrls = [...staticPages, ...dynamicPages]
    const sitemap = generateSitemapXml(allUrls)
    const outputPath = join(process.cwd(), 'dist', 'sitemap.xml')
    const publicOutputPath = join(process.cwd(), 'public', 'sitemap.xml')

    // dist ve public'e yaz (build sonrası dist'e, development için public'e)
    writeFileSync(outputPath, sitemap, 'utf-8')
    writeFileSync(publicOutputPath, sitemap, 'utf-8')
    console.log(`✅ Sitemap başarıyla oluşturuldu: ${outputPath}`)
    console.log(`   Toplam ${allUrls.length} URL eklendi (${dynamicPages.length} dinamik)`)
  } catch (error) {
    console.error('❌ Sitemap oluşturulurken hata:', error)
    process.exit(1)
  }
}

run()
