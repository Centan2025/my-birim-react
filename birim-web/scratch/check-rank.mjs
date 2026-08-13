import {createClient} from '@sanity/client'

async function check() {
  const client = createClient({
    projectId: 'wn3a082f',
    dataset: 'production',
    useCdn: false,
    apiVersion: '2024-04-15',
  })

  const res = await client.fetch('*[_type == "category" && defined(orderRank)][0]{orderRank}')
  console.log('Valid orderRank sample:', JSON.stringify(res))
}

check().catch(console.error)
