import {describe, it, expect, vi, beforeEach} from 'vitest'

vi.mock('./client', () => ({
  sanity: {
    fetch: vi.fn(),
  },
  useSanity: true,
  mapImage: vi.fn(val => val?.url || 'http://image.url'),
  mapMediaUrl: vi.fn(val => 'http://media.url'),
  extractPalette: vi.fn(val => ({})),
}))

import {sanity} from './client'
import {getNews, getProjects} from './news'

describe('sanity news and projects service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getNews tüm haberleri döner ve ID projection kullanır', async () => {
    vi.mocked(sanity.fetch).mockResolvedValue([
      {
        id: 'news-1',
        title: {tr: 'Haber'},
        mainImageR2: {url: 'img.png'},
      },
    ])
    const news = await getNews()
    expect(news).toHaveLength(1)
    expect(news[0].id).toBe('news-1')
  })

  it('getProjects tüm projeleri döner ve ID projection kullanır', async () => {
    vi.mocked(sanity.fetch).mockResolvedValue([
      {
        id: 'proj-1',
        title: {tr: 'Proje'},
        coverR2: {url: 'cover.png'},
      },
    ])
    const projects = await getProjects()
    expect(projects).toHaveLength(1)
    expect(projects[0].id).toBe('proj-1')
  })
})
