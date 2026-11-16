import type { AccountStatus, UserProfile } from '../types'
import { isAdminEmail } from './admin'

export type AdminSort = 'recent' | 'name' | 'role' | 'status'
export type AdminStatusFilter = 'all' | AccountStatus

const ROLE_ORDER: Record<string, number> = {
  admin: 0,
  student: 1,
  parent: 2,
}

function roleOf(user: UserProfile): string {
  return isAdminEmail(user.email) ? 'admin' : user.role
}

function nameOf(user: UserProfile): string {
  return (user.nickname || user.name || '').trim()
}

/** 관리자 사용자 목록의 상태 필터, 검색, 정렬을 한 곳에서 처리한다. */
export function filterAdminUsers(
  users: UserProfile[],
  options: {
    query?: string
    status?: AdminStatusFilter
    sort?: AdminSort
  } = {},
): UserProfile[] {
  const query = (options.query ?? '').trim().toLowerCase()
  const status = options.status ?? 'all'
  const sort = options.sort ?? 'recent'

  return users
    .filter((user) => status === 'all' || user.accountStatus === status)
    .filter((user) => {
      if (!query) return true
      return [user.nickname, user.name, user.email]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
    .sort((a, b) => {
      if (sort === 'name') {
        return nameOf(a).localeCompare(nameOf(b), 'ko')
      }
      if (sort === 'role') {
        return (
          (ROLE_ORDER[roleOf(a)] ?? 9) - (ROLE_ORDER[roleOf(b)] ?? 9) ||
          nameOf(a).localeCompare(nameOf(b), 'ko')
        )
      }
      if (sort === 'status') {
        return (
          Number(a.accountStatus === 'suspended') -
            Number(b.accountStatus === 'suspended') ||
          b.createdAt - a.createdAt
        )
      }
      return b.createdAt - a.createdAt
    })
}
