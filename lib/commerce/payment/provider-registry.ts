import type {PaymentProvider} from './provider'
import {mockPaymentProvider} from './mock-provider'
import {PaymentError} from './errors'

const registry = new Map<string, PaymentProvider>()

// Register default mock provider
registry.set('mock', mockPaymentProvider)
registry.set('test', mockPaymentProvider)

/**
 * Registers a payment provider adapter into the global registry.
 */
export function registerPaymentProvider(provider: PaymentProvider): void {
  registry.set(provider.id.toLowerCase(), provider)
}

/**
 * Resolves configured payment provider from environment or argument.
 */
export function getPaymentProvider(providerId?: string): PaymentProvider {
  const configuredId = (providerId || process.env['PAYMENT_PROVIDER'] || 'mock')
    .toLowerCase()
    .trim()

  const provider = registry.get(configuredId)
  if (!provider) {
    throw new PaymentError(
      500,
      'PAYMENT_PROVIDER_NOT_CONFIGURED',
      `Ödeme sağlayıcısı bulunamadı veya yapılandırılmamış: ${configuredId}`
    )
  }

  return provider
}
