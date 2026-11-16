import { describe, expect, it } from 'vitest'
import type { User } from 'firebase/auth'
import type { UserProfile } from '../types'
import { defaultProfile } from './profile'
import { filterAdminUsers } from './adminDirectory'

function user(
  uid: string,
  name: string,
  email: string,
  role: UserProfile['role'],
  accountStatus: UserProfile['accountStatus'],
  createdAt: number,
): UserProfile {
  return {
    ...defaultProfile({
      uid,
      email,
      displayName: name,
      photoURL: null,
    } as User),
    uid,
    name,
    nickname: name,
    email,
    role,
    accountStatus,
    createdAt,
  }
}

describe('admin directory', () => {
  const users = [
    user('1', '김하늘', 'sky@example.com', 'student', 'active', 100),
    user('2', '이바다', 'sea@example.com', 'parent', 'suspended', 200),
    user('3', '박별', 'star@example.com', 'student', 'active', 300),
    user('4', '관리자', 'soundpsb1@gmail.com', 'student', 'active', 400),
  ]

  it('filters by status and searches name or email', () => {
    expect(
      filterAdminUsers(users, { status: 'active' }).map((item) => item.nickname),
    ).toEqual(['관리자', '박별', '김하늘'])
    expect(
      filterAdminUsers(users, { query: 'sea@' }).map((item) => item.uid),
    ).toEqual(['2'])
    expect(
      filterAdminUsers(users, { query: '박별' }).map((item) => item.uid),
    ).toEqual(['3'])
  })

  it('sorts by name and puts admins first in role order', () => {
    expect(
      filterAdminUsers(users, { sort: 'name' }).map((item) => item.nickname),
    ).toEqual(['관리자', '김하늘', '박별', '이바다'])
    expect(
      filterAdminUsers(users, { sort: 'role' }).map((item) => item.uid),
    ).toEqual(['4', '1', '3', '2'])
  })

  it('puts suspended accounts last in status order', () => {
    expect(
      filterAdminUsers(users, { sort: 'status' }).map((item) => item.uid),
    ).toEqual(['4', '3', '1', '2'])
  })
})
