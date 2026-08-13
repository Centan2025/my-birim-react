const {createClient} = require('@sanity/client')

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
})

async function main() {
  const home = await client.fetch(`*[_type == "homePage"][0]`)
  console.log('=== INSPECTING HOME PAGE CONTENT BLOCKS ===')
  home.contentBlocks.forEach((b, i) => {
    console.log(`\nBlock ${i} [_key: "${b._key}"] - mediaType: ${b.mediaType}`)
    if (b.mediaType === 'panels') {
      console.log('  imagePanels:', JSON.stringify(b.imagePanels, null, 2))
    }
  })
}

main().catch(console.error)
