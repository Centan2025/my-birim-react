const {createClient} = require('@sanity/client')

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN || '',
})

async function main() {
  console.log('Fixing borderThickness in homePage documents...')
  const docs = await client.fetch(`*[_type == "homePage"]`)

  for (const doc of docs) {
    console.log(`Processing document ${doc._id}...`)
    if (!doc.contentBlocks) continue

    const updatedBlocks = doc.contentBlocks.map(b => {
      const newBlock = {...b}
      if (!newBlock.hasBorder || newBlock.borderThickness < 1) {
        newBlock.borderThickness = 1 // Set to 1 to satisfy Rule.min(1).max(12)
      }
      return newBlock
    })

    await client.patch(doc._id).set({contentBlocks: updatedBlocks}).commit()
    console.log(`Document ${doc._id} updated successfully!`)
  }
}

main().catch(console.error)
