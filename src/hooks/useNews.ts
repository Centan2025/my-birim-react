import {useQuery} from '@tanstack/react-query'
import {getNews, getNewsById} from '../../services/cms'
import type {NewsItem} from '../../types'

/**
 * Tüm haberleri getir
 */
export function useNews() {
  return useQuery({
    queryKey: ['news'],
    queryFn: getNews,
    staleTime: 3 * 60 * 1000, // 3 dakika - haberler daha sık güncellenebilir
    gcTime: 10 * 60 * 1000, // 10 dakika
    refetchOnMount: 'always', // Haberler sık değiştiği için her mount'ta kontrol et
  })
}

/**
 * ID'ye göre haber getir
 */
export function useNewsItem(newsId: string | undefined) {
  return useQuery({
    queryKey: ['news', newsId],
    queryFn: () => {
      if (!newsId) throw new Error('News ID is required')
      return getNewsById(newsId)
    },
    enabled: !!newsId,
    staleTime: 10 * 60 * 1000, // 10 dakika - detay sayfası daha az değişir
    gcTime: 30 * 60 * 1000, // 30 dakika
    refetchOnMount: 'always',
  })
}
