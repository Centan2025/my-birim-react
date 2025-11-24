/**
 * React Query Client Configuration
 * 
 * API response caching için React Query yapılandırması
 */

import {QueryClient, QueryCache, MutationCache} from '@tanstack/react-query'
import {errorReporter} from './errorReporting'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Global error handler for queries
      if (import.meta.env.DEV) {
        console.error('[Query Error]', error, query)
      }
      
      // Error reporting
      if (error instanceof Error) {
        errorReporter.captureException(error, {
          tags: {
            type: 'query',
            queryKey: JSON.stringify(query.queryKey),
          },
          extra: {
            queryKey: query.queryKey,
            state: query.state,
          },
        })
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, variables, _context, mutation) => {
      // Global error handler for mutations
      if (import.meta.env.DEV) {
        console.error('[Mutation Error]', error, mutation)
      }
      
      // Error reporting
      if (error instanceof Error) {
        errorReporter.captureException(error, {
          tags: {
            type: 'mutation',
            mutationKey: JSON.stringify(mutation.options.mutationKey),
          },
          extra: {
            mutationKey: mutation.options.mutationKey,
            variables,
          },
        })
      }
    },
  }),
  defaultOptions: {
    queries: {
      // Default cache süresi: 5 dakika
      staleTime: 5 * 60 * 1000,
      // Default cache'de tutma süresi: 10 dakika
      gcTime: 10 * 60 * 1000, // Previously cacheTime
      // Retry: 3 kez dene
      retry: (failureCount, error) => {
        // Network hatalarında retry yap, 4xx hatalarında yapma
        if (error instanceof Error && 'status' in error) {
          const status = (error as any).status
          if (status >= 400 && status < 500) {
            return false // Client errors için retry yapma
          }
        }
        return failureCount < 3
      },
      // Retry delay: exponential backoff
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus: production'da false, dev'de true
      refetchOnWindowFocus: import.meta.env.DEV,
      // Refetch on reconnect: true (stale-while-revalidate pattern)
      refetchOnReconnect: true,
      // Refetch on mount: false (cache'den kullan, stale-while-revalidate)
      refetchOnMount: false,
      // Background refetch: stale data varsa arka planda yenile
      refetchInterval: false,
    },
    mutations: {
      // Mutation retry: 1 kez dene (sadece network hatalarında)
      retry: (failureCount, error) => {
        // Network hatalarında retry yap, 4xx hatalarında yapma
        if (error instanceof Error && 'status' in error) {
          const status = (error as any).status
          if (status >= 400 && status < 500) {
            return false // Client errors için retry yapma
          }
        }
        return failureCount < 1
      },
    },
  },
})


