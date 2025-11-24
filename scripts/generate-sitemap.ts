/**
 * Sitemap Generator
 * Build zamanında sitemap.xml oluşturur
 * 
 * Kullanım: npm run generate-sitemap
 * veya build script'ine eklenebilir
 */

import {writeFileSync} from 'fs'
import {join} from 'path'

interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

const BASE_URL = process.env['VITE_SITE_URL'] || 'https://yourdomain.com'

// Statik sayfalar
// Not: HashRouter kullanıldığı için URL'lerde # kullanılmıyor (sitemap için)
const staticPages: SitemapUrl[] = [
  {loc: '/', changefreq: 'daily', priority: 1.0},
  {loc: '/about', changefreq: 'monthly', priority: 0.8},
  {loc: '/contact', changefreq: 'monthly', priority: 0.8},
  {loc: '/products', changefreq: 'weekly', priority: 0.9},
  {loc: '/designers', changefreq: 'weekly', priority: 0.9},
  {loc: '/projects', changefreq: 'weekly', priority: 0.9},
  {loc: '/news', changefreq: 'daily', priority: 0.8},
  {loc: '/categories', changefreq: 'weekly', priority: 0.7},
]

// XML sitemap oluştur
const generateSitemap = (urls: SitemapUrl[]): string => {
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

// Sitemap'i oluştur ve kaydet
const sitemap = generateSitemap(staticPages)
const outputPath = join(process.cwd(), 'public', 'sitemap.xml')

try {
  writeFileSync(outputPath, sitemap, 'utf-8')
  console.log(`✅ Sitemap oluşturuldu: ${outputPath}`)
  console.log(`   ${staticPages.length} URL eklendi`)
} catch (error) {
  console.error('❌ Sitemap oluşturulurken hata:', error)
  process.exit(1)
}


