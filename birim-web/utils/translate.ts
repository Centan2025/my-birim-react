/**
 * Çok dilli alanlar için Google Translate API yardımcı fonksiyonu
 */
export const translateText = async (text: string, targetLang: string): Promise<string> => {
  if (!text || text.trim() === '') {
    throw new Error('Çevrilecek metin boş')
  }

  const sourceLang = 'tr' // Türkçe kaynak dil
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Çeviri servisi yanıt vermedi')
    }

    const data = await response.json()
    if (data && data[0] && Array.isArray(data[0])) {
      return data[0].map((item: any[]) => item[0] || '').join('')
    }
    throw new Error('Çeviri sonucu alınamadı')
  } catch (error: any) {
    throw new Error(`Çeviri hatası: ${error.message}`)
  }
}

const generateKey = () => Math.random().toString(36).substring(2, 11)

export const stringToBlocks = (text: string) => {
  if (!text || typeof text !== 'string') return []
  return [
    {
      _key: generateKey(),
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _key: generateKey(),
          _type: 'span',
          marks: [],
          text,
        },
      ],
    },
  ]
}

/**
 * PortableText blok dizisini veya metnini hedef dile çevirir
 */
export const translatePortableText = async (
  blocks: any,
  targetLang: string,
): Promise<any> => {
  if (typeof blocks === 'string') {
    const translated = await translateText(blocks, targetLang)
    return [
      {
        _key: generateKey(),
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _key: generateKey(),
            _type: 'span',
            marks: [],
            text: translated,
          },
        ],
      },
    ]
  }

  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new Error('Çevrilecek blok metin bulunamadı')
  }

  const translatedBlocks = await Promise.all(
    blocks.map(async (block) => {
      if (block && block._type === 'block' && Array.isArray(block.children)) {
        const translatedChildren = await Promise.all(
          block.children.map(async (child: any) => {
            if (
              child &&
              child._type === 'span' &&
              typeof child.text === 'string' &&
              child.text.trim() !== ''
            ) {
              try {
                const translated = await translateText(child.text, targetLang)
                return {
                  ...child,
                  _key: generateKey(),
                  text: translated,
                }
              } catch (err) {
                console.warn(`Span translation error for ${targetLang}:`, err)
                return {
                  ...child,
                  _key: generateKey(),
                }
              }
            }
            return {
              ...child,
              _key: generateKey(),
            }
          })
        )

        return {
          ...block,
          _key: generateKey(),
          children: translatedChildren,
        }
      }

      return {
        ...block,
        _key: generateKey(),
      }
    }),
  )

  return translatedBlocks
}

