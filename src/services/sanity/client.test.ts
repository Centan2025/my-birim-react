import { describe, it, expect, vi } from 'vitest'
import { mapImage, rewriteR2Url, extractPalette, R2_DOMAIN } from './client'

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
            const img = { url: 'https://r2.com/1.jpg' }
            expect(mapImage(img)).toBe('https://r2.com/1.jpg')
        })

        it('asset nesnesi içindeki URLleri bulur', () => {
            const img = { asset: { url: 'https://cdn.sanity.io/2.jpg' } }
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
                        palette: { dominant: { background: '#000' } }
                    }
                }
            }
            const p = extractPalette(img as any)
            expect(p?.dominant?.background).toBe('#000')
        })
    })
})
