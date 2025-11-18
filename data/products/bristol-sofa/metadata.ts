/**
 * Alternatif: TypeScript dosyası olarak ürün verisi
 * Bu yaklaşım tip güvenliği sağlar ve import edilebilir
 */

import type { Product } from '../../types';

const bristolSofa: Product = {
  id: 'bristol-sofa',
  name: {
    tr: 'Bristol Kanepe',
    en: 'Bristol Sofa',
  },
  designerId: 'jean-marie-massaud',
  categoryId: 'kanepeler',
  year: 2013,
  description: {
    tr: 'Jean-Marie Massaud tarafından tasarlanan Bristol, birincil şekilleri uyumlu ve ergonomik bir tasarımda birleştiren bir kanepe sistemidir. Saran sırtlıklara sahip yumuşak, konforlu şekiller maksimum konfor sağlar.',
    en: 'Bristol, designed by Jean-Marie Massaud, is a sofa system that combines primary shapes in a harmonious and ergonomic design. The soft, comfortable shapes, with enveloping backrests, provide maximum comfort.',
  },
  mainImage: {
    url: 'https://picsum.photos/seed/bristol-1/800/800',
    urlMobile: 'https://picsum.photos/seed/bristol-1-mobile/400/600',
    urlDesktop: 'https://picsum.photos/seed/bristol-1-desktop/1200/800',
  },
  alternativeImages: [
    'https://picsum.photos/seed/bristol-2/800/800',
    'https://picsum.photos/seed/bristol-3/800/800',
  ],
  buyable: true,
  price: 150000,
  currency: 'TRY',
  sku: 'BRI-001',
  stockStatus: 'in_stock',
  materials: [
    {
      name: {
        tr: 'Kumaş',
        en: 'Fabric',
      },
      image: 'https://picsum.photos/seed/fabric/100/100',
    },
    {
      name: {
        tr: 'Deri',
        en: 'Leather',
      },
      image: 'https://picsum.photos/seed/leather/100/100',
    },
  ],
  dimensionImages: [
    {
      image: 'https://picsum.photos/seed/bristol-dim-1/800/600',
      title: {
        tr: 'Yan Görünüm',
        en: 'Side View',
      },
    },
    {
      image: 'https://picsum.photos/seed/bristol-dim-2/800/600',
      title: {
        tr: 'Üst Görünüm',
        en: 'Top View',
      },
    },
  ],
  exclusiveContent: {
    images: ['https://picsum.photos/seed/bristol-ex1/800/800'],
    drawings: [
      {
        name: {
          tr: 'Teknik Çizim',
          en: 'Technical Drawing',
        },
        url: '#',
      },
    ],
    models3d: [
      {
        name: {
          tr: '3DS Max Modeli',
          en: '3DS Max Model',
        },
        url: '#',
      },
    ],
  },
};

export default bristolSofa;


