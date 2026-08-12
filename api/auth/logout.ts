import {clearAuthCookie} from './_token'
import type {VercelRequest, VercelResponse} from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  clearAuthCookie(res)
  return res.status(200).json({success: true, message: 'Oturum kapatıldı.'})
}
