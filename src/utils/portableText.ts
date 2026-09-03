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

    // Fallback: search other non-metadata properties (exclude layout/align properties)
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
        ].includes(key)
      ) {
        const extracted = toPlainText(obj[key])
        if (extracted) return extracted
      }
    }
  }

  return ''
}
