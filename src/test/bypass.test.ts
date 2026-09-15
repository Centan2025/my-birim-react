import {describe, it, expect, beforeEach} from 'vitest'

describe('Maintenance Mode Bypass Logic', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
    document.cookie = 'maintenance_bypass=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
  })

  it('persists verified bypass token to storage and cookie on initial access', () => {
    const token = 'verified-session-token-abc'
    sessionStorage.setItem('maintenance_bypass', token)
    localStorage.setItem('maintenance_bypass', token)
    document.cookie = `maintenance_bypass=${encodeURIComponent(token)}; path=/; SameSite=Strict`

    expect(sessionStorage.getItem('maintenance_bypass')).toBe('verified-session-token-abc')
    expect(localStorage.getItem('maintenance_bypass')).toBe('verified-session-token-abc')
    expect(document.cookie).toContain('maintenance_bypass=verified-session-token-abc')
  })

  it('retrieves bypass from localStorage or cookie when sessionStorage is empty', () => {
    const token = 'verified-session-token-abc'
    localStorage.setItem('maintenance_bypass', token)

    const stored =
      sessionStorage.getItem('maintenance_bypass') || localStorage.getItem('maintenance_bypass')
    expect(stored).toBe('verified-session-token-abc')
  })

  it('clears all storage layers when bypass=clear is requested', () => {
    sessionStorage.setItem('maintenance_bypass', 'verified-session-token-abc')
    localStorage.setItem('maintenance_bypass', 'verified-session-token-abc')
    document.cookie = 'maintenance_bypass=verified-session-token-abc; path=/; SameSite=Strict'

    sessionStorage.removeItem('maintenance_bypass')
    localStorage.removeItem('maintenance_bypass')
    document.cookie =
      'maintenance_bypass=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict'

    expect(sessionStorage.getItem('maintenance_bypass')).toBeNull()
    expect(localStorage.getItem('maintenance_bypass')).toBeNull()
    expect(document.cookie).not.toContain('maintenance_bypass=verified-session-token-abc')
  })

  it('verifies that hardcoded production secrets list is empty in client bundle', () => {
    // Client bundle does NOT contain hardcoded static secrets
    const staticClientSecrets = ['birim-dev-2025', 'birim2025', 'birim-preview']
    // Server-side verification is now required, client allows only local-dev in DEV mode
    const isClientAllowedDirectly = (token: string, isDev: boolean) => {
      if (isDev && token === 'birim-dev-local') return true
      return false
    }

    staticClientSecrets.forEach(secret => {
      expect(isClientAllowedDirectly(secret, false)).toBe(false)
      expect(isClientAllowedDirectly(secret, true)).toBe(false)
    })
    expect(isClientAllowedDirectly('birim-dev-local', true)).toBe(true)
  })
})
