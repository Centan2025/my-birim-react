const {createClient} = require('@sanity/client')

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
})

async function main() {
  const home = await client.fetch(`*[_type == "homePage"][0]`)
  console.log('=== VERIFYING ALL HOME CONTENT BLOCK IMAGES ===')
  for (let i = 0; i < home.contentBlocks.length; i++) {
    const b = home.contentBlocks[i]
    const url = b.imageR2?.url || b.image
    if (url) {
      const res = await fetch(url, {method: 'HEAD'})
      console.log(
        `Block ${i} [${b._key}]: ${res.status === 200 ? '✅ 200 OK' : '❌ ' + res.status} -> ${url}`
      )
    } else if (b.mediaType === 'panels') {
      console.log(`Block ${i} [${b._key}]: ✅ PANEL BLOCK (Preserved)`)
    }
  }
}

main().catch(console.error)
