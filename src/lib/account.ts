import type { User } from 'firebase/auth'
import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from 'firebase/auth'
import {
  collection,
  doc,
  getDocs,
  writeBatch,
  type DocumentReference,
} from 'firebase/firestore'
import { auth, fs, googleProvider } from '../firebase'
import { firestoreMessage } from './errors'
import { STUDY_USERS } from './stats'
import { weekKeysSince } from './weeklyKeys'
import type { UserProfile } from '../types'

const BATCH_SIZE = 450

export function passwordReauthAvailable(user: User): boolean {
  return user.providerData.some((provider) => provider.providerId === 'password')
}

export function googleReauthAvailable(user: User): boolean {
  return user.providerData.some((provider) => provider.providerId === 'google.com')
}

async function deleteRefsInBatches(refs: DocumentReference[]): Promise<void> {
  for (let start = 0; start < refs.length; start += BATCH_SIZE) {
    const batch = writeBatch(fs)
    for (const ref of refs.slice(start, start + BATCH_SIZE)) {
      batch.delete(ref)
    }
    await batch.commit()
  }
}

async function deleteAccountData(
  uid: string,
  profile: UserProfile,
): Promise<void> {
  const refs: DocumentReference[] = []
  const childUids = Array.from(
    new Set(
      profile.childUids.length > 0
        ? profile.childUids
        : profile.childUid
          ? [profile.childUid]
          : [],
    ),
  )

  if (profile.role === 'student') {
    if (profile.familyCode) {
      refs.push(doc(fs, 'familyCodes', profile.familyCode))
    }
    const parents = await getDocs(collection(fs, 'families', uid, 'parents'))
    refs.push(...parents.docs.map((parent) => parent.ref))
  } else {
    for (const childUid of childUids) {
      refs.push(doc(fs, 'families', childUid, 'parents', uid))
    }
  }

  refs.push(doc(fs, 'leaderboard', uid))
  for (const weekKey of weekKeysSince(profile.createdAt)) {
    refs.push(doc(fs, 'weeklyLeaderboards', weekKey, 'entries', uid))
  }

  for (const subcollection of ['subjects', 'plans', 'records']) {
    const snap = await getDocs(collection(fs, STUDY_USERS, uid, subcollection))
    refs.push(...snap.docs.map((item) => item.ref))
  }
  refs.push(doc(fs, STUDY_USERS, uid))

  await deleteRefsInBatches(refs)
}

/**
 * 최근 로그인 확인 후 Firestore 데이터와 Firebase Auth 계정을 삭제한다.
 * 부모 계정 삭제 시 자녀의 학습 데이터는 건드리지 않는다.
 */
export async function deleteAccount(
  user: User,
  profile: UserProfile,
  password: string,
): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('오프라인에서는 계정을 삭제할 수 없어요. 연결 후 다시 시도해 주세요.')
  }

  const current = auth.currentUser ?? user
  if (passwordReauthAvailable(current)) {
    if (!current.email) {
      throw new Error('이메일 계정 정보를 확인할 수 없어요.')
    }
    if (!password) {
      throw new Error('계정 삭제를 위해 비밀번호를 입력해 주세요.')
    }
    await reauthenticateWithCredential(
      current,
      EmailAuthProvider.credential(current.email, password),
    )
  } else if (googleReauthAvailable(current)) {
    await reauthenticateWithPopup(current, googleProvider)
  } else {
    throw new Error(
      '지원하지 않는 로그인 방식이에요. 로그아웃 후 다시 로그인한 뒤 시도해 주세요.',
    )
  }

  try {
    await deleteAccountData(current.uid, profile)
  } catch (e) {
    throw new Error(firestoreMessage(e))
  }
  await deleteUser(current)
}
