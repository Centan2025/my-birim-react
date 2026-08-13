import {createClient} from '@sanity/client'
import {randomBytes} from 'crypto'

const generateKey = () => randomBytes(8).toString('hex')

async function run() {
  const client = createClient({
    projectId: 'wn3a082f',
    dataset: 'production',
    useCdn: false,
    apiVersion: '2024-04-15',
    token: process.env.SANITY_TOKEN,
  })

  const types = ['product', 'designer', 'category', 'project']
  let totalFixed = 0

  console.log('--- ARRAY KEY TARAMASI BAŞLATILDI ---')

  for (const type of types) {
    const docs = await client.fetch(`*[_type == $type]`, {type})

    for (const doc of docs) {
      let needsFix = false
      const patches = {}

      // Check all fields for arrays
      for (const [key, value] of Object.entries(doc)) {
        if (Array.isArray(value)) {
          const newArray = value.map((item) => {
            if (item && typeof item === 'object' && !item._key) {
              needsFix = true
              return {...item, _key: generateKey()}
            }
            return item
          })
          if (needsFix) {
            patches[key] = newArray
          }
        }
      }

      if (needsFix) {
        console.log(`Fixing document ${doc._id} (${type})...`)
        await client.patch(doc._id).set(patches).commit()
        totalFixed++
      }
    }
  }

  console.log(`--- BİTTİ: ${totalFixed} döküman onarıldı. ---`)
}

run().catch(console.error)
