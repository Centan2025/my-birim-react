const {createClient} = require('@sanity/client')

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN || '',
})

async function runFix() {
  console.log('Fetching homePage and product data...')
  const homeDoc = await client.fetch(`*[_type == "homePage"][0]`)
  if (!homeDoc) return

  const existingBlocks = homeDoc.contentBlocks || []

  // 100% preserve the panels block
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
  panelBlock.title = undefined // Avoid validation issues

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

  // BLOCK 0: Full-width Hero Introduction with complete r2Asset object
  const block0 = {
    _key: 'block_brand_intro_v4',
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
          _key: 'desc_b0_v4',
          _type: 'block',
          style: 'normal',
          children: [
            {
              _key: 'span_b0_v4',
              _type: 'span',
              text: 'Birim, malzeme dürüstlüğü ve usta el işçiliğini modern mimarinin yalın diliyle buluşturur. Her detay, mekanın ruhunu tamamlayan heykelsi bir form ve zamansız bir estetik sunmak üzere tasarlanır.',
            },
          ],
          markDefs: [],
        },
      ],
      en: [
        {
          _key: 'desc_b0_v4_en',
          _type: 'block',
          style: 'normal',
          children: [
            {
              _key: 'span_b0_v4_en',
              _type: 'span',
              text: 'Birim combines material honesty and master craftsmanship with the pure language of modern architecture.',
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
  }

  // BLOCK 2: TAU KONSOL (Full-width Cinematic Focus)
  const block2 = {
    _key: 'block_tau_cinematic_v4',
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
  }

  // BLOCK 3: RİVA KANEPE (Side-by-side right)
  const block3 = {
    _key: 'block_riva_editorial_v4',
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
  }

  // BLOCK 4: SUR SEHPA (Side-by-side left)
  const block4 = {
    _key: 'block_sur_editorial_v4',
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
  }

  // BLOCK 5: TİN DRESUAR (Side-by-side right)
  const block5 = {
    _key: 'block_tin_editorial_v4',
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
    linkText: {_type: 'localizedString', tr: 'TİN DRESUARI İNCELEYİN', en: 'DISCOVER TIN CONSOLE'},
    linkUrl: '/product/dr0001-tin-dresuar',
    showButtonOnMedia: false,
    backgroundColor: 'gray',
    hasBorder: false,
    borderThickness: 0,
    padding: 24,
    spacingBottom: 56,
  }

  // BLOCK 6: SOFT YATAK (Side-by-side left)
  const block6 = {
    _key: 'block_soft_editorial_v4',
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
  }

  // BLOCK 7: CLOSING ATELIER INVITATION (Full Width)
  const block7 = {
    _key: 'block_atelier_invitation_v4',
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
          _key: 'desc_atelier_v4',
          _type: 'block',
          style: 'normal',
          children: [
            {
              _key: 'span_at_v4',
              _type: 'span',
              text: 'Konut, otel ve ticari yapılar için mimari projeye özel imalat, detay çözümleri ve kişiselleştirilmiş mobilya imalatı. Projeniz için mimari ekibimizle doğrudan iletişime geçebilirsiniz.',
            },
          ],
          markDefs: [],
        },
      ],
      en: [
        {
          _key: 'desc_atelier_v4_en',
          _type: 'block',
          style: 'normal',
          children: [
            {
              _key: 'span_at_v4_en',
              _type: 'span',
              text: 'Custom furniture manufacturing and architectural details for residential, hospitality, and commercial spaces. Contact our architectural atelier for your project.',
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
  }

  const finalBlocks = [block0, panelBlock, block2, block3, block4, block5, block6, block7]

  console.log('Fixing Sanity Studio validation errors & applying Master Flow...')
  await client.patch(homeDoc._id).set({contentBlocks: finalBlocks}).commit()

  console.log('Successfully fixed Sanity Studio validation errors and applied Master Flow!')
}

runFix().catch(console.error)
