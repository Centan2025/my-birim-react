/**
 * Environment Variable Validation
 * Uygulama başlangıcında environment variable'ları validate eder
 */

import {z} from 'zod'

/**
 * Environment variable schema
 */
const envSchema = z.object({
  // Sanity CMS
  VITE_SANITY_PROJECT_ID: z.string().min(1).optional().default('wn3a082f'),
  VITE_SANITY_DATASET: z.string().min(1).optional().default('production'),
  VITE_SANITY_API_VERSION: z.string().min(1).optional().default('2025-01-01'),
  VITE_SANITY_TOKEN: z.string().optional(),

  // Error Reporting
  VITE_SENTRY_DSN: z.string().url().optional().or(z.literal('')),

  // Analytics
  VITE_GA_ID: z.string().optional(),
  VITE_PLAUSIBLE_DOMAIN: z.string().optional(),
  VITE_ENABLE_ANALYTICS: z
    .string()
    .transform((val: string) => val === 'true')
    .optional()
    .default('true'),

  // Site Configuration
  VITE_SITE_URL: z.string().url().optional(),
  VITE_MAINTENANCE_MODE: z
    .string()
    .transform((val: string) => val === 'true')
    .optional()
    .default('false'),
  VITE_MAINTENANCE_BYPASS_SECRET: z.string().optional(),

  // Feature Flags
  VITE_ENABLE_LOCAL_FALLBACK: z
    .string()
    .transform((val: string) => val === 'true')
    .optional()
    .default('false'),

  // Build-time variables (Vite tarafından otomatik eklenir)
  MODE: z.string().optional(),
  PROD: z
    .string()
    .transform((val: string) => val === 'true')
    .optional(),
  DEV: z
    .string()
    .transform((val: string) => val === 'true')
    .optional(),
})

type Env = z.infer<typeof envSchema>

/**
 * Validated environment variables
 */
let validatedEnv: Env | null = null

/**
 * Validate environment variables
 * @throws {Error} Eğer validation başarısız olursa
 */
export function validateEnv(): Env {
  if (validatedEnv) {
    return validatedEnv
  }

  try {
    // Vite environment variables'ı topla
    const rawEnv: Record<string, string> = {}
    const env = import.meta.env
    for (const key in env) {
      if (key.startsWith('VITE_') || key === 'MODE' || key === 'PROD' || key === 'DEV') {
        rawEnv[key] = String(env[key as keyof typeof env])
      }
    }

    // Validate
    const result = envSchema.safeParse(rawEnv)

    if (!result.success) {
      const errors = result.error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join('\n')
      throw new Error(`Environment variable validation failed:\n${errors}`)
    }

    validatedEnv = result.data
    return validatedEnv
  } catch (error) {
    if (error instanceof Error) {
      console.error('[Env Validation]', error.message)
      // Development'da uyarı ver, production'da hata fırlat
      if (import.meta.env.DEV) {
        console.warn('[Env Validation] Continuing with default values...')
        // Default values ile devam et
        validatedEnv = envSchema.parse({})
        return validatedEnv
      }
      throw error
    }
    throw error
  }
}

/**
 * Get validated environment variable
 */
export function getEnv(): Env {
  if (!validatedEnv) {
    return validateEnv()
  }
  return validatedEnv
}

/**
 * Check if required environment variables are set
 * (Production için kritik olanlar)
 */
export function checkRequiredEnv(): {isValid: boolean; missing: string[]; warnings: string[]} {
  const env = getEnv()
  const missing: string[] = []
  const warnings: string[] = []

  // Production'da kritik olanlar
  if (import.meta.env.PROD) {
    if (!env.VITE_SITE_URL || env.VITE_SITE_URL === 'https://yourdomain.com') {
      warnings.push('VITE_SITE_URL production domain ile güncellenmeli')
    }
  }

  // Opsiyonel ama önerilen
  if (!env.VITE_SANITY_TOKEN) {
    warnings.push("VITE_SANITY_TOKEN yok - üye kayıtları local storage'a kaydedilecek")
  }

  if (!env.VITE_SENTRY_DSN) {
    warnings.push("VITE_SENTRY_DSN yok - hata raporlama sadece console'a yazılacak")
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  }
}
