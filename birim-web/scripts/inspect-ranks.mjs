import {createClient} from '@sanity/client'

async function run() {
  const client = createClient({
    projectId: 'wn3a082f',
    dataset: 'production',
    useCdn: false,
    apiVersion: '2024-04-15',
    token: process.env.SANITY_AUTH_TOKEN || undefined,
  })

  const types = ['product', 'category', 'designer']

  for (const type of types) {
    console.log(`\n--- ${type.toUpperCase()} ---`)
    const docs = await client.fetch(
      `*[_type == "${type}" || (_id in path("drafts.**") && _type == "${type}")]{_id, orderRank}`,
    )

    docs.forEach((d) => {
      if (d.orderRank !== undefined && typeof d.orderRank !== 'string') {
        console.log(
          `!! HATA: ${d._id} -> type: ${typeof d.orderRank}, value: ${JSON.stringify(d.orderRank)}`,
        )
      }
    })
  }
}

run().catch(console.error)
