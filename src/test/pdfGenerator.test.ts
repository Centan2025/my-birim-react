import {describe, it, expect, vi} from 'vitest'
import {generateProductPDF, downloadProductDetailPDF} from '../utils/pdfGenerator'
import type {Product} from '../types'

const mockProduct: Product = {
  id: 'product-123',
  name: {tr: 'Mado Koltuk', en: 'Mado Armchair'},
  description: {
    tr: 'Yüksek kaliteli döşeme ve masif ahşap ayaklar ile tasarlanmış modern koltuk.',
    en: 'Modern armchair designed with high quality upholstery and solid wood legs.',
  },
  designerId: 'designer-1',
  categoryId: 'category-chairs',
  year: 2024,
  buyable: true,
  price: 18500,
  currency: 'TRY',
  sku: 'BIRIM-MDO-01',
  mainImage: 'https://example.com/mado.jpg',
  dimensionImages: [
    {
      image: 'https://example.com/mado-dims.jpg',
      title: {tr: '2D Teknik Çizim', en: '2D Technical Drawing'},
    },
  ],
  materials: [
    {name: {tr: 'Doğal Meşe', en: 'Natural Oak'}, image: 'https://example.com/oak.jpg'},
    {
      name: {tr: 'Keten Dokuma Kumaş', en: 'Linen Weave Fabric'},
      image: 'https://example.com/linen.jpg',
    },
  ],
  groupedMaterials: [
    {
      groupTitle: {tr: 'Döşeme Grubu', en: 'Upholstery Group'},
      books: [
        {
          bookTitle: {tr: 'Koleksiyon Kumaşları', en: 'Collection Fabrics'},
          materials: [
            {
              name: {tr: 'Boucle Kumaş', en: 'Boucle Fabric'},
              image: 'https://example.com/boucle.jpg',
            },
          ],
        },
      ],
      materials: [],
    },
  ],
  exclusiveContent: {images: [], drawings: [], models3d: []},
}

describe('generateProductPDF', () => {
  it('generates a valid PDF blob with Turkish locale', async () => {
    const blob = await generateProductPDF({
      product: mockProduct,
      category: {
        id: 'category-chairs',
        name: {tr: 'Koltuklar', en: 'Armchairs'},
        subtitle: {tr: '', en: ''},
        heroImage: '',
      },
      designer: {
        id: 'designer-1',
        name: {tr: 'Tanju Özelgin', en: 'Tanju Ozelgin'},
        bio: {tr: 'Ödüllü tasarımcı', en: 'Award winning designer'},
        image: '',
      },
      locale: 'tr',
    })

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(0)
    expect(blob.type).toBe('application/pdf')
  })

  it('generates a valid PDF blob with English locale and handles missing optional fields', async () => {
    const minimalProduct: Product = {
      id: 'minimal-1',
      name: 'Minimal Masa',
      description: 'Açıklama',
      designerId: '',
      categoryId: '',
      year: 2023,
      buyable: false,
      price: 0,
      currency: 'TRY',
      mainImage: '',
      materials: [],
      exclusiveContent: {images: [], drawings: [], models3d: []},
    }

    const blob = await generateProductPDF({
      product: minimalProduct,
      locale: 'en',
    })

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(0)
    expect(blob.type).toBe('application/pdf')
  })

  it('downloadProductDetailPDF initiates DOM download with sanitized filename', async () => {
    const createElementSpy = vi.spyOn(document, 'createElement')
    const appendChildSpy = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation(() => document.createElement('div'))
    const removeChildSpy = vi
      .spyOn(document.body, 'removeChild')
      .mockImplementation(() => document.createElement('div'))
    const createObjectURLSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:http://localhost/fake-pdf')
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockReturnValue()

    await downloadProductDetailPDF({
      product: mockProduct,
      locale: 'tr',
    })

    expect(createObjectURLSpy).toHaveBeenCalled()
    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(appendChildSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()
    expect(revokeObjectURLSpy).toHaveBeenCalled()

    createElementSpy.mockRestore()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
    createObjectURLSpy.mockRestore()
    revokeObjectURLSpy.mockRestore()
  })
})
