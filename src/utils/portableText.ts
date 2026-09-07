/**
 * Extracts clean, human-readable plain text from strings, PortableText block arrays,
 * single block objects, or localized content objects.
 */
export function toPlainText(val: unknown): string {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)

  if (Array.isArray(val)) {
    return val
      .map(item => toPlainText(item))
      .filter(Boolean)
      .join('\n\n')
      .trim()
  }

  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>

    // PortableText block with children array
    if (Array.isArray(obj['children'])) {
      return (obj['children'] as unknown[])
        .map(child => {
          if (child && typeof child === 'object') {
            const childObj = child as Record<string, unknown>
            if (typeof childObj['text'] === 'string') return childObj['text']
            return toPlainText(child)
          }
          return typeof child === 'string' ? child : ''
        })
        .join('')
        .trim()
    }

    // Media and divider blocks should not produce plain text (caption only if present)
    if (
      obj['_type'] === 'portableTextImage' ||
      obj['_type'] === 'image' ||
      obj['_type'] === 'r2Asset' ||
      obj['_type'] === 'youtube' ||
      obj['_type'] === 'divider'
    ) {
      if (typeof obj['caption'] === 'string' && obj['caption'].trim()) {
        return obj['caption'].trim()
      }
      return ''
    }

    // CTA Block specifically
    if (obj['_type'] === 'cta') {
      if (typeof obj['text'] === 'string') return (obj['text'] as string).trim()
      if (typeof obj['text'] === 'object' && obj['text'] !== null) {
        const textObj = obj['text'] as Record<string, string>
        return textObj['tr'] || textObj['en'] || Object.values(textObj)[0] || ''
      }
      return ''
    }

    // Direct text property
    if (typeof obj['text'] === 'string') {
      return (obj['text'] as string).trim()
    }
    if (typeof obj['text'] === 'object' && obj['text'] !== null) {
      const extracted = toPlainText(obj['text'])
      if (extracted) return extracted
    }

    // Localized object ({ tr: ..., en: ... })
    if ('tr' in obj && obj['tr']) {
      return toPlainText(obj['tr'])
    }
    if ('en' in obj && obj['en']) {
      return toPlainText(obj['en'])
    }

    // Fallback: search other non-metadata properties (exclude layout/align/media properties)
    for (const key of Object.keys(obj)) {
      if (
        ![
          '_key',
          '_type',
          'markDefs',
          'style',
          'align',
          'layout',
          'verticalAlign',
          'url',
          'link',
          'imageR2',
          'image',
          'imageMobileR2',
          'imageDesktopR2',
          'videoFileR2',
          'asset',
          'path',
          'mimeType',
          'cropX',
          'cropY',
          'cropWidth',
          'cropHeight',
          'hotspotX',
          'hotspotY',
          'width',
          'height',
          'palette',
          'isCover',
          'isMirrored',
        ].includes(key)
      ) {
        const extracted = toPlainText(obj[key])
        if (extracted) return extracted
      }
    }
  }

  return ''
}

/**
 * Resolves a PortableText field or localized PortableText object into an array of blocks
 * for PortableTextLite or a fallback string if it was stored as plain text.
 */
export function resolvePortableTextOrString<T = unknown>(
  val: unknown,
  locale: string = 'tr'
): T[] | string | undefined {
  if (!val) return undefined
  if (Array.isArray(val)) return val as T[]
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>
    // Direct block with children
    if ('_type' in obj && 'children' in obj) {
      return [obj as unknown as T]
    }
    // Localized object: check locale, 'tr', 'en', or first non-empty value
    const localizedVal =
      obj[locale] !== undefined && obj[locale] !== null && obj[locale] !== ''
        ? obj[locale]
        : obj['tr'] !== undefined && obj['tr'] !== null && obj['tr'] !== ''
          ? obj['tr']
          : obj['en'] !== undefined && obj['en'] !== null && obj['en'] !== ''
            ? obj['en']
            : Object.values(obj).find(v => v !== undefined && v !== null && v !== '')

    if (Array.isArray(localizedVal)) return localizedVal as T[]
    if (typeof localizedVal === 'string') return localizedVal
    if (typeof localizedVal === 'object' && localizedVal !== null) {
      if ('_type' in localizedVal && 'children' in localizedVal) {
        return [localizedVal as unknown as T]
      }
    }
  }
  if (typeof val === 'string') return val
  return undefined
}
