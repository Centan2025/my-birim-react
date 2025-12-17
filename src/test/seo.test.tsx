import React from 'react'
import {describe, it, expect} from 'vitest'
import {render} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {HelmetProvider} from 'react-helmet-async'

import {SEOProvider, useSEO} from '../hooks/useSEO'
import {addStructuredData, getArticleSchema} from '../lib/seo'

const SeoTestComponent: React.FC = () => {
  useSEO({
    title: 'BIRIM - Test Page',
    description: 'Test description',
    image: 'https://example.com/test.jpg',
    type: 'website',
    siteName: 'BIRIM',
    locale: 'tr_TR',
  })
  return <div>SEO Test</div>
}

describe('useSEO hook', () => {
  it('updates document title and basic meta tags', () => {
    render(
      <HelmetProvider>
        <SEOProvider>
          <MemoryRouter initialEntries={['/test']}>
            <SeoTestComponent />
          </MemoryRouter>
        </SEOProvider>
      </HelmetProvider>
    )

    expect(document.title).toBe('BIRIM - Test Page')

    const desc = document.querySelector('meta[name="description"]')
    expect(desc?.getAttribute('content')).toBe('Test description')

    const ogTitle = document.querySelector('meta[property="og:title"]')
    expect(ogTitle?.getAttribute('content')).toBe('BIRIM - Test Page')

    const ogImage = document.querySelector('meta[property="og:image"]')
    expect(ogImage?.getAttribute('content')).toBe('https://example.com/test.jpg')
  })
})

describe('structured data helpers', () => {
  it('injects Article JSON-LD into the document head', () => {
    const schema = getArticleSchema({
      headline: 'News Headline',
      description: 'News description',
      image: 'https://example.com/news.jpg',
      datePublished: '2025-01-01T00:00:00.000Z',
      author: {name: 'BIRIM'},
      publisher: {name: 'BIRIM', logo: 'https://example.com/logo.png'},
    })

    addStructuredData(schema, 'test-article-schema')

    const script = document.getElementById('test-article-schema')
    expect(script).not.toBeNull()
    expect(script?.getAttribute('type')).toBe('application/ld+json')

    const parsed = JSON.parse(script!.textContent || '{}')
    expect(parsed['@type']).toBe('Article')
    expect(parsed.headline).toBe('News Headline')
    expect(parsed.description).toBe('News description')
  })
})

