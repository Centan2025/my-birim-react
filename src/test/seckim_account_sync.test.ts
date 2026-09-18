/* eslint-disable @typescript-eslint/no-explicit-any */
import {describe, it, expect, vi, beforeEach} from 'vitest'
import {
  listSelectionsForUser,
  saveSelectionForUser,
  removeSelectionForUser,
  clearSelectionsForUser,
  bulkSyncSelectionsForUser,
  listProjectsForUser,
  createProjectForUser,
  updateProjectForUser,
  deleteProjectForUser,
} from '../../lib/account/account-service'
import accountHandler from '../../api/account.js'
import {createToken} from '../../lib/server/token'
import {
  fetchUserSelections,
  clearUserSelections,
  bulkSyncUserSelections,
} from '../services/supabase/seckim'

function createMockSupabaseClient(initialState: {
  selections?: any[]
  projects?: any[]
  projectProducts?: any[]
}) {
  const selections = [...(initialState.selections || [])]
  const projects = [...(initialState.projects || [])]
  const projectProducts = [...(initialState.projectProducts || [])]

  const client: any = {
    from: vi.fn((table: string) => {
      let currentTable: any[] = []
      if (table === 'user_selections') currentTable = selections
      else if (table === 'projects') currentTable = projects
      else if (table === 'project_products') currentTable = projectProducts

      const filters: Array<(row: any) => boolean> = []

      const queryBuilder: any = {
        select: vi.fn(() => queryBuilder),
        eq: vi.fn((field: string, value: any) => {
          filters.push((row: any) => row[field] === value)
          return queryBuilder
        }),
        in: vi.fn((field: string, values: any[]) => {
          filters.push((row: any) => values.includes(row[field]))
          return queryBuilder
        }),
        order: vi.fn(() => queryBuilder),
        single: vi.fn(async () => {
          const results = currentTable.filter(r => filters.every(f => f(r)))
          if (results.length === 0) {
            return {data: null, error: {message: 'Row not found'}}
          }
          return {data: {...results[0]}, error: null}
        }),
        maybeSingle: vi.fn(async () => {
          const results = currentTable.filter(r => filters.every(f => f(r)))
          return {data: results[0] ? {...results[0]} : null, error: null}
        }),
        insert: vi.fn((dataToInsert: any) => {
          const rows = Array.isArray(dataToInsert) ? dataToInsert : [dataToInsert]
          const inserted: any[] = []
          for (const item of rows) {
            const row = {
              id: item.id || `gen_id_${Date.now()}_${Math.random()}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...item,
            }
            currentTable.push(row)
            inserted.push(row)
          }
          const insertResultBuilder: any = {
            select: vi.fn(() => ({
              single: vi.fn(async () => ({data: inserted[0], error: null})),
            })),
            then: (resolve: any) => resolve({data: inserted, error: null}),
          }
          return insertResultBuilder
        }),
        update: vi.fn((updates: any) => {
          return {
            eq: vi.fn((field1: string, val1: any) => ({
              eq: vi.fn(async (field2: string, val2: any) => {
                let updatedCount = 0
                currentTable.forEach(row => {
                  if (row[field1] === val1 && row[field2] === val2) {
                    Object.assign(row, updates)
                    updatedCount++
                  }
                })
                return {data: updatedCount, error: null}
              }),
            })),
          }
        }),
        delete: vi.fn(() => {
          const deleteBuilder: any = {
            eq: vi.fn((field: string, val: any) => {
              filters.push((row: any) => row[field] === val)
              return {
                eq: vi.fn(async (field2: string, val2: any) => {
                  const idxs: number[] = []
                  currentTable.forEach((r, i) => {
                    if (r[field] === val && r[field2] === val2) idxs.push(i)
                  })
                  idxs.reverse().forEach(i => currentTable.splice(i, 1))
                  return {data: null, error: null}
                }),
                then: (resolve: any) => {
                  const idxs: number[] = []
                  currentTable.forEach((r, i) => {
                    if (r[field] === val) idxs.push(i)
                  })
                  idxs.reverse().forEach(i => currentTable.splice(i, 1))
                  return resolve({data: null, error: null})
                },
              }
            }),
          }
          return deleteBuilder
        }),
        then: (resolve: any) => {
          const results = currentTable.filter(r => filters.every(f => f(r)))
          return resolve({data: results, error: null})
        },
      }
      return queryBuilder
    }),
  }

  return {client, selections, projects, projectProducts}
}

describe('Seckim & Projects Account Service & Sync', () => {
  const userId = 'user_test_uuid_123'

  describe('Account Service Layer', () => {
    it('saves and lists user selections correctly', async () => {
      const {client} = createMockSupabaseClient({})
      const saved = await saveSelectionForUser(userId, 'prod_100', {supabaseClientOverride: client})
      expect(saved).toBe(true)

      const selections = await listSelectionsForUser(userId, {supabaseClientOverride: client})
      expect(selections).toContain('prod_100')
    })

    it('removes a user selection correctly', async () => {
      const {client} = createMockSupabaseClient({
        selections: [{user_id: userId, product_id: 'prod_100'}],
      })

      const removed = await removeSelectionForUser(userId, 'prod_100', {
        supabaseClientOverride: client,
      })
      expect(removed).toBe(true)

      const selections = await listSelectionsForUser(userId, {supabaseClientOverride: client})
      expect(selections).not.toContain('prod_100')
    })

    it('clears all user selections correctly', async () => {
      const {client} = createMockSupabaseClient({
        selections: [
          {user_id: userId, product_id: 'prod_100'},
          {user_id: userId, product_id: 'prod_200'},
        ],
      })

      const cleared = await clearSelectionsForUser(userId, {supabaseClientOverride: client})
      expect(cleared).toBe(true)

      const selections = await listSelectionsForUser(userId, {supabaseClientOverride: client})
      expect(selections.length).toBe(0)
    })

    it('bulk syncs guest selections with server selections without duplication', async () => {
      const {client} = createMockSupabaseClient({
        selections: [{user_id: userId, product_id: 'server_prod_1'}],
      })

      const merged = await bulkSyncSelectionsForUser(
        userId,
        ['guest_prod_1', 'server_prod_1', 'guest_prod_2'],
        {supabaseClientOverride: client}
      )

      expect(merged).toEqual(
        expect.arrayContaining(['server_prod_1', 'guest_prod_1', 'guest_prod_2'])
      )
      expect(merged.length).toBe(3)
    })

    it('creates, lists, updates and deletes user projects with products', async () => {
      const {client} = createMockSupabaseClient({})

      const project = await createProjectForUser(
        userId,
        {
          name: 'Bodrum Villa',
          description: 'Salon ve Teras Mobilyaları',
          productIds: ['prod_1', 'prod_2'],
          isPublic: true,
        },
        {supabaseClientOverride: client}
      )

      expect(project).not.toBeNull()
      expect(project?.name).toBe('Bodrum Villa')
      expect(project?.productIds).toEqual(['prod_1', 'prod_2'])
      expect(project?.shareToken).toBeDefined()

      const list = await listProjectsForUser(userId, {supabaseClientOverride: client})
      expect(list.length).toBe(1)
      expect(list[0].id).toBe(project?.id)

      const updated = await updateProjectForUser(
        userId,
        project!.id,
        {name: 'Bodrum Villa Revize', productIds: ['prod_1', 'prod_3']},
        {supabaseClientOverride: client}
      )
      expect(updated).toBe(true)

      const deleted = await deleteProjectForUser(userId, project!.id, {
        supabaseClientOverride: client,
      })
      expect(deleted).toBe(true)
    })
  })

  describe('Account API Route Handler (/api/account)', () => {
    function createMockRes() {
      const res: any = {
        statusCode: 200,
        headers: {},
        data: null,
        status(code: number) {
          this.statusCode = code
          return this
        },
        json(payload: any) {
          this.data = payload
          return this
        },
        setHeader(name: string, val: string) {
          this.headers[name] = val
          return this
        },
      }
      return res
    }

    const validToken = createToken({
      sub: userId,
      email: 'test@birim.com',
      role: 'consumer',
    })

    it('handles GET /api/account/selections with authentication', async () => {
      const req: any = {
        method: 'GET',
        headers: {authorization: `Bearer ${validToken}`},
        query: {slug: ['selections']},
      }
      const res = createMockRes()
      await accountHandler(req, res)

      expect(res.statusCode).toBe(200)
      expect(res.data.success).toBe(true)
      expect(Array.isArray(res.data.productIds)).toBe(true)
    })

    it('handles POST /api/account/selections/sync for guest migration', async () => {
      const req: any = {
        method: 'POST',
        headers: {authorization: `Bearer ${validToken}`},
        query: {slug: ['selections', 'sync']},
        body: {productIds: ['item_1', 'item_2']},
      }
      const res = createMockRes()
      await accountHandler(req, res)

      expect(res.statusCode).toBe(200)
      expect(res.data.success).toBe(true)
      expect(Array.isArray(res.data.productIds)).toBe(true)
    })

    it('handles DELETE /api/account/selections/all for bulk clear', async () => {
      const req: any = {
        method: 'DELETE',
        headers: {authorization: `Bearer ${validToken}`},
        query: {slug: ['selections', 'all']},
      }
      const res = createMockRes()
      await accountHandler(req, res)

      expect(res.statusCode).toBe(200)
      expect(res.data.success).toBe(true)
    })

    it('handles GET /api/account/projects for project listing', async () => {
      const reqGet: any = {
        method: 'GET',
        headers: {authorization: `Bearer ${validToken}`},
        query: {slug: ['projects']},
      }
      const resGet = createMockRes()
      await accountHandler(reqGet, resGet)

      expect(resGet.statusCode).toBe(200)
      expect(resGet.data.success).toBe(true)
      expect(Array.isArray(resGet.data.projects)).toBe(true)
    })
  })

  describe('Frontend Seckim Service (fetch client)', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('fetches selections via /api/account/selections', async () => {
      globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
        const u = url.toString()
        if (u.includes('/api/account/selections')) {
          return {
            ok: true,
            json: async () => ({success: true, productIds: ['chair_1', 'table_2']}),
          } as Response
        }
        return {ok: false, json: async () => ({})} as Response
      })

      const selections = await fetchUserSelections(userId)
      expect(selections).toEqual(['chair_1', 'table_2'])
    })

    it('clears selections via /api/account/selections/all', async () => {
      globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
        const u = url.toString()
        if (u.includes('/api/account/selections/all')) {
          return {
            ok: true,
            json: async () => ({success: true}),
          } as Response
        }
        return {ok: false, json: async () => ({})} as Response
      })

      const cleared = await clearUserSelections(userId)
      expect(cleared).toBe(true)
    })

    it('syncs selections via /api/account/selections/sync', async () => {
      globalThis.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
        const u = url.toString()
        if (u.includes('/api/account/selections/sync')) {
          const body = JSON.parse(init?.body as string)
          return {
            ok: true,
            json: async () => ({
              success: true,
              productIds: [...body.productIds, 'server_chair'],
            }),
          } as Response
        }
        return {ok: false, json: async () => ({})} as Response
      })

      const synced = await bulkSyncUserSelections(userId, ['local_chair'])
      expect(synced).toContain('local_chair')
      expect(synced).toContain('server_chair')
    })
  })
})
