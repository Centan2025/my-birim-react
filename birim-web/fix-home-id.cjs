const {createClient} = require('@sanity/client')
const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN || '',
})

async function fix() {
  // 1. Fetch source content from home-page or drafts.home-page
  const sourceDoc =
    (await client.getDocument('drafts.home-page')) || (await client.getDocument('home-page'))
  console.log('Source Doc found:', !!sourceDoc)

  if (sourceDoc) {
    const {_id, _createdAt, _updatedAt, _rev, ...data} = sourceDoc

    // Set to 'homePage' ID which Sanity Studio deskStructure expects!
    await client.createOrReplace({
      ...data,
      _id: 'homePage',
      _type: 'homePage',
    })
    console.log('Successfully created/replaced homePage document!')

    // Delete confusing old IDs
    await client.delete('drafts.homePage').catch(() => {})
    await client.delete('drafts.home-page').catch(() => {})
    await client.delete('home-page').catch(() => {})
    console.log('Cleaned up old document IDs!')
  }
}

fix().catch(console.error)
