import {useQuery} from '@tanstack/react-query'
import {getDesigners, getDesignerById, getDesignersByIds} from '@/services/cms'

/**
 * Tüm tasarımcıları getir
 */
export function useDesigners() {
  return useQuery({
    queryKey: ['designers'],
    queryFn: getDesigners,
    staleTime: 15 * 60 * 1000, // 15 dakika - tasarımcılar az değişir
    gcTime: 30 * 60 * 1000, // 30 dakika
    refetchOnMount: false, // Tasarımcılar az değiştiği için mount'ta refetch yapma
  })
}

/**
 * ID'ye göre tasarımcı getir
 */
export function useDesigner(designerId: string | undefined, initialData?: any) {
  return useQuery({
    queryKey: ['designer', designerId],
    queryFn: () => {
      if (!designerId) throw new Error('Designer ID is required')
      return getDesignerById(designerId)
    },
    enabled: !!designerId,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: initialData ? false : 'always',
    initialData,
  })
}

/**
 * ID listesine göre tasarımcıları getir
 */
export function useDesignersByIds(designerIds: string[] | undefined) {
  return useQuery({
    queryKey: ['designers', designerIds],
    queryFn: () => {
      if (!designerIds || designerIds.length === 0) return []
      return getDesignersByIds(designerIds)
    },
    enabled: !!designerIds && designerIds.length > 0,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
  })
}
