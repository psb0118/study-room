import { useEffect, useRef } from 'react'
import { showBrowserNotification } from '../lib/notifications'
import { isPushConfigured } from '../lib/push'
import { todayKey } from '../lib/planner'
import { dateKey } from '../lib/streak'
import type { StudyPlan, UserProfile } from '../types'

const LOCAL_PLAN_NOTICE_WINDOW_MS = 5 * 60_000
const SESSION_PREFIX = 'haru-gyeol-plan-notice:'

function sessionKey(
  plan: StudyPlan,
  offsetMinutes: number,
): string {
  return `${SESSION_PREFIX}${plan.id}:${plan.plannedDate}:${plan.startTime}:${offsetMinutes}`
}

/**
 * FCM을 아직 켜지 않은 사용자를 위한 로컬 일정 알림.
 * 앱이 열려 있는 동안만 동작하며, FCM 기기가 등록되면 서버 알림에 맡긴다.
 */
export function usePlanReminders(
  plans: StudyPlan[],
  profile: UserProfile,
): void {
  const shown = useRef(new Set<string>())

  useEffect(() => {
    if (profile.pushEnabled && isPushConfigured()) return
    if (!profile.planReminderEnabled) return
    if (typeof window === 'undefined' || !('Notification' in window)) return

    const now = new Date()
    const today = todayKey()
    const offset = profile.planReminderOffsetMinutes
    const timers: number[] = []

    for (const plan of plans) {
      if (plan.status === 'completed') continue
      if (!plan.startTime || !/^([01]\d|2[0-3]):[0-5]\d$/.test(plan.startTime)) {
        continue
      }

      const target = new Date(`${plan.plannedDate}T${plan.startTime}:00`)
      if (Number.isNaN(target.valueOf())) continue
      target.setMinutes(target.getMinutes() - offset)
      if (dateKey(target) !== today) continue

      const delay = target.getTime() - now.getTime()
      if (delay < -LOCAL_PLAN_NOTICE_WINDOW_MS) continue
      if (delay > 2_147_000_000) continue

      const key = sessionKey(plan, offset)
      if (shown.current.has(key)) continue
      try {
        if (sessionStorage.getItem(key)) {
          shown.current.add(key)
          continue
        }
      } catch {
        // 저장소를 읽을 수 없으면 현재 세션의 shown만 사용한다.
      }

      const timer = window.setTimeout(() => {
        if (shown.current.has(key)) return
        shown.current.add(key)
        try {
          sessionStorage.setItem(key, '1')
        } catch {
          // 저장소를 쓸 수 없어도 현재 앱 세션에서는 shown으로 중복을 막는다.
        }
        const prefix = offset > 0 ? `${offset}분 뒤 ` : ''
        void showBrowserNotification(
          '하루결 공부 알림',
          `${prefix}${plan.startTime} ${plan.title} 계획이 있어요.`,
        )
      }, Math.max(0, delay))
      timers.push(timer)
    }

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [
    plans,
    profile.planReminderEnabled,
    profile.planReminderOffsetMinutes,
    profile.pushEnabled,
  ])
}
