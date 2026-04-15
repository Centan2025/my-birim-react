import { createClient } from '@sanity/client'

async function run() {
  const client = createClient({
    projectId: 'wn3a082f',
    dataset: 'production',
    useCdn: false,
    apiVersion: '2024-04-15',
    token: process.env.SANITY_AUTH_TOKEN || undefined 
  })

  const types = ['product', 'category', 'designer']
  let totalPatched = 0

  console.log('--- AGRESİF ONARIM BAŞLATILDI ---')

  for (const type of types) {
    console.log(`\n[${type.toUpperCase()}] İşleniyor...`)
    
    const docs = await client.fetch(`*[_type == $type || (_id in path("drafts.**") && _type == $type)]{_id, orderRank}`, { type })

    if (docs.length > 0) {
      console.log(`${docs.length} döküman bulundu. Hepsine taze orderRank atanıyor...`)
      
      const batchSize = 100
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = docs.slice(i, i + batchSize)
        const transaction = client.transaction()
        
        batch.forEach((doc, idx) => {
          // Benzersiz ve geçerli bir rank (lexical string)
          const rank = `a0${(i + idx).toString().padStart(6, '0')}`
          transaction.patch(doc._id, p => p.set({ orderRank: rank }))
        })
        
        await transaction.commit()
        totalPatched += batch.length
      }
    }
  }

  console.log(`\n--- BİTTİ: Toplam ${totalPatched} döküman güncellendi. ---`)
}

run().catch(err => {
  console.error('\n!!! HATA:', err)
  process.exit(1)
})
