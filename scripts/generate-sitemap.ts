/**
 * Sitemap Generator
 * Build zamanında sitemap.xml oluşturur
 * Sanity CMS'den dinamik içerikleri çeker (ürünler, haberler, projeler, tasarımcılar, kategoriler)
 */

import {writeFileSync} from 'fs'
import {join} from 'path'
import {createClient} from '@sanity/client'
import * as dotenv from 'dotenv'

// .env dosyasını yükle
dotenv.config()

const BASE_URL = process.env['VITE_SITE_URL'] || 'https://yourdomain.com'

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
}

// Statik sayfalar
const staticPages: SitemapUrl[] = [
  {loc: '/', changefreq: 'daily', priority: 1.0},
  {loc: '/about', changefreq: 'monthly', priority: 0.8},
  {loc: '/contact', changefreq: 'monthly', priority: 0.8},
  {loc: '/products', changefreq: 'weekly', priority: 0.9},
  {loc: '/designers', changefreq: 'weekly', priority: 0.9},
  {loc: '/projects', changefreq: 'weekly', priority: 0.9},
  {loc: '/news', changefreq: 'daily', priority: 0.8},
  {loc: '/categories', changefreq: 'weekly', priority: 0.7},
  {loc: '/factory', changefreq: 'monthly', priority: 0.6},
  {loc: '/cookies', changefreq: 'yearly', priority: 0.3},
  {loc: '/privacy', changefreq: 'yearly', priority: 0.3},
  {loc: '/terms', changefreq: 'yearly', priority: 0.3},
  {loc: '/kvkk', changefreq: 'yearly', priority: 0.3},
]

// XML sitemap oluşturucu
const generateSitemapXml = (urls: SitemapUrl[]): string => {
  const urlEntries = urls
    .map(
      url => `  <url>
    <loc>${BASE_URL}${url.loc}</loc>
${url.lastmod ? `    <lastmod>${url.lastmod}</lastmod>\n` : ''}${url.changefreq ? `    <changefreq>${url.changefreq}</changefreq>\n` : ''}${url.priority !== undefined ? `    <priority>${url.priority}</priority>\n` : ''}  </url>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`
}

async function run() {
  console.log('🚀 Sitemap oluşturma işlemi başlatıldı...')

  try {
    const dynamicData = await sanityClient.fetch(`
      {
        "products": *[_type == "product" && defined(slug.current)] { "slug": slug.current, _updatedAt },
        "news": *[_type == "newsItem" && defined(slug.current)] { "slug": slug.current, _updatedAt },
        "projects": *[_type == "project" && defined(slug.current)] { "slug": slug.current, _updatedAt },
        "designers": *[_type == "designer" && defined(slug.current)] { "slug": slug.current, _updatedAt },
        "categories": *[_type == "category" && defined(slug.current)] { "slug": slug.current, _updatedAt }
      }
    `)

    const dynamicPages: SitemapUrl[] = [
      ...dynamicData.products.map((p: any) => ({
        loc: `/product/${p.slug}`,
        lastmod: new Date(p._updatedAt).toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.8,
      })),
      ...dynamicData.news.map((n: any) => ({
        loc: `/news/${n.slug}`,
        lastmod: new Date(n._updatedAt).toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: 0.7,
      })),
      ...dynamicData.projects.map((p: any) => ({
        loc: `/projects/${p.slug}`,
        lastmod: new Date(p._updatedAt).toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: 0.7,
      })),
      ...dynamicData.designers.map((d: any) => ({
        loc: `/designer/${d.slug}`,
        lastmod: new Date(d._updatedAt).toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: 0.6,
      })),
      ...dynamicData.categories.map((c: any) => ({
        loc: `/products/${c.slug}`,
        lastmod: new Date(c._updatedAt).toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.7,
      })),
    ]

    const allUrls = [...staticPages, ...dynamicPages]
    const sitemap = generateSitemapXml(allUrls)
    const outputPath = join(process.cwd(), 'public', 'sitemap.xml')

    writeFileSync(outputPath, sitemap, 'utf-8')
    console.log(`✅ Sitemap başarıyla oluşturuldu: ${outputPath}`)
    console.log(`   Toplam ${allUrls.length} URL eklendi (${dynamicPages.length} dinamik)`)
  } catch (error) {
    console.error('❌ Sitemap oluşturulurken hata:', error)
    process.exit(1)
  }
}

run()
