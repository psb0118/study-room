import type { User } from 'firebase/auth'
import { doc, runTransaction } from 'firebase/firestore'
import { fs } from '../firebase'
import { ROOM_SUBJECT_ID } from './planner'
import { dateKey } from './streak'

export const STUDY_USERS = 'studyUsers'

export function userDocRef(uid: string) {
  return doc(fs, STUDY_USERS, uid)
}

/** 프로필 기본 정보 병합 저장 (로그인 직후 1회) */
export async function ensureUserProfile(user: User): Promise<void> {
  try {
    await runTransaction(fs, async (tx) => {
      const ref = userDocRef(user.uid)
      const snap = await tx.get(ref)
      if (!snap.exists()) {
        tx.set(ref, {
          uid: user.uid,
          name: user.displayName ?? '익명',
          photo: user.photoURL ?? '',
          createdAt: Date.now(),
        })
        return
      }
      tx.update(ref, {
        name: user.displayName ?? '익명',
        photo: user.photoURL ?? '',
      })
    })
  } catch (e) {
    console.warn('[profile] 프로필 저장 실패:', e)
  }
}

/**
 * 스터디 룸에서 집중한 시간을 하루 단위 기록으로 누적한다.
 * 같은 분 안에는 한 번만 반영되어 여러 탭의 중복 집계를 막는다.
 */
export async function recordRoomFocus(uid: string, ms: number): Promise<void> {
  if (ms < 1000) return
  const now = new Date()
  const key = dateKey(now)
  const minuteKey = Math.floor(now.getTime() / 60_000)
  const ref = doc(fs, STUDY_USERS, uid, 'records', `room-${key}`)

  await runTransaction(fs, async (tx) => {
    const snap = await tx.get(ref)
    const data = (snap.exists() ? snap.data() : {}) as Record<string, unknown>
    if (data.lastMinuteKey === minuteKey) return

    const prev = Math.max(0, Number(data.durationMs) || 0)
    const startedAt = Number(data.startedAt) || now.getTime() - ms
    tx.set(ref, {
      subjectId: ROOM_SUBJECT_ID,
      planId: '',
      dateKey: key,
      source: 'room',
      startedAt,
      endedAt: now.getTime(),
      durationMs: prev + ms,
      memo: '',
      createdAt: Number(data.createdAt) || now.getTime(),
      lastMinuteKey: minuteKey,
    })
  })
}
