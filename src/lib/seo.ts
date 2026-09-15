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
  schema?: Record<string, unknown> | Record<string, unknown>[]
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
    data.tags.forEach(tag => {
      updateMetaTag('property', `article:tag`, tag)
    })
  }
}

/**
 * Meta tag oluştur veya güncelle
 */
const updateMetaTag = (
  attribute: 'name' | 'property',
  attributeValue: string,
  content: string
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
export const addStructuredData = (data: Record<string, unknown>, id?: string): void => {
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
  foundingDate?: string
  email?: string
  telephone?: string
  sameAs?: string[]
  brand?: string
  knowsAbout?: string[]
}): Record<string, unknown> => {
  const orgUrl = data.url || 'https://www.birim.com'
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${orgUrl}/#organization`,
    name: data.name,
    legalName: 'Birim Mobilya',
    url: orgUrl,
    ...(data.logo && {
      logo: {
        '@type': 'ImageObject',
        url: data.logo,
        width: 180,
        height: 60,
      },
    }),
    description:
      data.description ||
      'Birim is a Turkish furniture design and manufacturing company founded in 1978, specializing in custom furniture, contract furniture and architectural projects.',
    foundingDate: data.foundingDate || '1978',
    brand: {
      '@type': 'Brand',
      name: data.brand || 'Birim',
    },
    ...(data.knowsAbout && data.knowsAbout.length > 0 && {knowsAbout: data.knowsAbout}),
    contactPoint: {
      '@type': 'ContactPoint',
      email: data.email || 'info@birim.com',
      ...(data.telephone && {telephone: data.telephone}),
      contactType: 'customer service',
      areaServed: 'TR',
      availableLanguage: ['Turkish', 'English'],
    },
    sameAs: data.sameAs || [
      'https://www.instagram.com/birim',
      'https://www.linkedin.com/company/birim',
    ],
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
}): Record<string, unknown> => {
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
  sku?: string
  category?: string
  material?: string
  color?: string
  manufacturer?: string
  creator?: {
    name: string
    url?: string
  }
  offers?: {
    price: string
    priceCurrency: string
    availability?: string
    url?: string
  }
}): Record<string, unknown> => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    description: data.description,
    ...(data.sku && {sku: data.sku}),
    ...(data.category && {category: data.category}),
    ...(data.material && {material: data.material}),
    ...(data.color && {color: data.color}),
    ...(data.image && {
      image: Array.isArray(data.image) ? data.image : [data.image],
    }),
    brand: {
      '@type': 'Brand',
      name: data.brand || 'Birim',
    },
    manufacturer: {
      '@type': 'Organization',
      name: data.manufacturer || 'Birim',
      '@id': 'https://www.birim.com/#organization',
    },
    ...(data.creator && {
      creator: {
        '@type': 'Person',
        name: data.creator.name,
        ...(data.creator.url && {url: data.creator.url}),
      },
    }),
    ...(data.offers &&
      data.offers.price &&
      data.offers.price !== '0.00' &&
      data.offers.price !== '0' && {
        offers: {
          '@type': 'Offer',
          price: data.offers.price,
          priceCurrency: data.offers.priceCurrency || 'TRY',
          ...(data.offers.availability && {availability: data.offers.availability}),
          ...(data.offers.url && {url: data.offers.url}),
        },
      }),
  }
}

/**
 * BreadcrumbList Schema.org data
 */
export const getBreadcrumbSchema = (
  items: {name: string; url?: string}[]
): Record<string, unknown> => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url && {item: item.url}),
    })),
  }
}

/**
 * AboutPage Schema.org data
 */
export const getAboutPageSchema = (data: {
  name: string
  url: string
  description?: string
  mainEntityUrl?: string
}): Record<string, unknown> => {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: data.name,
    url: data.url,
    ...(data.description && {description: data.description}),
    mainEntity: {
      '@id': data.mainEntityUrl || 'https://www.birim.com/#organization',
    },
  }
}

/**
 * WebSite Schema.org data
 */
export const getWebSiteSchema = (data: {
  name: string
  url: string
  description?: string
  potentialAction?: {
    target: string
    queryInput: string
  }
}): Record<string, unknown> => {
  const siteUrl = data.url || 'https://www.birim.com'
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: data.name || 'Birim',
    url: siteUrl,
    description:
      data.description ||
      'Birim is a Turkish furniture design and manufacturing company founded in 1978.',
    publisher: {
      '@id': `${siteUrl}/#organization`,
    },
    ...(data.potentialAction && {
      potentialAction: {
        '@type': 'SearchAction',
        target: data.potentialAction.target,
        'query-input': data.potentialAction.queryInput,
      },
    }),
  }
}

/**
 * CreativeWork / Project Schema.org data
 */
