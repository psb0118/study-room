import { describe, expect, it } from 'vitest'
import {
  ACCOUNT_STATUS_LABEL,
  normalizeAccountStatus,
} from './accountStatus'

describe('account status', () => {
  it('keeps suspended status and defaults everything else to active', () => {
    expect(normalizeAccountStatus('suspended')).toBe('suspended')
    expect(normalizeAccountStatus('active')).toBe('active')
    expect(normalizeAccountStatus(undefined)).toBe('active')
    expect(normalizeAccountStatus('unknown')).toBe('active')
  })

  it('has labels for the admin UI', () => {
    expect(ACCOUNT_STATUS_LABEL.active).toBe('이용 중')
    expect(ACCOUNT_STATUS_LABEL.suspended).toBe('이용 정지')
  })
})
