const {createClient} = require('@sanity/client')

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
})

async function main() {
  const home = await client.fetch(`*[_type == "homePage"][0]`)
  console.log('=== HERO MEDIA (DO NOT TOUCH) ===')
  console.log(JSON.stringify(home?.heroMedia, null, 2))

  console.log('\n=== CONTENT BLOCKS ===')
  console.log(JSON.stringify(home?.contentBlocks, null, 2))
}

main().catch(console.error)
