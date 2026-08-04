import {describe, it, expect} from 'vitest'
import {mapImage, rewriteR2Url, extractPalette, R2_DOMAIN} from './client'

describe('sanity client utils', () => {
  describe('rewriteR2Url', () => {
    it('R2 URLlerini doğru formata (R2_DOMAIN) dönüştürür', () => {
      const input = 'https://pub-5e705b2a702d4bb1a3631c558917599d.r2.dev/test.jpg'
      const output = rewriteR2Url(input)
      expect(output).toBe(`${R2_DOMAIN}/test.jpg`)
    })

    it('Alt domainli R2 linklerini de R2_DOMAIN ile değiştirir', () => {
      const input = 'https://custom-bucket.r2.dev/sub/image.png'
      const output = rewriteR2Url(input)
      expect(output).toBe(`${R2_DOMAIN}/sub/image.png`)
    })

    it('Zaten düzgün olan veya harici linklere dokunmaz', () => {
      const external = 'https://google.com/a.jpg'
      expect(rewriteR2Url(external)).toBe(external)
    })
  })

  describe('mapImage', () => {
    it('Sanity image objesinden R2 URL varsa onu döner', () => {
      const img = {url: 'https://r2.com/1.jpg'}
      expect(mapImage(img)).toBe('https://r2.com/1.jpg')
    })

    it('asset nesnesi içindeki URLleri bulur', () => {
      const img = {asset: {url: 'https://cdn.sanity.io/2.jpg'}}
      expect(mapImage(img)).toBe('https://cdn.sanity.io/2.jpg')
    })

    it('migration yolunu R2_DOMAIN ile birleştirir', () => {
      const img = 'migration/test.jpg'
      expect(mapImage(img)).toBe(`${R2_DOMAIN}/migration/test.jpg`)
    })
  })

  describe('extractPalette', () => {
    it('asset.metadata içindeki paleti çıkarır', () => {
      const img = {
        asset: {
          metadata: {
            palette: {dominant: {background: '#000'}},
          },
        },
      }
      const p = extractPalette(img as unknown)
      expect(p?.dominant?.background).toBe('#000')
    })
  })

  describe('mapR2Metadata crop parsing', () => {
    it('Sanity standart crop nesnesini (top, bottom, left, right) x, y, width, height formatına çevirir', async () => {
      const {mapR2Metadata} = await import('./client')
      const img = {
        crop: {
          top: 0.1,
          bottom: 0.2,
          left: 0.15,
          right: 0.25,
        },
      }
      const meta = mapR2Metadata(img)
      expect(meta.crop).toEqual({
        x: 0.15,
        y: 0.1,
        width: 0.6,
        height: 0.7,
      })
    })

    it('Sanity crop nesnesinde top/left 0 veya eksik olduğunda da doğru kırpma hesaplar', async () => {
      const {mapR2Metadata} = await import('./client')
      const img = {
        crop: {
          bottom: 0.2,
          right: 0.1,
        },
      }
      const meta = mapR2Metadata(img)
      expect(meta.crop).toEqual({
        x: 0,
        y: 0,
        width: 0.9,
        height: 0.8,
      })
    })

    it('Custom R2 crop formatını (cropX, cropY, cropWidth, cropHeight) doğru okur', async () => {
      const {mapR2Metadata} = await import('./client')
      const img = {
        cropX: 0.1,
        cropY: 0.2,
        cropWidth: 0.8,
        cropHeight: 0.6,
      }
      const meta = mapR2Metadata(img)
      expect(meta.crop).toEqual({
        x: 0.1,
        y: 0.2,
        width: 0.8,
        height: 0.6,
      })
    })
  })
})
