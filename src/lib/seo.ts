/**
 * SEO Utilities
 * Dinamik meta tags, Open Graph, Twitter Cards için
 */

export interface SEOData {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product' | 'profile'
  siteName?: string
  locale?: string
  author?: string
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
}

/**
 * Meta tag'leri güncelle
 */
export const updateMetaTags = (data: SEOData): void => {
  if (typeof document === 'undefined') return

  // Title
  if (data.title) {
    document.title = data.title
    updateMetaTag('property', 'og:title', data.title)
    updateMetaTag('name', 'twitter:title', data.title)
  }

  // Description
  if (data.description) {
    updateMetaTag('name', 'description', data.description)
    updateMetaTag('property', 'og:description', data.description)
    updateMetaTag('name', 'twitter:description', data.description)
  }

  // Image
  if (data.image) {
    updateMetaTag('property', 'og:image', data.image)
    updateMetaTag('name', 'twitter:image', data.image)
    updateMetaTag('name', 'twitter:card', 'summary_large_image')
  } else {
    updateMetaTag('name', 'twitter:card', 'summary')
  }

  // URL
  if (data.url) {
    updateMetaTag('property', 'og:url', data.url)
  }

  // Type
  if (data.type) {
    updateMetaTag('property', 'og:type', data.type)
  }

  // Site Name
  if (data.siteName) {
    updateMetaTag('property', 'og:site_name', data.siteName)
  }

  // Locale
  if (data.locale) {
    updateMetaTag('property', 'og:locale', data.locale)
  }

  // Author (article için)
  if (data.author) {
    updateMetaTag('name', 'author', data.author)
    updateMetaTag('property', 'article:author', data.author)
  }

  // Published Time (article için)
  if (data.publishedTime) {
    updateMetaTag('property', 'article:published_time', data.publishedTime)
  }

  // Modified Time (article için)
  if (data.modifiedTime) {
    updateMetaTag('property', 'article:modified_time', data.modifiedTime)
  }

  // Section (article için)
  if (data.section) {
    updateMetaTag('property', 'article:section', data.section)
  }

  // Tags (article için)
  if (data.tags && data.tags.length > 0) {
    data.tags.forEach((tag, index) => {
      updateMetaTag('property', `article:tag`, tag, index)
    })
  }
}

/**
 * Meta tag oluştur veya güncelle
 */
const updateMetaTag = (
  attribute: 'name' | 'property',
  attributeValue: string,
  content: string,
  index?: number
): void => {
  if (typeof document === 'undefined') return

  const selector = `meta[${attribute}="${attributeValue}"]`
  let element = document.querySelector(selector) as HTMLMetaElement

  // Eğer tag yoksa oluştur
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, attributeValue)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

/**
 * Canonical URL ekle
 */
export const setCanonicalUrl = (url: string): void => {
  if (typeof document === 'undefined') return

  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', url)
}

/**
 * Structured Data (JSON-LD) ekle
 */
export const addStructuredData = (data: Record<string, any>, id?: string): void => {
  if (typeof document === 'undefined') return

  const scriptId = id || 'structured-data'
  let script = document.getElementById(scriptId) as HTMLScriptElement

  if (script) {
    script.textContent = JSON.stringify(data)
  } else {
    script = document.createElement('script')
    script.id = scriptId
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)
  }
}

/**
 * Organization Schema.org data
 */
export const getOrganizationSchema = (data: {
  name: string
  url: string
  logo?: string
  description?: string
  sameAs?: string[]
}): Record<string, any> => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name,
    url: data.url,
    ...(data.logo && {logo: data.logo}),
    ...(data.description && {description: data.description}),
    ...(data.sameAs && data.sameAs.length > 0 && {sameAs: data.sameAs}),
  }
}

/**
 * Article Schema.org data
 */
export const getArticleSchema = (data: {
  headline: string
  description: string
  image?: string
  datePublished: string
  dateModified?: string
  author: {
    name: string
    url?: string
  }
  publisher: {
    name: string
    logo?: string
  }
}): Record<string, any> => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.headline,
    description: data.description,
    ...(data.image && {image: data.image}),
    datePublished: data.datePublished,
    ...(data.dateModified && {dateModified: data.dateModified}),
    author: {
      '@type': 'Person',
      name: data.author.name,
      ...(data.author.url && {url: data.author.url}),
    },
    publisher: {
      '@type': 'Organization',
      name: data.publisher.name,
      ...(data.publisher.logo && {
        logo: {
          '@type': 'ImageObject',
          url: data.publisher.logo,
        },
      }),
    },
  }
}

/**
 * Product Schema.org data
 */
export const getProductSchema = (data: {
  name: string
  description: string
  image?: string | string[]
  brand?: string
  offers?: {
    price: string
    priceCurrency: string
    availability?: string
  }
}): Record<string, any> => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    description: data.description,
    ...(data.image && {
      image: Array.isArray(data.image) ? data.image : [data.image],
    }),
    ...(data.brand && {
      brand: {
        '@type': 'Brand',
        name: data.brand,
      },
    }),
    ...(data.offers && {
      offers: {
        '@type': 'Offer',
        price: data.offers.price,
        priceCurrency: data.offers.priceCurrency,
        ...(data.offers.availability && {availability: data.offers.availability}),
      },
    }),
  }
}


