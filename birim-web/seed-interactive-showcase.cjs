const {createClient} = require('@sanity/client')

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN || '',
})

async function seed() {
  console.log('Fetching real products from Sanity...')
  const products = await client.fetch(
    `*[_type == "product" && !(_id in path("drafts.**"))][0..5]{ _id, name }`,
  )
  console.log(
    `Found ${products.length} real products in Sanity:`,
    products.map((p) => p.name?.tr || p._id),
  )

  if (products.length === 0) {
    console.error('No products found in Sanity dataset.')
    return
  }

  const p1 = products[0] || products[0]
  const p2 = products[1] || products[0]
  const p3 = products[2] || products[0]
  const p4 = products[3] || products[0]
  const p5 = products[4] || products[0]

  const sampleShowcase = [
    {
      _key: 'showcase-slide-1',
      _type: 'interactiveShowcaseItem',
      title: {
        _type: 'localizedString',
        tr: 'MODERN İÇ MEKAN TASARIMI',
        en: 'MODERN INTERIOR DESIGN',
      },
      imageR2: {
        _type: 'r2Asset',
        url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2500&auto=format&fit=crop',
        mimeType: 'image/jpeg',
      },
      hotspots: [
        {
          _key: 'hs-1',
          _type: 'productHotspot',
          x: 35,
          y: 62,
          product: {_type: 'reference', _ref: p1._id},
        },
        {
          _key: 'hs-2',
          _type: 'productHotspot',
          x: 68,
          y: 72,
          product: {_type: 'reference', _ref: p2._id},
        },
        {
          _key: 'hs-3',
          _type: 'productHotspot',
          x: 82,
          y: 45,
          product: {_type: 'reference', _ref: p3._id},
        },
      ],
    },
    {
      _key: 'showcase-slide-2',
      _type: 'interactiveShowcaseItem',
      title: {
        _type: 'localizedString',
        tr: 'YÖNETİCİ VE KONFERANS İÇ MEKANI',
        en: 'EXECUTIVE INTERIOR SUITE',
      },
      imageR2: {
        _type: 'r2Asset',
        url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=2500&auto=format&fit=crop',
        mimeType: 'image/jpeg',
      },
      hotspots: [
        {
          _key: 'hs-4',
          _type: 'productHotspot',
          x: 50,
          y: 65,
          product: {_type: 'reference', _ref: p4._id},
        },
        {
          _key: 'hs-5',
          _type: 'productHotspot',
          x: 28,
          y: 58,
          product: {_type: 'reference', _ref: p5._id},
        },
      ],
    },
  ]

  console.log('Updating homePage document in Sanity with full interior photography...')
  await client
    .patch('homePage')
    .set({
      interactiveShowcase: sampleShowcase,
      interactiveShowcaseBlockIndex: 1,
    })
    .commit()

  try {
    await client
      .patch('drafts.homePage')
      .set({
        interactiveShowcase: sampleShowcase,
        interactiveShowcaseBlockIndex: 1,
      })
      .commit()
  } catch (e) {
    // Ignore draft error if no draft exists
  }

  console.log('Successfully updated Sanity CMS with 100% full interior photography!')
}

seed().catch(console.error)
