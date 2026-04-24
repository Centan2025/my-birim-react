/**
 * robots.txt Generator
 * Build zamanında robots.txt oluşturur
 *
 * AI crawler'lar ve arama motoru botları için kapsamlı kurallar içerir.
 * Google, Bing, Yandex + GPTBot, Claude, Perplexity, Google Gemini ve diğer AI botları.
 *
 * Kullanım: npm run generate-robots
 * veya build script'ine eklenebilir
 */

import {writeFileSync} from 'fs'
import {join} from 'path'
import * as dotenv from 'dotenv'

// .env dosyasını yükle
dotenv.config()

const SITE_URL = process.env['VITE_SITE_URL'] || 'https://www.birim.com'
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`

const robotsContent = `# ================================================================
# BIRIM - robots.txt
# Modern tasarım ve mobilya markası
# Güncellenme tarihi: ${new Date().toISOString().split('T')[0]}
# ================================================================

# ----------------------------------------------------------------
# Genel Kurallar - Tüm Botlar
# ----------------------------------------------------------------
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /login
Disallow: /profile
Disallow: /verify-email
Disallow: /reset-password
Crawl-delay: 1

# ----------------------------------------------------------------
# Google Botları
# ----------------------------------------------------------------
User-agent: Googlebot
Allow: /
Disallow: /admin/
Disallow: /api/

User-agent: Googlebot-Image
Allow: /

User-agent: Googlebot-Video
Allow: /

# Google AI (Gemini) - İçerik keşfi için izin ver
User-agent: Google-Extended
Allow: /

User-agent: GoogleOther
Allow: /

# ----------------------------------------------------------------
# Bing Bot
# ----------------------------------------------------------------
User-agent: Bingbot
Allow: /
Disallow: /admin/
Disallow: /api/

User-agent: msnbot
Allow: /

# ----------------------------------------------------------------
# Yandex Bot
# ----------------------------------------------------------------
User-agent: YandexBot
Allow: /
Disallow: /admin/

# ----------------------------------------------------------------
# AI Crawler İzinleri
# ----------------------------------------------------------------

# OpenAI GPTBot - ChatGPT web browsing
User-agent: GPTBot
Allow: /
Disallow: /admin/
Disallow: /api/

# OpenAI ChatGPT User
User-agent: ChatGPT-User
Allow: /

# Anthropic Claude Web
User-agent: Claude-Web
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

# Common Crawl (eğitim verisi)
User-agent: CCBot
Allow: /

# Perplexity AI
User-agent: PerplexityBot
Allow: /

# You.com
User-agent: YouBot
Allow: /

# Cohere AI
User-agent: cohere-ai
Allow: /

# Meta AI
User-agent: FacebookBot
Allow: /

User-agent: meta-externalagent
Allow: /

# Apple Bot (Siri, Spotlight)
User-agent: Applebot
Allow: /

# Amazon Alexa
User-agent: ia_archiver
Allow: /

# Brave Search
User-agent: BraveBot
Allow: /

# DuckDuckBot
User-agent: DuckDuckBot
Allow: /

# ----------------------------------------------------------------
# Sitemap
# ----------------------------------------------------------------
Sitemap: ${SITEMAP_URL}

# ----------------------------------------------------------------
# Host (Yandex ve diğerleri için)
# ----------------------------------------------------------------
Host: ${SITE_URL}
`

const outputPath = join(process.cwd(), 'dist', 'robots.txt')
const publicOutputPath = join(process.cwd(), 'public', 'robots.txt')

try {
  writeFileSync(outputPath, robotsContent, 'utf-8')
  writeFileSync(publicOutputPath, robotsContent, 'utf-8')
  console.log(`✅ robots.txt oluşturuldu: ${outputPath}`)
  console.log(`   Site URL: ${SITE_URL}`)
  console.log(`   Sitemap URL: ${SITEMAP_URL}`)
} catch (error) {
  console.error('❌ robots.txt oluşturulurken hata:', error)
  process.exit(1)
}
