import {useQuery} from '@tanstack/react-query'
import {getProjects, getProjectById} from '../../services/cms'
import type {Project} from '../../types'

/**
 * Tüm projeleri getir
 */
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    staleTime: 10 * 60 * 1000, // 10 dakika - projeler orta sıklıkta güncellenir
    gcTime: 20 * 60 * 1000, // 20 dakika
    refetchOnMount: 'always',
  })
}

/**
 * ID'ye göre proje getir
 */
export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => {
      if (!projectId) throw new Error('Project ID is required')
      return getProjectById(projectId)
    },
    enabled: !!projectId,
    staleTime: 15 * 60 * 1000, // 15 dakika - detay sayfası daha az değişir
    gcTime: 30 * 60 * 1000, // 30 dakika
    refetchOnMount: 'always',
  })
}
