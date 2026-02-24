import {useQuery} from '@tanstack/react-query'
import {getHomePageContent} from '@/services/cms'

/**
 * Ana sayfa içeriğini getir
 */
export function useHomePageContent() {
  return useQuery({
    queryKey: ['homePageContent'],
    queryFn: getHomePageContent,
    staleTime: 30 * 1000, // 30 saniye — CMS değişiklikleri hızlıca yansısın
    gcTime: 5 * 60 * 1000, // 5 dakika
    refetchOnMount: 'always', // Ana sayfa önemli, her mount'ta kontrol et
  })
}
