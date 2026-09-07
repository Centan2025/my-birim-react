import {describe, it, expect} from 'vitest'
import {mapProfileToUser} from '../services/supabase/auth'
import type {SupabaseProfileRow} from '../services/supabase/auth'

describe('Supabase Auth & Profile Mapping', () => {
  it('should correctly map SupabaseProfileRow to Birim User object', () => {
    const row: SupabaseProfileRow = {
      id: 'usr-12345',
      email: 'mimar@birim.com',
      first_name: 'Ahmet',
      last_name: 'Yılmaz',
      name: 'Ahmet Yılmaz',
      role: 'architect',
      company: 'Birim Mimarlık Ltd.',
      profession: 'İç Mimar',
      phone: '+905551234567',
      architect_verification_status: 'verified',
      is_verified: true,
      created_at: '2026-09-07T12:00:00Z',
    }

    const user = mapProfileToUser(row)

    expect(user._id).toBe('usr-12345')
    expect(user.email).toBe('mimar@birim.com')
    expect(user.name).toBe('Ahmet Yılmaz')
    expect(user.role).toBe('architect')
    expect(user.company).toBe('Birim Mimarlık Ltd.')
    expect(user.architectVerificationStatus).toBe('verified')
    expect(user.isVerified).toBe(true)
    expect(user.isActive).toBe(true)
  })

  it('should handle missing name by concatenating first and last name', () => {
    const row: SupabaseProfileRow = {
      id: 'usr-2',
      email: 'user2@example.com',
      first_name: 'Mehmet',
      last_name: 'Kaya',
      role: 'consumer',
      created_at: '2026-09-07T12:00:00Z',
    }

    const user = mapProfileToUser(row)
    expect(user.name).toBe('Mehmet Kaya')
    expect(user.role).toBe('consumer')
    expect(user.architectVerificationStatus).toBe('not_requested')
  })

  it('should fallback to email prefix if no names are provided', () => {
    const row: SupabaseProfileRow = {
      id: 'usr-3',
      email: 'testuser@birim.com',
    }

    const user = mapProfileToUser(row)
    expect(user.name).toBe('testuser')
    expect(user.role).toBe('consumer')
  })
})
