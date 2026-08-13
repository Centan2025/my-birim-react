const {createClient} = require('@sanity/client')

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN || '',
})

async function runUpdate() {
  console.log('Fetching homePage and products...')
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

  // BLOCK 0: MINIMALIST ARCHITECTURAL MANIFESTO (Spacious, Centered, Museum Style)
  const block0 = {
    _key: 'block_manifesto_designer',
    _type: 'contentBlock',
    order: 0,
    mediaType: 'image',
    position: 'center',
    title: {
      _type: 'localizedString',
      tr: "1975'TEN BUGÜNE MİMARİ SANAT VE DİSİPLİN",
      en: 'ARCHITECTURAL ART & DISCIPLINE SINCE 1975',
    },
    titlePosition: 'above',
    titleFont: 'Oswald',
    titleAlignment: 'center',
    description: {
      _type: 'localizedPortableText',
      tr: [
        {
          _key: 'manifesto_text',
          _type: 'block',
          style: 'blockquote',
          children: [
            {
              _key: 's_m1',
              _type: 'span',
              text: 'Birim, malzeme dürüstlüğü ve usta el işçiliğini modern mimarinin yalın diliyle buluşturur. Her detay, mekanın ruhunu tamamlayan heykelsi bir form ve zamansız bir estetik sunmak üzere tasarlanır.',
            },
          ],
          markDefs: [],
        },
      ],
      en: [
        {
          _key: 'manifesto_text_en',
          _type: 'block',
          style: 'blockquote',
          children: [
            {
              _key: 's_m1_en',
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
    linkText: {_type: 'localizedString', tr: 'KOLEKSİYONLARI KEŞFEDİN', en: 'EXPLORE COLLECTIONS'},
    linkUrl: '/products',
    showButtonOnMedia: false,
    backgroundColor: 'gray',
    hasBorder: false,
    borderThickness: 0,
    padding: 32,
    spacingBottom: 48,
  }

  // BLOCK 2: CINEMATIC SPOTLIGHT - TAU KONSOL (Full Width)
  const block2 = {
    _key: 'block_tau_cinematic',
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
    imageR2: {
      _type: 'r2Asset',
      url: 'https://birim-assets.web-birim.workers.dev/products/depolamalar/tau-konsol/DP0014_TAU_KONSOL_02.webp',
      hasResponsiveSizes: true,
    },
    linkText: {_type: 'localizedString', tr: 'TAU KONSOLU İNCELEYİN', en: 'DISCOVER TAU CONSOLE'},
    linkUrl: '/product/dp0014-tau-konsol',
    showButtonOnMedia: false,
    backgroundColor: 'white',
    hasBorder: false,
    borderThickness: 0,
    padding: 0,
    spacingBottom: 64,
  }

  // BLOCK 3: EDITORIAL GRID PAIRING - RİVA & PANORAMIK OTURUM (Side-by-side right)
  const block3 = {
    _key: 'block_riva_editorial',
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
    imageR2: {
      _type: 'r2Asset',
      url: 'https://birim-assets.web-birim.workers.dev/migration/products/kn0250-riva/1785155403170-0250 RİVA.webp',
      hasResponsiveSizes: true,
    },
    linkText: {_type: 'localizedString', tr: 'RİVA KANEPENİ KEŞFEDİN', en: 'DISCOVER RIVA SOFA'},
    linkUrl: '/product/kn0250-riva',
    showButtonOnMedia: false,
    backgroundColor: 'gray',
    hasBorder: false,
    borderThickness: 0,
    padding: 24,
    spacingBottom: 64,
  }

  // BLOCK 4: METAL VE SANATIN HASSASİYETİ - SUR & TİN (Side-by-side left)
  const block4 = {
    _key: 'block_sur_tin_editorial',
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
    imageR2: {
      _type: 'r2Asset',
      url: 'https://birim-assets.web-birim.workers.dev/migration/products/sh0033-surb/1781609940212-sur.webp',
      hasResponsiveSizes: true,
    },
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
    spacingBottom: 64,
  }

  // BLOCK 5: RASYONEL GEOMETRİ - TİN DRESUAR (Side-by-side right)
  const block5 = {
    _key: 'block_tin_editorial',
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
    imageR2: {
      _type: 'r2Asset',
      url: 'https://birim-assets.web-birim.workers.dev/migration/products/dr0001-tin-dresuar/1781604158672-tin-dresuar.webp',
      hasResponsiveSizes: true,
    },
    linkText: {_type: 'localizedString', tr: 'TİN DRESUARI İNCELEYİN', en: 'DISCOVER TIN CONSOLE'},
    linkUrl: '/product/dr0001-tin-dresuar',
    showButtonOnMedia: false,
    backgroundColor: 'gray',
    hasBorder: false,
    borderThickness: 0,
    padding: 24,
    spacingBottom: 64,
  }

  // BLOCK 6: CLOSING ATELIER INVITATION (Full Width Minimalist)
  const block6 = {
    _key: 'block_atelier_invitation',
    _type: 'contentBlock',
    order: 6,
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
          _key: 'desc_atelier_tr',
          _type: 'block',
          style: 'normal',
          children: [
            {
              _key: 'span_at_tr',
              _type: 'span',
              text: 'Konut, otel ve ticari yapılar için mimari projeye özel imalat, detay çözümleri ve kişiselleştirilmiş mobilya imalatı. Projeniz için mimari ekibimizle doğrudan iletişime geçebilirsiniz.',
            },
          ],
          markDefs: [],
        },
      ],
      en: [
        {
          _key: 'desc_atelier_en',
          _type: 'block',
          style: 'normal',
          children: [
            {
              _key: 'span_at_en',
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
    imageR2: {
      _type: 'r2Asset',
      url: 'https://birim-assets.web-birim.workers.dev/migration/products/dp0006-cab/1782286562154-cab-konsol.webp',
      hasResponsiveSizes: true,
    },
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

  const masterBlocks = [block0, panelBlock, block2, block3, block4, block5, block6]

  console.log('Updating homePage document in Sanity with Elite Designer Flow...')
  await client.patch(homeDoc._id).set({contentBlocks: masterBlocks}).commit()

  console.log('Elite Designer Flow update completed successfully!')
}

runUpdate().catch(console.error)
