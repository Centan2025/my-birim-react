import {createClient} from '@sanity/client'
import type {VercelRequest, VercelResponse} from '@vercel/node'

const SANITY_PROJECT_ID = process.env['SANITY_PROJECT_ID'] || process.env['VITE_SANITY_PROJECT_ID'] || 'wn3a082f'
const SANITY_DATASET = process.env['SANITY_DATASET'] || process.env['VITE_SANITY_DATASET'] || 'production'
const SANITY_API_VERSION = process.env['SANITY_API_VERSION'] || process.env['VITE_SANITY_API_VERSION'] || '2025-01-01'
const SANITY_TOKEN = process.env['SANITY_TOKEN']

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  token: SANITY_TOKEN,
  useCdn: false,
})

import {getAuthTokenFromReq, verifyToken} from './_token'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  const token = getAuthTokenFromReq(req)
  if (!token) {
    return res.status(401).json({error: 'Hesap silmek için oturum açmanız gerekmektedir.'})
  }

  const payload = verifyToken(token)
  if (!payload || !payload.sub) {
    return res.status(401).json({error: 'Geçersiz veya süresi dolmuş oturum.'})
  }

  const {id} = req.body || {}

  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return res.status(400).json({error: "Kullanıcı ID'si gereklidir."})
  }

  if (payload.sub !== id && payload.role !== 'admin') {
    return res.status(403).json({error: 'Bu hesabı silme yetkiniz bulunmamaktadır.'})
  }

  // System document & invalid ID protection
  if (id.startsWith('_') || id.includes('..') || id.includes('drafts.')) {
    return res.status(400).json({error: "Geçersiz kullanıcı ID'si."})
  }

  try {
    const existing = await client.fetch(
      `*[_type == "user" && _id == $id && !defined(_deleted)][0]._id`,
      {id}
    )

    if (!existing) {
      return res.status(404).json({error: 'Kullanıcı bulunamadı.'})
    }

    await client.delete(id)
    return res.status(200).json({success: true, message: 'Hesap başarıyla silindi.'})
  } catch (error: unknown) {
    console.error('Delete account error:', error)
    return res.status(500).json({error: 'Hesap silinirken bir hata oluştu.'})
  }
}
