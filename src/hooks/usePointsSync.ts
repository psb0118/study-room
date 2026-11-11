import { useEffect } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { fs } from '../firebase'
import { completedPoints, completedPointsSince, levelInfo } from '../lib/points'
import { startOfWeek } from '../lib/planner'
import type { StudyPlan, UserProfile } from '../types'

export function usePointsSync(
  uid: string,
  profile: UserProfile | null,
  plans: StudyPlan[],
  ready: boolean,
) {
  const info = levelInfo(completedPoints(plans))
  const weekKey = startOfWeek()
  const weekStart = new Date(`${weekKey}T00:00:00`).getTime()
  const weeklyInfo = levelInfo(completedPointsSince(plans, weekStart))
  const profileName = profile?.name ?? ''
  const profileNickname = profile?.nickname?.trim() || profileName
  const profilePhoto = profile?.photo ?? ''
  const profileUid = profile?.uid ?? ''
  const profileRole = profile?.role ?? ''

  useEffect(() => {
    if (!uid || !ready || !profileName) return
    if (profileUid !== uid || profileRole !== 'student') return
    const common = {
      uid,
      name: profileNickname,
      photo: profilePhoto,
      updatedAt: Date.now(),
    }
    void Promise.all([
      setDoc(
        doc(fs, 'leaderboard', uid),
        { ...common, points: info.points, level: info.level },
        { merge: true },
      ),
      setDoc(
        doc(fs, 'weeklyLeaderboards', weekKey, 'entries', uid),
        { ...common, points: weeklyInfo.points, level: weeklyInfo.level },
        { merge: true },
      ),
    ]).catch((e) => {
      console.warn('[points] 포인트 순위 동기화 실패:', e)
    })
  }, [
    uid,
    ready,
    profileName,
    profileNickname,
    profilePhoto,
    profileUid,
    profileRole,
    info.points,
    info.level,
    weekKey,
    weeklyInfo.points,
    weeklyInfo.level,
  ])

  return info
}
