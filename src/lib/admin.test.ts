import { describe, expect, it } from 'vitest'
import { ADMIN_EMAIL, isAdminEmail } from './admin'

describe('admin email', () => {
  it('matches the configured administrator address', () => {
    expect(isAdminEmail(ADMIN_EMAIL)).toBe(true)
    expect(isAdminEmail(` ${ADMIN_EMAIL.toUpperCase()} `)).toBe(true)
  })

  it('rejects other and missing addresses', () => {
    expect(isAdminEmail('student@example.com')).toBe(false)
    expect(isAdminEmail('')).toBe(false)
    expect(isAdminEmail(null)).toBe(false)
  })
})
