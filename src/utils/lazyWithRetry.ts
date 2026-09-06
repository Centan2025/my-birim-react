import React from 'react'

/**
 * Checks if an error is caused by a failed chunk/module dynamic import.
 * This typically happens when a new version of the application is deployed to production
 * and old chunk hashes are purged from the server/CDN, or due to a temporary network disruption.
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false
  const err = error as {name?: string; message?: string}
  const message = String(err.message || '').toLowerCase()
  const name = String(err.name || '')

  return (
    name === 'ChunkLoadError' ||
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('importing a module script failed') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('loading chunk') ||
    message.includes('failed to load module script') ||
    message.includes('dynamically imported module')
  )
}

/**
 * Wraps React.lazy with automatic retry and auto-reload mechanisms
 * to recover from new deployments and chunk loading failures seamlessly.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{default: T}>
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    const sessionKey = 'chunk_reload_done'
    const hasReloaded = sessionStorage.getItem(sessionKey) === 'true'

    try {
      const component = await componentImport()
      sessionStorage.removeItem(sessionKey)
      return component
    } catch (error) {
      if (isChunkLoadError(error)) {
        if (!hasReloaded) {
          // If a new deployment occurred, reload the page to get the updated index.html with new chunk hashes.
          sessionStorage.setItem(sessionKey, 'true')
          window.location.reload()
          // Return a pending promise so React doesn't render an error while reloading
          return new Promise<{default: T}>(() => {})
        }

        // If already reloaded once and failed again (e.g. slow network), retry after 1s before giving up
        try {
          await new Promise(resolve => setTimeout(resolve, 1000))
          const component = await componentImport()
          sessionStorage.removeItem(sessionKey)
          return component
        } catch (retryError) {
          sessionStorage.removeItem(sessionKey)
          throw retryError
        }
      }

      throw error
    }
  })
}
