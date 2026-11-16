import { useEffect } from 'react'
import type { UserProfile } from '../types'
import { showBrowserNotification } from '../lib/notifications'
import { isPushConfigured } from '../lib/push'
import { todayKey } from '../lib/planner'
import { nextReminderAt } from '../lib/reminders'

const DAILY_NOTICE_PREFIX = 'haru-gyeol-daily-notice:'

/**
 * FCM 기기를 등록하지 않은 사용자를 위한 로컬 알림 fallback.
 * 앱이 열려 있는 동안 하루 한 번 브라우저 알림을 띄운다.
 */
export function useStudyReminder(profile: UserProfile) {
  useEffect(() => {
    // FCM 기기가 등록된 사용자는 서버 알림을 사용한다. VAPID 키가 없는
    // 빌드에서는 기기 등록이 남아 있어도 로컬 알림으로 동작한다.
    if (profile.pushEnabled && isPushConfigured()) return
    if (!profile.reminderEnabled || !profile.reminderTime) return
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    let timer: number | undefined
    const schedule = () => {
      const next = nextReminderAt(new Date(), profile.reminderTime)
      if (!next) return
      const delay = Math.max(0, next.getTime() - Date.now())
      timer = window.setTimeout(() => {
        if (Notification.permission !== 'granted') return
        const key = `${DAILY_NOTICE_PREFIX}${profile.uid}:${todayKey()}`
        try {
          if (localStorage.getItem(key)) {
            schedule()
            return
          }
          localStorage.setItem(key, '1')
        } catch {
          // 저장소를 쓸 수 없으면 현재 탭에서만 중복을 막는다.
        }
        void showBrowserNotification(
          '하루결 공부 알림',
          '오늘의 공부 계획을 확인하고 한 걸음 시작해 보세요.',
        )
        schedule()
      }, Math.min(delay, 2_147_000_000))
    }

    schedule()
    return () => {
      if (timer) window.clearTimeout(timer)
    }
  }, [
    profile.uid,
    profile.pushEnabled,
    profile.reminderEnabled,
    profile.reminderTime,
  ])
}
