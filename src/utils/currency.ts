/**
 * Normalizes user/CMS-supplied currency codes to ISO 4217 standard.
 * e.g., 'TL', 'tl', 'TL ', '₺' -> 'TRY'
 */
export function normalizeCurrency(curr?: string | null): string {
  if (!curr || typeof curr !== 'string') return 'TRY'
  const trimmed = curr.trim().toUpperCase()
  if (trimmed === 'TL' || trimmed === '₺') return 'TRY'
  if (trimmed === '$') return 'USD'
  if (trimmed === '€') return 'EUR'
  return trimmed || 'TRY'
}

/**
 * Safely formats monetary amounts using Intl.NumberFormat without throwing RangeError on invalid currency codes.
 */
export function formatCurrency(
  amount: number,
  currency: string = 'TRY',
  locale: string = 'tr-TR',
  options?: Intl.NumberFormatOptions
): string {
  const normalized = normalizeCurrency(currency)
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: normalized,
      maximumFractionDigits: 2,
      ...options,
    }).format(amount)
  } catch {
    const symbol =
      normalized === 'TRY'
        ? '₺'
        : normalized === 'USD'
          ? '$'
          : normalized === 'EUR'
            ? '€'
            : normalized
    return `${amount.toLocaleString(locale)} ${symbol}`
  }
}
