import { createClient } from '@sanity/client'

async function run() {
  const client = createClient({
    projectId: 'wn3a082f',
    dataset: 'production',
    useCdn: false,
    apiVersion: '2024-04-15',
    token: process.env.SANITY_AUTH_TOKEN || undefined 
  })

  // Types that use orderRankField
  const types = ['product', 'category', 'designer']
  let totalFixed = 0

  console.log('--- DERİN TARAMA BAŞLATILDI ---')

  for (const type of types) {
    console.log(`\n[${type.toUpperCase()}] Taranıyor...`)
    
    // Bütün dökümanları (taslaklar dahil) çekip JS tarafında kontrol edelim
    const query = `*[_type == $type || (_id in path("drafts.**") && _type == $type)]{_id, _type, orderRank}`
    const docs = await client.fetch(query, { type })

    console.log(`${docs.length} adet döküman bulundu. Değerler inceleniyor...`)
    
    const brokenDocs = docs.filter(doc => doc.orderRank === null || doc.orderRank === undefined)

    if (brokenDocs.length > 0) {
      console.log(`${brokenDocs.length} adet bozuk (null/undefined) döküman bulundu. Onarılıyor...`)
      
      const transaction = client.transaction()
      brokenDocs.forEach(doc => {
        transaction.patch(doc._id, p => p.set({ orderRank: 'a0' }))
      })
      
      await transaction.commit()
      console.log('Batch onarıldı.')
      totalFixed += brokenDocs.length
    } else {
      console.log('Bu tipte bozuk veri yok.')
    }
  }

  console.log(`\n--- BİTTİ: Toplam ${totalFixed} döküman onarıldı. ---`)
}

run().catch(err => {
  console.error('\n!!! HATA:', err)
  process.exit(1)
})
