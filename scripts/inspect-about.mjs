import {createClient} from '@sanity/client'
import dotenv from 'dotenv'
dotenv.config()

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
})

async function inspect() {
  const doc = await client.fetch('*[_type == "aboutPage"][0]')
  console.log('ABOUT PAGE DOC:', JSON.stringify(doc, null, 2))
}

inspect()
