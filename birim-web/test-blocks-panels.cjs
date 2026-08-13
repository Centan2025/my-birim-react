const {createClient} = require('@sanity/client')
const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN || '',
})

async function run() {
  const doc = await client.getDocument('homePage')
  const blocks = doc?.contentBlocks || []
  blocks.forEach((b, i) => {
    console.log(`Block ${i} mediaType:`, b.mediaType)
    if (b.imagePanels) {
      console.log(`Block ${i} imagePanels:`, JSON.stringify(b.imagePanels, null, 2))
    }
  })
}
run()
