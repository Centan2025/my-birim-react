import type {Designer} from '../types'

/**
 * Checks if a designer is Birim Design Studio (Birim Tasarım Stüdyosu).
 * Handles slug id, string id, or localized name matches.
 */
export function isBirimDesignStudio(
  designerOrId?: Designer | {id?: string; name?: unknown} | string | null
): boolean {
  if (!designerOrId) return false

  const idStr = typeof designerOrId === 'string' ? designerOrId : String(designerOrId.id || '')
  const idLower = idStr.toLowerCase()

  if (
    idLower === 'tasarimci-birim-dessign-studio' ||
    idLower === 'tasarimci-birim-design-studio' ||
    (idLower.includes('birim') &&
      (idLower.includes('design') ||
        idLower.includes('dessign') ||
        idLower.includes('studio') ||
        idLower.includes('tasarim') ||
        idLower.includes('studyosu')))
  ) {
    return true
  }

  if (typeof designerOrId === 'object' && designerOrId.name) {
    const rawName = designerOrId.name
    const nameStr = (
      typeof rawName === 'string'
        ? rawName
        : `${(rawName as {tr?: string; en?: string})?.tr || ''} ${(rawName as {tr?: string; en?: string})?.en || ''}`
    ).toLowerCase()

    if (nameStr.includes('birim design') || nameStr.includes('birim tasarım')) {
      return true
    }
  }

  return false
}

export const DEFAULT_COMPANY_LOGO = '/img/logo.png'
