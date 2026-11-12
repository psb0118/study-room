import { describe, expect, it } from 'vitest'
import { normalizeTimeZone } from './timeZone'

describe('time zone', () => {
  it('keeps valid IANA zones and falls back for invalid values', () => {
    expect(normalizeTimeZone('Asia/Seoul')).toBe('Asia/Seoul')
    expect(normalizeTimeZone('America/New_York')).toBe('America/New_York')
    expect(normalizeTimeZone('not/a-zone')).toBe('Asia/Seoul')
    expect(normalizeTimeZone('')).toBe('Asia/Seoul')
  })
})
