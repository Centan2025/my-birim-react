/**
 * Warning and Error Suppression Utility
 * 
 * This module should be imported at the very top of the entry point (index.tsx)
 * to ensure that all console patches and global error handlers are active
 * before any other modules or SDKs (like Sentry) are initialized.
 */

type PatchedStorageMethod = ((this: Storage, ...args: unknown[]) => unknown) & { __patched?: boolean }

// 1. Patch Storage API (Silent Storage Access Errors)
if (typeof window !== 'undefined') {
    try {
        const StorageProto = window.Storage?.prototype as Storage & {
            [key: string]: PatchedStorageMethod | undefined
        }
        if (StorageProto) {
            const BLOCK_SUBSTRING = 'Access to storage is not allowed'
            const wrapMethod = (methodName: keyof Storage & string) => {
                const original = StorageProto[methodName] as PatchedStorageMethod | undefined
                if (typeof original !== 'function') return
                if (original.__patched) return // Already patched

                const patched: PatchedStorageMethod = function (this: Storage, ...args: unknown[]) {
                    try {
                        return original.apply(this, args)
                    } catch (err) {
                        const msg = err instanceof Error ? err.message : String((err as unknown) ?? '')
                        if (typeof msg === 'string' && msg.includes(BLOCK_SUBSTRING)) {
                            if (methodName === 'getItem' || methodName === 'key') return null
                            return undefined
                        }
                        throw err
                    }
                }
                patched.__patched = true
                StorageProto[methodName] = patched
            }

            wrapMethod('getItem')
            wrapMethod('setItem')
            wrapMethod('removeItem')
            wrapMethod('clear')
            wrapMethod('key')
        }
    } catch {
        // Fail silently
    }
}

// 2. Patch Console (Deprecation and Non-Critical Filter)
if (typeof window !== 'undefined') {
    // Filter console.warn
    const originalWarn = console.warn
    console.warn = (...args: unknown[]) => {
        const message = args.map(String).join(' ')
        // Filter out Zustand deprecation warnings
        if (
            typeof message === 'string' &&
            (message.includes('[DEPRECATED] Default export is deprecated') ||
                message.includes('zustand'))
        ) {
            return
        }
        originalWarn.apply(console, args)
    }

    // Filter console.error
    const originalError = console.error
    console.error = (...args: unknown[]) => {
        const message = args.map(String).join(' ')
        const IGNORABLES = [
            'Access to storage is not allowed',
            'Could not fetch session',
            'Uncaught (in promise)',
            'ERR_NAME_NOT_RESOLVED',
            'Failed to fetch'
        ]

        if (typeof message === 'string' && IGNORABLES.some(term => message.includes(term))) {
            return
        }
        originalError.apply(console, args)
    }
}

// 3. Global Unhandled Rejection Handlers
if (typeof window !== 'undefined') {
    const isIgnorable = (msg: string) => {
        return (
            msg.includes('Could not fetch session') ||
            msg.includes('Access to storage is not allowed') ||
            msg.includes('Failed to fetch') ||
            msg.includes('NetworkError')
        )
    }

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
        const msg = event.reason?.message || event.reason?.toString() || ''
        if (isIgnorable(msg)) {
            event.preventDefault()
            event.stopPropagation()
        }
    }, true)

    window.addEventListener('error', (event: ErrorEvent) => {
        const msg = event.message || event.error?.message || ''
        if (isIgnorable(msg)) {
            event.preventDefault()
            event.stopPropagation()
        }
    }, true)
}
