import { describe, expect, it } from 'vitest'
import {
  ACCOUNT_STATUS_LABEL,
  MAX_STATUS_REASON_LENGTH,
  normalizeAccountStatus,
  normalizeStatusReason,
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

  it('trims and limits the suspension reason', () => {
    expect(normalizeStatusReason('  장기 미접속  ')).toBe('장기 미접속')
    expect(normalizeStatusReason(undefined)).toBe('')
    expect(normalizeStatusReason('가'.repeat(250))).toHaveLength(
      MAX_STATUS_REASON_LENGTH,
    )
  })
})
