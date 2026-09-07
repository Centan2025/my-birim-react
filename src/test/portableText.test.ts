import {describe, it, expect} from 'vitest'
import {toPlainText, resolvePortableTextOrString} from '../utils/portableText'

describe('portableText utils', () => {
  it('does not extract image file names or paths from portableTextImage blocks into plain text', () => {
    const rawBlocks = [
      {
        _type: 'portableTextImage',
        imageR2: {
          url: 'https://media.birim.com/1786110979021-20-o.odasi-test.webp',
          path: '1786110979021-20-o.odasi-',
          alt: '1786110979021-20-o.odasi-',
        },
      },
      {
        _type: 'portableTextImage',
        imageR2: {
          url: 'https://media.birim.com/1786110979022-21-o.odasi-test.webp',
          path: '1786110979022-21-o.odasi-',
          alt: '1786110979022-21-o.odasi-',
        },
      },
      {
        _type: 'portableTextImage',
        imageR2: {
          url: 'https://media.birim.com/1786110979023-23-o.odasi-test.webp',
          path: '1786110979023-23-o.odasi-',
        },
      },
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'Deneme içerik bloğu Metni',
          },
        ],
      },
    ]

    const plainText = toPlainText(rawBlocks)
    expect(plainText).toBe('Deneme içerik bloğu Metni')
    expect(plainText).not.toContain('1786110979021')
    expect(plainText).not.toContain('1786110979022')
    expect(plainText).not.toContain('1786110979023')
  })

  it('correctly resolves localized PortableText to array of blocks', () => {
    const localizedDescription = {
      _type: 'localizedPortableText',
      tr: [
        {
          _type: 'portableTextImage',
          imageR2: {
            url: 'https://media.birim.com/img1.webp',
            path: 'img1',
          },
        },
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: 'Deneme içerik bloğu Metni',
            },
          ],
        },
      ],
      en: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: 'Sample content block text',
            },
          ],
        },
      ],
    }

    const trResult = resolvePortableTextOrString(localizedDescription, 'tr')
    expect(Array.isArray(trResult)).toBe(true)
    expect((trResult as unknown[]).length).toBe(2)

    const enResult = resolvePortableTextOrString(localizedDescription, 'en')
    expect(Array.isArray(enResult)).toBe(true)
    expect((enResult as unknown[]).length).toBe(1)
  })

  it('handles plain string fallback when localized value is a string', () => {
    const localizedStringDesc = {
      tr: 'Düz metin açıklaması',
      en: 'Plain text description',
    }

    const res = resolvePortableTextOrString(localizedStringDesc, 'tr')
    expect(res).toBe('Düz metin açıklaması')
  })
})
