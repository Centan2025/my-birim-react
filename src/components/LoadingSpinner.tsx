interface LoadingSpinnerProps {
  /** Loading mesajı */
  message?: string
  /** Tam ekran mı? */
  fullScreen?: boolean
  /** Küçük spinner mı? */
  small?: boolean
  /** Özel className */
  className?: string
}

/**
 * Loading Spinner Component
 * Tüm sayfalarda tutarlı loading gösterimi için
 */
export function LoadingSpinner({
  message,
  fullScreen = false,
  small = false,
  className = '',
}: LoadingSpinnerProps) {
  const spinnerSize = small ? 'h-4 w-4' : 'h-12 w-12'
  const containerClass = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50'
    : 'flex items-center justify-center py-20'

  return (
    <div className={`${containerClass} ${className}`}>
      <div className="text-center">
        <div
          className={`inline-block animate-spin rounded-full border-2 border-neutral-900 dark:border-white border-t-transparent ${spinnerSize} mb-4`}
        ></div>
        {message && (
          <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Inline Loading Spinner (küçük)
 */
export function InlineLoadingSpinner({className = ''}: {className?: string}) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent h-4 w-4"></div>
    </div>
  )
}

/**
 * Page Loading Component
 * Sayfa yüklenirken gösterilir
 */
export function PageLoading({message}: {message?: string}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <LoadingSpinner message={message || 'Yükleniyor...'} />
    </div>
  )
}
