import {useQuery} from '@tanstack/react-query'
import {getHomePageContent} from '../../services/cms'

/**
 * Ana sayfa içeriğini getir
 */
export function useHomePageContent() {
  return useQuery({
    queryKey: ['homePageContent'],
    queryFn: getHomePageContent,
    staleTime: 10 * 60 * 1000, // 10 dakika - ana sayfa orta sıklıkta güncellenebilir
    gcTime: 20 * 60 * 1000, // 20 dakika
    refetchOnMount: 'always', // Ana sayfa önemli, her mount'ta kontrol et
  })
}

