const {createClient} = require('@sanity/client')

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
})

async function checkUrl(url) {
  if (!url || typeof url !== 'string') return false
  try {
    const res = await fetch(url, {method: 'HEAD'})
    return res.status === 200
  } catch (e) {
    return false
  }
}

async function main() {
  const products = await client.fetch(`*[_type == "product"]{
    "id": id.current,
    name,
    description,
    media[]{
      type,
      "url": imageR2.url,
      isCover
    }
  }`)

  console.log('Checking all product media URLs for 200 OK status...')
  const validProducts = []

  for (const p of products) {
    console.log(`Product: ${p.name?.tr || p.name?.en || p.id}`)
    const validMedia = []
    if (p.media) {
      for (const m of p.media) {
        if (m.url) {
          const ok = await checkUrl(m.url)
          console.log(`   ${ok ? '✅ 200 OK' : '❌ 404 NOT FOUND'}: ${m.url}`)
          if (ok) validMedia.push(m)
        }
      }
    }
    if (validMedia.length > 0) {
      validProducts.push({...p, validMedia})
    }
  }

  // Also check some home panel images
  const homeImages = [
    'https://birim-assets.web-birim.workers.dev/migration/home/panels/1777281594540-pomelli-image (12).webp',
    'https://birim-assets.web-birim.workers.dev/migration/home/panels/1777281629008-pomelli-image (10).webp',
    'https://birim-assets.web-birim.workers.dev/migration/home/panels/1777281661325-pomelli-image (9).webp',
    'https://birim-assets.web-birim.workers.dev/migration/products/dr0001-tin-dresuar/1781604158672-tin-dresuar.webp',
    'https://birim-assets.web-birim.workers.dev/products/dresuarlar/tin-dresuar/DR0001_TIN_01.webp',
    'https://birim-assets.web-birim.workers.dev/products/depolamalar/tau-konsol/DP0014_TAU_KONSOL_02.webp',
    'https://birim-assets.web-birim.workers.dev/migration/products/kn0250-riva/1785155403170-0250 RİVA.webp',
    'https://birim-assets.web-birim.workers.dev/products/kanepeler/riva/KN0250_RİVA_02.webp',
    'https://birim-assets.web-birim.workers.dev/products/depolamalar/cab/DP0006_CAB_02.webp',
    'https://birim-assets.web-birim.workers.dev/migration/products/dp0006-cab/1782286562154-cab-konsol.webp',
    'https://birim-assets.web-birim.workers.dev/migration/products/dp0004-mes/1782287498949-mes-site.webp',
    'https://birim-assets.web-birim.workers.dev/products/depolamalar/mes/DP0004_MES_01.webp',
    'https://birim-assets.web-birim.workers.dev/products/kanepeler/su/KN0203_SU_01.webp',
    'https://birim-assets.web-birim.workers.dev/products/kanepeler/espas/KN0205_ESPAS_01.webp',
    'https://birim-assets.web-birim.workers.dev/products/tekliler/bench-t/TK0243_BENCH_07.webp',
    'https://birim-assets.web-birim.workers.dev/migration/products/tk0252-sense/1785154540401-TK0252_SENSE_01.webp',
  ]

  console.log('\nChecking static home asset URLs...')
  for (const url of homeImages) {
    const ok = await checkUrl(url)
    console.log(`   ${ok ? '✅ 200 OK' : '❌ 404 NOT FOUND'}: ${url}`)
  }
}

main().catch(console.error)
