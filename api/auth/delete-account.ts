import {createClient} from '@sanity/client'

const SANITY_PROJECT_ID = process.env['VITE_SANITY_PROJECT_ID'] || 'wn3a082f'
const SANITY_DATASET = process.env['VITE_SANITY_DATASET'] || 'production'
const SANITY_API_VERSION = process.env['VITE_SANITY_API_VERSION'] || '2025-01-01'
const SANITY_TOKEN = process.env['SANITY_TOKEN'] || process.env['VITE_SANITY_TOKEN']

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  token: SANITY_TOKEN,
  useCdn: false,
})

import type {VercelRequest, VercelResponse} from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  // Gerçek bir uygulamada burada JWT veya Session kontrolü yapılmalıdır.
  const {id} = req.body

  if (!id) {
    return res.status(400).json({error: "Kullanıcı ID'si gereklidir."})
  }

  try {
    await client.delete(id)
    return res.status(200).json({success: true, message: 'Hesap başarıyla silindi.'})
  } catch (error: unknown) {
    console.error('Delete account error:', error)
    return res.status(500).json({error: 'Hesap silinirken bir hata oluştu.'})
  }
}
