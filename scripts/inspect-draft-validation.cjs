const {createClient} = require('@sanity/client')

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN || '',
})

async function main() {
  const docs = await client.fetch(`*[_type == "homePage"]`)
  console.log('Found homePage count:', docs.length)

  docs.forEach(doc => {
    console.log(`\n================ DOCUMENT ID: ${doc._id} ================`)
    console.log('_rev:', doc._rev)
    console.log('_updatedAt:', doc._updatedAt)
    console.log('contentBlocks count:', doc.contentBlocks?.length)

    if (doc.contentBlocks) {
      doc.contentBlocks.forEach((b, i) => {
        console.log(`\n--- Block ${i} [_key: "${b._key}"] ---`)
        console.log('  _type:', b._type)
        console.log('  mediaType:', b.mediaType)
        console.log('  title:', JSON.stringify(b.title))
        console.log('  imageR2:', b.imageR2)
        console.log('  hasBorder:', b.hasBorder)
        console.log('  borderThickness:', b.borderThickness)
        console.log('  linkUrl:', b.linkUrl)
        console.log('  allKeys:', Object.keys(b))
      })
    }
  })
}

main().catch(console.error)
