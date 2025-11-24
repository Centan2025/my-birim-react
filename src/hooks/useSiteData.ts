import {useQuery} from '@tanstack/react-query'
import {getSiteSettings, getFooterContent} from '../../services/cms'
import type {SiteSettings, FooterContent} from '../../types'

/**
 * Site ayarlarını getir
 */
export function useSiteSettings() {
  return useQuery({
    queryKey: ['siteSettings'],
    queryFn: getSiteSettings,
    staleTime: 30 * 60 * 1000, // 30 dakika - ayarlar çok sık değişmez
    gcTime: 60 * 60 * 1000, // 1 saat - ayarlar uzun süre cache'de tutulabilir
    refetchOnMount: false, // Ayarlar çok az değiştiği için mount'ta refetch yapma
  })
}

/**
 * Footer içeriğini getir
 */
export function useFooterContent() {
  return useQuery({
    queryKey: ['footerContent'],
    queryFn: getFooterContent,
    staleTime: 30 * 60 * 1000, // 30 dakika
    gcTime: 60 * 60 * 1000, // 1 saat
    refetchOnMount: false,
  })
}
