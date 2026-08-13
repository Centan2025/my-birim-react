import {createClient} from '@sanity/client'
import {randomBytes} from 'crypto'

const generateKey = () => randomBytes(8).toString('hex')

function fixKeys(obj) {
  let fixed = false
  if (Array.isArray(obj)) {
    obj.forEach((item) => {
      if (item && typeof item === 'object') {
        if (!item._key) {
          item._key = generateKey()
          fixed = true
        }
        if (fixKeys(item)) fixed = true
      }
    })
  } else if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (fixKeys(obj[key])) fixed = true
    }
  }
  return fixed
}

async function run() {
  const client = createClient({
    projectId: 'wn3a082f',
    dataset: 'production',
    useCdn: false,
    apiVersion: '2024-04-15',
    token: process.env.SANITY_TOKEN,
  })

  // Get all types from the dataset to be safe
  const schemas = await client.fetch(`*[_type == "system.schema"][0].types`)
  // Since we can't easily get all types from system.schema in all Sanity versions,
  // let's just list the ones we know from index.ts
  const types = [
    'category',
    'designer',
    'product',
    'newsItem',
    'siteSettings',
    'homePage',
    'aboutPage',
    'contactPage',
    'factoryPage',
    'footer',
    'materialGroup',
    'project',
    'user',
    'cookiesPolicy',
    'privacyPolicy',
    'termsOfService',
    'kvkkPolicy',
    'translations',
  ]

  let totalFixed = 0

  console.log('--- TÜM TÜRLERDE DERİN KEY TARAMASI BAŞLATILDI ---')

  for (const type of types) {
    console.log(`Checking ${type}...`)
    const docs = await client.fetch(`*[_type == $type]`, {type})

    for (const doc of docs) {
      const docCopy = JSON.parse(JSON.stringify(doc))

      if (fixKeys(docCopy)) {
        console.log(`Fixing document ${doc._id} (${type})...`)
        const id = docCopy._id
        delete docCopy._id
        delete docCopy._type
        delete docCopy._createdAt
        delete docCopy._updatedAt
        delete docCopy._rev

        await client.patch(id).set(docCopy).commit()
        totalFixed++
      }
    }
  }

  console.log(`--- BİTTİ: ${totalFixed} döküman onarıldı. ---`)
}

run().catch(console.error)
