import {createClient} from '@sanity/client'
import dotenv from 'dotenv'
dotenv.config({path: '.env.local'})

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN,
})

async function run() {
  const drafts = await client.fetch('*[_id in path("drafts.**")]{ _id, _type, _updatedAt }')
  console.log('ALL ACTIVE DRAFTS IN DATASET:', drafts)
}
run()
