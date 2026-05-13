import { createClient } from '@sanity/client'

async function run() {
  const client = createClient({
    projectId: 'wn3a082f',
    dataset: 'production',
    useCdn: false,
    apiVersion: '2024-04-15',
    token: process.env.SANITY_TOKEN
  })

  const doc = await client.fetch('*[_id == "644cMkYzFf9ZhJ6dLMFJ4A"][0]')
  console.log(JSON.stringify(doc, null, 2))
}

run().catch(console.error)
