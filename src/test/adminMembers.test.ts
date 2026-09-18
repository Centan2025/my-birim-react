import {describe, it, expect, vi} from 'vitest'
import type {VercelRequest, VercelResponse} from '@vercel/node'

interface AdminMembersResponse {
  success?: boolean
  count?: number
  members?: Array<{name: string}>
  member?: {architect_verification_status: string}
  error?: string
}

// Mock Supabase admin
vi.mock('../../lib/server/supabaseAdmin.js', () => ({
  getSafeSupabaseAdmin: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'prof-1',
                email: 'mimar@birim.com',
                name: 'Ahmet Mimar',
                role: 'architect',
                architect_verification_status: 'pending',
                company: 'Birim Mimarlık',
              },
            ],
            error: null,
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'prof-1',
                    architect_verification_status: 'approved',
                    role: 'architect',
                  },
                  error: null,
                }),
              }),
            }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }
      }
      return {}
    }),
  })),
}))

import fs from 'fs'
import path from 'path'
import membersHandler from '../../api/admin.js'

function createMockReqRes(overrides?: {
  method?: string
  url?: string
  headers?: Record<string, string>
  body?: unknown
}) {
  const req = {
    method: overrides?.method || 'GET',
    url: overrides?.url || '/api/admin/members',
    query: {},
    headers: overrides?.headers || {},
    body: overrides?.body || {},
    socket: {remoteAddress: '127.0.0.1'},
  } as unknown as VercelRequest

  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: null as unknown,
    setHeader(key: string, value: string) {
      this.headers[key.toLowerCase()] = value
      return this
    },
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(data: unknown) {
      this.body = data
      return this
    },
  } as unknown as VercelResponse

  return {req, res}
}

describe('api/admin/members', () => {
  const TEST_ADMIN_SECRET = 'test_secret_for_admin_break_glass_12345'

  beforeEach(() => {
    process.env['ADMIN_SECRET'] = TEST_ADMIN_SECRET
  })

  afterEach(() => {
    delete process.env['ADMIN_SECRET']
  })

  it('Auth olmadan istek atıldığında 401 dönmeli', async () => {
    const {req, res} = createMockReqRes({
      method: 'GET',
    })

    await membersHandler(req, res)

    expect(res.statusCode).toBe(401)
    const body = res.body as AdminMembersResponse
    expect(body.error).toContain('Yetkisiz erişim')
  })

  it('Sahte Origin (localhost) başlığı tek başına yetki VERMEMELİ (401 dönmeli)', async () => {
    const {req, res} = createMockReqRes({
      method: 'GET',
      headers: {
        origin: 'http://localhost:3000',
      },
    })

    await membersHandler(req, res)

    expect(res.statusCode).toBe(401)
  })

  it('Sahte yetkisiz origin başlığı tek başına yetki VERMEMELİ (401 dönmeli)', async () => {
    const {req, res} = createMockReqRes({
      method: 'GET',
      headers: {
        origin: 'https://evil.sanity.studio',
      },
    })

    await membersHandler(req, res)

    expect(res.statusCode).toBe(401)
  })

  it('Eski hardcoded secret (birim-dev-2025) artık kabul EDİLMEMELİ (401 dönmeli)', async () => {
    const {req, res} = createMockReqRes({
      method: 'GET',
      headers: {
        'x-admin-secret': 'birim-dev-2025',
      },
    })

    await membersHandler(req, res)

    expect(res.statusCode).toBe(401)
  })

  it('Doğru break-glass ADMIN_SECRET ile üyeleri listelemeli (200)', async () => {
    const {req, res} = createMockReqRes({
      method: 'GET',
      headers: {
        'x-admin-secret': TEST_ADMIN_SECRET,
      },
    })

    await membersHandler(req, res)

    expect(res.statusCode).toBe(200)
    const body = res.body as AdminMembersResponse
    expect(body.success).toBe(true)
    expect(body.count).toBe(1)
    expect(body.members?.[0]?.name).toBe('Ahmet Mimar')
  })

  it('POST /api/admin/members geçerli ID ile mimar statüsünü güncellemeli', async () => {
    const {req, res} = createMockReqRes({
      method: 'POST',
      headers: {
        'x-admin-secret': TEST_ADMIN_SECRET,
      },
      body: {
        id: 'prof-1',
        architect_verification_status: 'approved',
      },
    })

    await membersHandler(req, res)

    expect(res.statusCode).toBe(200)
    const body = res.body as AdminMembersResponse
    expect(body.success).toBe(true)
    expect(body.member?.architect_verification_status).toBe('approved')
  })

  it('POST /api/admin/members ID verilmediğinde 400 dönmeli', async () => {
    const {req, res} = createMockReqRes({
      method: 'POST',
      headers: {
        'x-admin-secret': TEST_ADMIN_SECRET,
      },
      body: {},
    })

    await membersHandler(req, res)

    expect(res.statusCode).toBe(400)
    const body = res.body as AdminMembersResponse
    expect(body.error).toContain("ID'si gereklidir")
  })

  it('DELETE /api/admin/members geçerli ID ile üye silmeli (200)', async () => {
    const {req, res} = createMockReqRes({
      method: 'DELETE',
      headers: {
        'x-admin-secret': TEST_ADMIN_SECRET,
      },
      body: {
        id: 'prof-1',
      },
    })

    await membersHandler(req, res)

    expect(res.statusCode).toBe(200)
    const body = res.body as Record<string, unknown>
    expect(body['success']).toBe(true)
    expect(body['message']).toContain('silindi')
  })

  it('DELETE /api/admin/members ID verilmediğinde 400 dönmeli', async () => {
    const {req, res} = createMockReqRes({
      method: 'DELETE',
      headers: {
        'x-admin-secret': TEST_ADMIN_SECRET,
      },
      body: {},
    })

    await membersHandler(req, res)

    expect(res.statusCode).toBe(400)
    const body = res.body as Record<string, unknown>
    expect(body['error']).toContain("ID'si gereklidir")
  })

  it('Sanity Studio client bileşenlerinde hardcoded service role anahtarı bulunmamalı', () => {
    const viewPath = path.resolve(
      __dirname,
      '../../birim-web/components/SupabaseUsersStudioView.tsx'
    )
    const exportPath = path.resolve(
      __dirname,
      '../../birim-web/tools/emailExport/EmailExportTool.tsx'
    )

    const viewContent = fs.readFileSync(viewPath, 'utf8')
    const exportContent = fs.readFileSync(exportPath, 'utf8')

    expect(viewContent).not.toContain('SUPABASE_ADMIN_KEY')
    expect(viewContent).not.toContain('4Bglk8zupMO9ooUDL0u4-9TpRZg7kMDM0MxwqALlVa8')
    expect(viewContent).not.toContain('createClient(')

    expect(exportContent).not.toContain('4Bglk8zupMO9ooUDL0u4-9TpRZg7kMDM0MxwqALlVa8')
    expect(exportContent).not.toContain('createClient(')
  })
})
