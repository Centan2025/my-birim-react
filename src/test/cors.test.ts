import {describe, it, expect, beforeEach, afterEach} from 'vitest'
import {isOriginAllowed} from '../../lib/server/cors'

describe('isOriginAllowed (CORS security)', () => {
  const originalNodeEnv = process.env['NODE_ENV']

  afterEach(() => {
    process.env['NODE_ENV'] = originalNodeEnv
  })

  it('allows official Birim domains in production', () => {
    process.env['NODE_ENV'] = 'production'
    expect(isOriginAllowed('https://www.birim.com')).toBe(true)
    expect(isOriginAllowed('https://birim.com')).toBe(true)
    expect(isOriginAllowed('https://sub.birim.com')).toBe(true)
    expect(isOriginAllowed('https://birim.sanity.studio')).toBe(true)
  })

  it('rejects malicious or random vercel.app domains', () => {
    process.env['NODE_ENV'] = 'production'
    expect(isOriginAllowed('https://evil.vercel.app')).toBe(false)
    expect(isOriginAllowed('https://random-phishing.vercel.app')).toBe(false)
    expect(isOriginAllowed('https://not-birim.vercel.app')).toBe(false)
  })

  it('allows Birim official Vercel preview deployments', () => {
    expect(isOriginAllowed('https://my-birim-react-abc123-centans-projects.vercel.app')).toBe(true)
    expect(isOriginAllowed('https://my-birim-react-centans-projects.vercel.app')).toBe(true)
  })

  it('rejects fake localhost origins', () => {
    process.env['NODE_ENV'] = 'development'
    expect(isOriginAllowed('http://localhost.evil.com')).toBe(false)
    expect(isOriginAllowed('http://localhost:8080.evil.com')).toBe(false)
    expect(isOriginAllowed('https://attacker.com?origin=localhost:3001')).toBe(false)
  })

  it('allows localhost only in development', () => {
    process.env['NODE_ENV'] = 'development'
    expect(isOriginAllowed('http://localhost:3001')).toBe(true)
    expect(isOriginAllowed('http://localhost:5173')).toBe(true)

    process.env['NODE_ENV'] = 'production'
    expect(isOriginAllowed('http://localhost:3001')).toBe(false)
  })
})
