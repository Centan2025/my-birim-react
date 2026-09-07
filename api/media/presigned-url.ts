import type {VercelRequest, VercelResponse} from '@vercel/node'
import mediaActionHandler from './[action].js'

/**
 * Legacy backwards-compatible endpoint for generating R2 presigned upload URLs.
 * Delegates directly to the consolidated media action handler.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!req.query) {
    req.query = {}
  }
  req.query['action'] = 'presigned-url'
  return mediaActionHandler(req, res)
}
