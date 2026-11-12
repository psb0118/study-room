import type { AccountStatus } from '../types'

export const ACCOUNT_STATUS_LABEL: Record<AccountStatus, string> = {
  active: '이용 중',
  suspended: '이용 정지',
}

/** 알 수 없는 값은 기존 계정과의 호환을 위해 이용 중으로 처리한다. */
export function normalizeAccountStatus(value: unknown): AccountStatus {
  return value === 'suspended' ? 'suspended' : 'active'
}