export const getProjectSchema = (data: {
  name: string
  description: string
  image?: string
  datePublished?: string
  location?: string
  category?: string
}): Record<string, unknown> => {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: data.name,
    description: data.description,
    ...(data.image && {image: data.image}),
    ...(data.datePublished && {datePublished: data.datePublished}),
    ...(data.location && {
      locationCreated: {
        '@type': 'Place',
        name: data.location,
      },
    }),
    ...(data.category && {genre: data.category}),
  }
}

/**
 * CollectionPage Schema.org data
 * Kategori listeleri, tasarımcılar sayfası gibi koleksiyon sayfaları için
 */
export const getCollectionPageSchema = (data: {
  name: string
  description: string
  url: string
  items?: {name: string; url: string; image?: string}[]
}): Record<string, unknown> => {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: data.name,
    description: data.description,
    url: data.url,
    ...(data.items &&
      data.items.length > 0 && {
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: data.items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            url: item.url,
            ...(item.image && {image: item.image}),
          })),
          numberOfItems: data.items.length,
        },
      }),
  }
}

/**
 * ContactPage Schema.org data
 * İletişim sayfası için
 */
export const getContactPageSchema = (data: {
  name: string
  url: string
  description?: string
  telephone?: string
  email?: string
  address?: {
    street?: string
    city?: string
    region?: string
    postalCode?: string
    country?: string
  }
  openingHours?: string[]
  geo?: {latitude: number; longitude: number}
}): Record<string, unknown> => {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: data.name,
    url: data.url,
    ...(data.description && {description: data.description}),
    mainEntity: {
      '@type': 'Organization',
      name: 'BIRIM',
      ...(data.telephone && {telephone: data.telephone}),
      ...(data.email && {email: data.email}),
      ...(data.address && {
        address: {
          '@type': 'PostalAddress',
          ...(data.address.street && {streetAddress: data.address.street}),
          ...(data.address.city && {addressLocality: data.address.city}),
          ...(data.address.region && {addressRegion: data.address.region}),
          ...(data.address.postalCode && {postalCode: data.address.postalCode}),
          ...(data.address.country && {addressCountry: data.address.country}),
        },
      }),
      ...(data.openingHours && {openingHours: data.openingHours}),
      ...(data.geo && {
        geo: {
          '@type': 'GeoCoordinates',
          latitude: data.geo.latitude,
          longitude: data.geo.longitude,
        },
      }),
    },
  }
}

/**
 * FAQPage Schema.org data
 * SSS sayfaları veya FAQ bölümleri için
 */
export const getFAQSchema = (
  questions: {question: string; answer: string}[]
): Record<string, unknown> => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  }
}

/**
 * ItemList Schema.org data
 * Ürün listesi, proje listesi gibi sıralı listeler için
 */
export const getItemListSchema = (data: {
  name: string
  description?: string
  items: {name: string; url: string; image?: string; position?: number}[]
}): Record<string, unknown> => {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: data.name,
    ...(data.description && {description: data.description}),
    numberOfItems: data.items.length,
    itemListElement: data.items.map((item, index) => ({
      '@type': 'ListItem',
      position: item.position || index + 1,
      name: item.name,
      url: item.url,
      ...(item.image && {image: item.image}),
    })),
  }
}

/**
 * LocalBusiness / ManufacturingBusiness Schema.org data
 * Fabrika sayfası için
 */
export const getManufacturingBusinessSchema = (data: {
  name: string
  description: string
  url: string
  image?: string
  telephone?: string
  email?: string
  address?: {
    street?: string
    city?: string
    region?: string
    postalCode?: string
    country?: string
  }
}): Record<string, unknown> => {
  return {
    '@context': 'https://schema.org',
    '@type': 'ManufacturingBusiness',
    name: data.name,
    description: data.description,
    url: data.url,
    ...(data.image && {image: data.image}),
    ...(data.telephone && {telephone: data.telephone}),
    ...(data.email && {email: data.email}),
    ...(data.address && {
      address: {
        '@type': 'PostalAddress',
        ...(data.address.street && {streetAddress: data.address.street}),
        ...(data.address.city && {addressLocality: data.address.city}),
        ...(data.address.region && {addressRegion: data.address.region}),
        ...(data.address.postalCode && {postalCode: data.address.postalCode}),
        ...(data.address.country && {addressCountry: data.address.country}),
      },
    }),
  }
}

/**
 * BIRIM site URL'sini döndürür
 */
export const getSiteUrl = (): string => {
  if (typeof window !== 'undefined') return window.location.origin
  return 'https://www.birim.com'
}

/**
 * Temiz standart Canonical URL oluşturur (SEO uyumlu)
 */
export const getCanonicalUrl = (path: string): string => {
  const base = getSiteUrl()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${cleanPath}`
}
