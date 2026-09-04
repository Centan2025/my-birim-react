import {describe, it, expect, beforeEach} from 'vitest'

describe('Maintenance Mode Bypass Logic', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
    document.cookie = 'maintenance_bypass=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
  })

  it('persists bypass token to storage and cookie on initial access', () => {
    const token = 'birim-dev-2025'
    sessionStorage.setItem('maintenance_bypass', token)
    localStorage.setItem('maintenance_bypass', token)
    document.cookie = `maintenance_bypass=${encodeURIComponent(token)}; path=/`

    expect(sessionStorage.getItem('maintenance_bypass')).toBe('birim-dev-2025')
    expect(localStorage.getItem('maintenance_bypass')).toBe('birim-dev-2025')
    expect(document.cookie).toContain('maintenance_bypass=birim-dev-2025')
  })

  it('retrieves bypass from localStorage or cookie when sessionStorage is empty', () => {
    const token = 'birim-dev-2025'
    localStorage.setItem('maintenance_bypass', token)

    const stored =
      sessionStorage.getItem('maintenance_bypass') || localStorage.getItem('maintenance_bypass')
    expect(stored).toBe('birim-dev-2025')
  })

  it('clears all storage layers when bypass=clear is requested', () => {
    sessionStorage.setItem('maintenance_bypass', 'birim-dev-2025')
    localStorage.setItem('maintenance_bypass', 'birim-dev-2025')
    document.cookie = 'maintenance_bypass=birim-dev-2025; path=/'

    sessionStorage.removeItem('maintenance_bypass')
    localStorage.removeItem('maintenance_bypass')
    document.cookie = 'maintenance_bypass=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'

    expect(sessionStorage.getItem('maintenance_bypass')).toBeNull()
    expect(localStorage.getItem('maintenance_bypass')).toBeNull()
    expect(document.cookie).not.toContain('maintenance_bypass=birim-dev-2025')
  })
})
