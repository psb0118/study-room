import { useEffect } from 'react'
import type { UserProfile } from '../types'
import { nextReminderAt } from '../lib/reminders'

/**
 * 브라우저 알림을 사용해 앱이 열려 있는 동안 하루 한 번 알림을 띄운다.
 * 앱을 닫은 뒤의 백그라운드 푸시는 서버가 필요하므로 지원하지 않는다.
 */
export function useStudyReminder(profile: UserProfile) {
  useEffect(() => {
    if (!profile.reminderEnabled || !profile.reminderTime) return
    if (typeof window === 'undefined' || !('Notification' in window)) return

    let timer: number | undefined
    const schedule = () => {
      const next = nextReminderAt(new Date(), profile.reminderTime)
      if (!next) return
      const delay = Math.max(0, next.getTime() - Date.now())
      timer = window.setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('하루결 공부 알림', {
            body: '오늘의 공부 계획을 확인하고 한 걸음 시작해 보세요.',
          })
        }
        schedule()
      }, Math.min(delay, 2_147_000_000))
    }

    schedule()
    return () => {
      if (timer) window.clearTimeout(timer)
    }
  }, [profile.reminderEnabled, profile.reminderTime])
}
