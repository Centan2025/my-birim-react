import {describe, it, expect, vi, beforeEach} from 'vitest'

// Mock sanity client and mutations
vi.mock('./client', () => ({
  sanity: {
    fetch: vi.fn(),
  },
  useSanity: true,
  sanityMutations: {
    create: vi.fn(),
    patch: vi.fn(() => ({
      set: vi.fn(() => ({
        commit: vi.fn(),
      })),
    })),
  },
}))

import {sanity} from './client'
import {loginUser, registerUser, getUserByEmail} from './auth'

describe('sanity auth service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock global fetch to avoid "Failed to parse URL" errors with relative paths
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({success: true, user: {_id: 'u-1', email: 'test@ex.com'}}),
      })
    )
  })

  it('getUserByEmail doğru kullanıcıyı döner', async () => {
    vi.mocked(sanity.fetch).mockResolvedValue({_id: 'u1', email: 'test@ex.com'})
    const user = await getUserByEmail('test@ex.com')
    expect(user?.email).toBe('test@ex.com')
  })

  it('loginUser başarılı login durumunda kullanıcı döner', async () => {
    const user = await loginUser('test@ex.com', 'password123')
    expect(user.email).toBe('test@ex.com')
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/login'),
      expect.any(Object)
    )
  })

  it('registerUser yeni kullanıcı oluşturur ve e-posta tetikler', async () => {
    const user = await registerUser('new@ex.com', 'pwd123', 'New User', 'Company', 'Title', 'TR')
    expect(user._id).toBe('u-1')
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/register'),
      expect.any(Object)
    )
  })
})
