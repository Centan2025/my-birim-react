const {createClient} = require('@sanity/client')

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN || '',
})

async function main() {
  console.log('Searching for published AND draft homePage documents in Sanity...')
  const docs = await client.fetch(`*[_type == "homePage"]{ _id, _type }`)
  console.log('Found homePage documents:', docs)

  const products = await client.fetch(`*[_type == "product"]{
    "id": id.current,
    name,
    description,
    media[]{ type, imageR2, isCover }
  }`)

  const getProd = id => products.find(p => p.id === id)
  const tau = getProd('dp0014-tau-konsol')
  const riva = getProd('kn0250-riva')
  const tin = getProd('dr0001-tin-dresuar')
  const surb = getProd('sh0033-surb')
  const soft = getProd('kr0003-soft')

  const makeR2Asset = (url, path) => ({
    _type: 'r2Asset',
    url,
    path: path || url.replace('https://birim-assets.web-birim.workers.dev/', ''),
    hasResponsiveSizes: true,
    hotspotX: 0.5,
    hotspotY: 0.5,
    mimeType: 'image/webp',
  })

  // Preserve panel block
  const existingDoc = await client.fetch(`*[_type == "homePage"][0]`)
  const existingBlocks = existingDoc?.contentBlocks || []
  const panelBlock = existingBlocks.find(b => b.mediaType === 'panels') || {
    _key: '622f9138e689',
    _type: 'contentBlock',
    mediaType: 'panels',
    order: 1,
    position: 'center',
    panelSize: 'small',
    panelFit: 'contain',
    panelGap: 'none',
  }
  panelBlock.order = 1
  delete panelBlock.title

  const masterBlocks = [
    {
      _key: 'block_brand_intro_clean',
      _type: 'contentBlock',
      order: 0,
      mediaType: 'image',
      position: 'full',
      title: {
        _type: 'localizedString',
        tr: "1975'TEN BUGÜNE MİMARİ DİSİPLİN VE ZANAAT",
        en: 'ARCHITECTURAL DISCIPLINE & CRAFTSMANSHIP SINCE 1975',
      },
      titlePosition: 'above',
      titleFont: 'Oswald',
      titleAlignment: 'center',
      description: {
        _type: 'localizedPortableText',
        tr: [
          {
            _key: 'desc_b0_c',
            _type: 'block',
            style: 'normal',
            children: [
              {
                _key: 'span_b0_c',
                _type: 'span',
                text: 'Birim, malzeme dürüstlüğü ve usta el işçiliğini modern mimarinin yalın diliyle buluşturur. Her detay, mekanın ruhunu tamamlayan heykelsi bir form ve zamansız bir estetik sunmak üzere tasarlanır.',
              },
            ],
            markDefs: [],
          },
        ],
      },
      contentFont: 'normal',
      textAlignment: 'center',
      textPosition: 'above',
      imageR2: makeR2Asset(
        'https://birim-assets.web-birim.workers.dev/products/depolamalar/cab/DP0006_CAB_02.webp',
        'products/depolamalar/cab/DP0006_CAB_02.webp'
      ),
      linkText: {
        _type: 'localizedString',
        tr: 'TÜM KOLEKSİYONU KEŞFEDİN',
        en: 'EXPLORE ALL COLLECTIONS',
      },
      linkUrl: '/products',
      showButtonOnMedia: false,
      backgroundColor: 'white',
      hasBorder: false,
      borderThickness: 0,
      padding: 0,
      spacingBottom: 56,
    },
    panelBlock,
    {
      _key: 'block_tau_cinematic_clean',
      _type: 'contentBlock',
      order: 2,
      mediaType: 'image',
      position: 'full',
      title: {
        _type: 'localizedString',
        tr: 'ZANAATIN ZİRVESİ: TAU KONSOL',
        en: 'MASTER CRAFTSMANSHIP: TAU CONSOLE',
      },
      titlePosition: 'above',
      titleFont: 'normal',
      titleAlignment: 'center',
      description: tau?.description,
      contentFont: 'normal',
      textAlignment: 'center',
      textPosition: 'above',
      imageR2: makeR2Asset(
        'https://birim-assets.web-birim.workers.dev/products/depolamalar/tau-konsol/DP0014_TAU_KONSOL_02.webp',
        'products/depolamalar/tau-konsol/DP0014_TAU_KONSOL_02.webp'
      ),
      linkText: {_type: 'localizedString', tr: 'TAU KONSOLU İNCELEYİN', en: 'DISCOVER TAU CONSOLE'},
      linkUrl: '/product/dp0014-tau-konsol',
      showButtonOnMedia: false,
      backgroundColor: 'white',
      hasBorder: false,
      borderThickness: 0,
      padding: 0,
      spacingBottom: 56,
    },
    {
      _key: 'block_riva_clean',
      _type: 'contentBlock',
      order: 3,
      mediaType: 'image',
      position: 'right',
      title: {
        _type: 'localizedString',
        tr: 'PANORAMİK KONFOR: RİVA KANEPE',
        en: 'PANORAMIC COMFORT: RIVA SOFA',
      },
      titlePosition: 'below',
      titleFont: 'normal',
      titleAlignment: 'left',
      description: riva?.description,
      contentFont: 'normal',
      textAlignment: 'left',
      textPosition: 'below',
      verticalAlignment: 'center',
      imageR2: makeR2Asset(
        'https://birim-assets.web-birim.workers.dev/migration/products/kn0250-riva/1785155403170-0250 RİVA.webp',
        'migration/products/kn0250-riva/1785155403170-0250 RİVA.webp'
      ),
      linkText: {_type: 'localizedString', tr: 'RİVA KANEPENİ KEŞFEDİN', en: 'DISCOVER RIVA SOFA'},
      linkUrl: '/product/kn0250-riva',
      showButtonOnMedia: false,
      backgroundColor: 'gray',
      hasBorder: false,
      borderThickness: 0,
      padding: 24,
      spacingBottom: 56,
    },
    {
      _key: 'block_sur_clean',
      _type: 'contentBlock',
      order: 4,
      mediaType: 'image',
      position: 'left',
      title: {
        _type: 'localizedString',
        tr: 'MÜREKKEP SANATI VE METAL: SUR SEHPA',
        en: 'INK ART & STAINLESS STEEL: SUR TABLE',
      },
      titlePosition: 'below',
      titleFont: 'normal',
      titleAlignment: 'left',
      description: surb?.description,
      contentFont: 'normal',
      textAlignment: 'left',
      textPosition: 'below',
      verticalAlignment: 'center',
      imageR2: makeR2Asset(
        'https://birim-assets.web-birim.workers.dev/migration/products/sh0033-surb/1781609940212-sur.webp',
        'migration/products/sh0033-surb/1781609940212-sur.webp'
      ),
      linkText: {
        _type: 'localizedString',
        tr: 'SUR KOLEKSİYONUNU KEŞFEDİN',
        en: 'DISCOVER SUR COLLECTION',
      },
      linkUrl: '/product/sh0033-surb',
      showButtonOnMedia: false,
      backgroundColor: 'white',
      hasBorder: false,
      borderThickness: 0,
      padding: 0,
      spacingBottom: 56,
    },
    {
      _key: 'block_tin_clean',
      _type: 'contentBlock',
      order: 5,
      mediaType: 'image',
      position: 'right',
      title: {
        _type: 'localizedString',
        tr: 'RASYONEL GEOMETRİ: TİN DRESUAR',
        en: 'RATIONAL GEOMETRY: TIN CONSOLE',
      },
      titlePosition: 'below',
      titleFont: 'normal',
      titleAlignment: 'left',
      description: tin?.description,
      contentFont: 'normal',
      textAlignment: 'left',
      textPosition: 'below',
      verticalAlignment: 'center',
      imageR2: makeR2Asset(
        'https://birim-assets.web-birim.workers.dev/migration/products/dr0001-tin-dresuar/1781604158672-tin-dresuar.webp',
        'migration/products/dr0001-tin-dresuar/1781604158672-tin-dresuar.webp'
      ),
      linkText: {
        _type: 'localizedString',
        tr: 'TİN DRESUARI İNCELEYİN',
        en: 'DISCOVER TIN CONSOLE',
      },
      linkUrl: '/product/dr0001-tin-dresuar',
      showButtonOnMedia: false,
      backgroundColor: 'gray',
      hasBorder: false,
      borderThickness: 0,
      padding: 24,
      spacingBottom: 56,
    },
    {
      _key: 'block_soft_clean',
      _type: 'contentBlock',
      order: 6,
      mediaType: 'image',
      position: 'left',
      title: {
        _type: 'localizedString',
        tr: 'YALIN DÖŞEME LÜKSÜ: SOFT YATAK',
        en: 'UPHOLSTERED LUXURY: SOFT BED',
      },
      titlePosition: 'below',
      titleFont: 'normal',
      titleAlignment: 'left',
      description: soft?.description,
      contentFont: 'normal',
      textAlignment: 'left',
      textPosition: 'below',
      verticalAlignment: 'center',
      imageR2: makeR2Asset(
        'https://birim-assets.web-birim.workers.dev/migration/products/kr0003-soft/1782299445612-soft-katalog.webp',
        'migration/products/kr0003-soft/1782299445612-soft-katalog.webp'
      ),
      linkText: {_type: 'localizedString', tr: 'SOFT YATAĞI İNCELEYİN', en: 'DISCOVER SOFT BED'},
      linkUrl: '/product/kr0003-soft',
      showButtonOnMedia: false,
      backgroundColor: 'white',
      hasBorder: false,
      borderThickness: 0,
      padding: 0,
      spacingBottom: 56,
    },
    {
      _key: 'block_atelier_clean',
      _type: 'contentBlock',
      order: 7,
      mediaType: 'image',
      position: 'full',
      title: {
        _type: 'localizedString',
        tr: 'BİRİM ATELIER: ÖZEL PROJELER VE MİMARİ ÇÖZÜMLER',
        en: 'BIRIM ATELIER: CUSTOM PROJECTS & ARCHITECTURAL CONSULTATION',
      },
      titlePosition: 'above',
      titleFont: 'Oswald',
      titleAlignment: 'center',
      description: {
        _type: 'localizedPortableText',
        tr: [
          {
            _key: 'desc_atelier_c',
            _type: 'block',
            style: 'normal',
            children: [
              {
                _key: 'span_at_c',
                _type: 'span',
                text: 'Konut, otel ve ticari yapılar için mimari projeye özel imalat, detay çözümleri ve kişiselleştirilmiş mobilya imalatı. Projeniz için mimari ekibimizle doğrudan iletişime geçebilirsiniz.',
              },
            ],
            markDefs: [],
          },
        ],
      },
      contentFont: 'normal',
      textAlignment: 'center',
      textPosition: 'above',
      imageR2: makeR2Asset(
        'https://birim-assets.web-birim.workers.dev/migration/products/dp0006-cab/1782286562154-cab-konsol.webp',
        'migration/products/dp0006-cab/1782286562154-cab-konsol.webp'
      ),
      linkText: {
        _type: 'localizedString',
        tr: 'MİMARİ DANIŞMANLIK & İLETİŞİM',
        en: 'ARCHITECTURAL CONSULTATION',
      },
      linkUrl: '/contact',
      showButtonOnMedia: false,
      backgroundColor: 'white',
      hasBorder: false,
      borderThickness: 0,
      padding: 0,
      spacingBottom: 64,
    },
  ]

  for (const doc of docs) {
    console.log(`Updating document ${doc._id}...`)
    await client.patch(doc._id).set({contentBlocks: masterBlocks}).commit()
  }

  console.log('Successfully updated all homePage documents (published and draft)!')
}

main().catch(console.error)
