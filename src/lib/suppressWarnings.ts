/**
 * Warning and Error Suppression Utility
 * 
 * This module should be imported at the very top of the entry point (index.tsx)
 * to ensure that all console patches and global error handlers are active
 * before any other modules or SDKs (like Sentry) are initialized.
 */

export { } // Make this file a proper ES module so `declare global` works

declare global {
    interface Window {
        __SUPPRESSION_ACTIVE?: boolean;
    }
}

const suppress = () => {
    if (typeof window === 'undefined' || window.__SUPPRESSION_ACTIVE) return;
    window.__SUPPRESSION_ACTIVE = true;

    // 1. Patch Storage API (Silent Storage Access Errors)
    try {
        const StorageProto = window.Storage?.prototype;
        if (StorageProto) {
            const BLOCK_SUB_1 = 'Access to storage is not allowed';
            const BLOCK_SUB_2 = 'The operation is insecure'; // Safari alternative

            const wrapMethod = (methodName: keyof Storage) => {
                const original = StorageProto[methodName] as Function;
                if (typeof original !== 'function') return;

                StorageProto[methodName] = function (this: Storage, ...args: unknown[]) {
                    try {
                        return original.apply(this, args);
                    } catch (err) {
                        const msg = err instanceof Error ? err.message : String(err);
                        if (msg.includes(BLOCK_SUB_1) || msg.includes(BLOCK_SUB_2)) {
                            if (methodName === 'getItem' || methodName === 'key') return null;
                            return undefined;
                        }
                        throw err;
                    }
                } as any;
            };

            ['getItem', 'setItem', 'removeItem', 'clear', 'key'].forEach(m => wrapMethod(m as keyof Storage));
        }
    } catch { /* Silent */ }

    // 2. Patch Console (Deprecation and Non-Critical Filter)
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
        const message = args.map(String).join(' ');
        // Filter out Zustand deprecation warnings and other non-critical noise
        if (
            message.includes('zustand') ||
            message.includes('deprecated') ||
            message.includes('Default export is deprecated') ||
            message.includes('instrument') // Filter Sentry instrument noise
        ) {
            return;
        }
        originalWarn.apply(console, args);
    };

    // Also patch console.log — some third-party bundles (e.g. Vercel Sentry instrument)
    // emit the Zustand deprecation via console.log instead of console.warn
    const originalLog = console.log;
    console.log = (...logArgs: unknown[]) => {
        const logMessage = logArgs.map(String).join(' ');
        if (
            logMessage.includes('[DEPRECATED]') ||
            logMessage.includes('Default export is deprecated') ||
            (logMessage.includes('zustand') && logMessage.includes('deprecated'))
        ) {
            return;
        }
        originalLog.apply(console, logArgs);
    };

    const originalError = console.error;
    console.error = (...args: unknown[]) => {
        const message = args.map(String).join(' ');
        const IGNORABLES = [
            'Access to storage is not allowed',
            'The operation is insecure',
            'Could not fetch session',
            'Uncaught (in promise)',
            'ERR_NAME_NOT_RESOLVED',
            'Failed to fetch'
        ];
        if (IGNORABLES.some(term => message.includes(term))) return;
        originalError.apply(console, args);
    };

    // 3. Global Unhandled Rejection Handlers
    const isIgnorable = (msg: string) => {
        const normalized = msg.toLowerCase();
        const IGNORABLES = [
            'could not fetch session',
            'access to storage is not allowed',
            'the operation is insecure',
            'failed to fetch',
            'networkerror'
        ];
        return IGNORABLES.some(term => normalized.includes(term));
    };

    window.addEventListener('unhandledrejection', (event) => {
        const msg = event.reason?.message || event.reason?.toString() || '';
        if (isIgnorable(msg)) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, true);

    window.addEventListener('error', (event) => {
        const msg = event.message || event.error?.message || '';
        if (isIgnorable(msg)) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, true);
};

suppress();
