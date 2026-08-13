const {createClient} = require('@sanity/client')
const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN || '',
})

client.fetch('*[_type == "homePage"]').then((res) => {
  console.log(
    res.map((d) => ({
      _id: d._id,
      heroMediaCount: d.heroMedia?.length,
      contentBlocksCount: d.contentBlocks?.length,
    })),
  )
})
