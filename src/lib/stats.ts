import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { fs } from '../firebase'
import { dateKey, updateStreak } from './streak'

export const STUDY_USERS = 'studyUsers'

export function userDocRef(uid: string) {
  return doc(fs, STUDY_USERS, uid)
}

/** 프로필 기본 정보 병합 저장 (로그인 직후 1회) */
export async function ensureUserProfile(user: User): Promise<void> {
  await runTransaction(fs, async (tx) => {
    const ref = userDocRef(user.uid)
    const snap = await tx.get(ref)
    if (!snap.exists()) {
      tx.set(ref, {
        uid: user.uid,
        name: user.displayName ?? '익명',
        photo: user.photoURL ?? '',
        totalFocusMs: 0,
        streak: 0,
        longest: 0,
        lastStudyDate: null,
        days: {},
        lastMinuteKey: -1,
        createdAt: serverTimestamp(),
      })
      return
    }
    tx.update(ref, {
      name: user.displayName ?? '익명',
      photo: user.photoURL ?? '',
    })
  })
}

/**
 * 집중 시간을 기록한다. 같은 분 안에는 한 번만 반영되어
 * (여러 탭 동시 실행 시) 중복 집계를 방지한다.
 */
export async function recordFocus(uid: string, name: string, ms: number): Promise<void> {
  if (ms <= 0) return
  const now = new Date()
  const minuteKey = Math.floor(now.getTime() / 60_000)
  const today = dateKey(now)
  await runTransaction(fs, async (tx) => {
    const ref = userDocRef(uid)
    const snap = await tx.get(ref)
    const d = (snap.exists() ? snap.data() : {}) as Record<string, unknown>
    if (d.lastMinuteKey === minuteKey) return
    const days = { ...((d.days as Record<string, number>) ?? {}) }
    days[today] = (days[today] ?? 0) + ms
    const streak = updateStreak(
      {
        streak: (d.streak as number) ?? 0,
        longest: (d.longest as number) ?? 0,
        lastStudyDate: (d.lastStudyDate as string) ?? null,
      },
      today,
    )
    tx.set(
      ref,
      {
        uid,
        name,
        totalFocusMs: ((d.totalFocusMs as number) ?? 0) + ms,
        streak: streak.streak,
        longest: streak.longest,
        lastStudyDate: streak.lastStudyDate,
        days,
        lastMinuteKey: minuteKey,
        updatedAt: now.toISOString(),
      },
      { merge: true },
    )
  })
}
