/**
 * robots.txt Generator
 * Build zamanında robots.txt oluşturur
 *
 * Kullanım: npm run generate-robots
 * veya build script'ine eklenebilir
 */

import {writeFileSync} from 'fs'
import {join} from 'path'

const SITE_URL = process.env['VITE_SITE_URL'] || 'https://yourdomain.com'
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`

const robotsContent = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

# AI Crawler Permissions
User-agent: GPTBot
Allow: /
Disallow: /admin/

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: CCBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: YouBot
Allow: /

User-agent: Google-Extended
Allow: /

# Sitemap
Sitemap: ${SITEMAP_URL}
`

const outputPath = join(process.cwd(), 'public', 'robots.txt')

try {
  writeFileSync(outputPath, robotsContent, 'utf-8')
  console.log(`✅ robots.txt oluşturuldu: ${outputPath}`)
  console.log(`   Site URL: ${SITE_URL}`)
  console.log(`   Sitemap URL: ${SITEMAP_URL}`)
} catch (error) {
  console.error('❌ robots.txt oluşturulurken hata:', error)
  process.exit(1)
}
