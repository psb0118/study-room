import type { User } from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore'
import { fs } from '../firebase'
import { normalizeAccountStatus, normalizeStatusReason } from './accountStatus'
import type { ProfileRole, UserProfile } from '../types'
import { SUBJECT_COLORS } from './planner'
import { STUDY_USERS } from './stats'

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const DEFAULT_SUBJECTS = [
  { name: '국어', color: SUBJECT_COLORS[0] },
  { name: '수학', color: SUBJECT_COLORS[1] },
  { name: '영어', color: SUBJECT_COLORS[2] },
] as const

export function defaultProfile(user: User): UserProfile {
  const now = Date.now()
  const name =
    user.displayName?.trim() || user.email?.split('@')[0] || '학생'
  return {
    uid: user.uid,
    name,
    nickname: name,
    email: user.email ?? '',
    photo: user.photoURL ?? '',
    role: '',
    familyCode: '',
    childUid: '',
    childUids: [],
    childNames: {},
    accountStatus: 'active',
    statusReason: '',
    statusUpdatedAt: 0,
    statusUpdatedBy: '',
    createdAt: now,
    updatedAt: now,
  }
}

export function normalizeProfile(
  uid: string,
  data: Record<string, unknown>,
): UserProfile {
  const role: ProfileRole =
    data.role === 'student' || data.role === 'parent' ? data.role : ''
  const name = String(data.name ?? (role === 'parent' ? '보호자' : '학생'))
  const childUid = String(data.childUid ?? '')
  const rawChildUids = Array.isArray(data.childUids) ? data.childUids : []
  const childUids = Array.from(
    new Set([
      ...rawChildUids.map((value) => String(value)),
      ...(childUid ? [childUid] : []),
    ]),
  )
  const rawChildNames =
    data.childNames && typeof data.childNames === 'object'
      ? (data.childNames as Record<string, unknown>)
      : {}
  const childNames = Object.fromEntries(
    Object.entries(rawChildNames).map(([key, value]) => [key, String(value)]),
  )
  return {
    uid,
    name,
    nickname: String(data.nickname ?? '').trim() || name,
    email: String(data.email ?? ''),
    photo: String(data.photo ?? ''),
    role,
    familyCode: String(data.familyCode ?? ''),
    childUid,
    childUids,
    childNames,
    accountStatus: normalizeAccountStatus(data.accountStatus),
    statusReason: normalizeStatusReason(data.statusReason),
    statusUpdatedAt: Number(data.statusUpdatedAt) || 0,
    statusUpdatedBy: String(data.statusUpdatedBy ?? ''),
    createdAt: Number(data.createdAt) || 0,
    updatedAt: Number(data.updatedAt) || 0,
  }
}

export function randomFamilyCode(): string {
  const bytes = new Uint8Array(6)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(
    bytes,
    (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length],
  ).join('')
}

/** 겹치지 않는 6자리 가족 연결 코드를 만들고 familyCodes 문서에 등록한다. */
export async function createUniqueFamilyCode(uid: string): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = randomFamilyCode()
    const ref = doc(fs, 'familyCodes', code)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        code,
        studentUid: uid,
        createdAt: Date.now(),
      })
      return code
    }
  }
  throw new Error('연결 코드를 만들지 못했어요. 다시 시도해 주세요.')
}

/** 학생 계정에 기본 과목이 하나도 없을 때 중학생 기본 과목을 만들어 준다. */
export async function seedDefaultSubjects(uid: string): Promise<void> {
  const subjectsCol = collection(fs, STUDY_USERS, uid, 'subjects')
  const snap = await getDocs(subjectsCol)
  if (!snap.empty) return

  const now = Date.now()
  for (const subject of DEFAULT_SUBJECTS) {
    await setDoc(doc(subjectsCol), {
      name: subject.name,
      color: subject.color,
      archived: false,
      createdAt: now,
      updatedAt: now,
    })
  }
}
