import { useEffect } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { fs } from '../firebase'
import { completedPoints, levelInfo } from '../lib/points'
import type { StudyPlan, UserProfile } from '../types'

export function usePointsSync(
  uid: string,
  profile: UserProfile | null,
  plans: StudyPlan[],
  ready: boolean,
) {
  const info = levelInfo(completedPoints(plans))
  const profileName = profile?.name ?? ''
  const profilePhoto = profile?.photo ?? ''
  const profileUid = profile?.uid ?? ''
  const profileRole = profile?.role ?? ''

  useEffect(() => {
    if (!uid || !ready || !profileName) return
    if (profileUid !== uid || profileRole !== 'student') return
    void setDoc(
      doc(fs, 'leaderboard', uid),
      {
        uid,
        name: profileName,
        photo: profilePhoto,
        points: info.points,
        level: info.level,
        updatedAt: Date.now(),
      },
      { merge: true },
    ).catch((e) => {
      console.warn('[points] 포인트 순위 동기화 실패:', e)
    })
  }, [
    uid,
    ready,
    profileName,
    profilePhoto,
    profileUid,
    profileRole,
    info.points,
    info.level,
  ])

  return info
}
