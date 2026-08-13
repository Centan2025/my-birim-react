const {createClient} = require('@sanity/client')

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
})

async function main() {
  const home = await client.fetch(`*[_type == "homePage"][0]`)
  console.log('=== HOME PAGE DATA ===')
  console.log('_id:', home._id)
  console.log('_type:', home._type)

  home.contentBlocks.forEach((b, i) => {
    console.log(`\nBlock ${i} [${b._key}]:`)
    console.log('  mediaType:', b.mediaType)
    console.log('  imageR2:', b.imageR2)
    console.log('  title:', JSON.stringify(b.title))
    console.log('  linkText:', JSON.stringify(b.linkText))
    console.log('  linkUrl:', b.linkUrl)
  })
}

main().catch(console.error)
