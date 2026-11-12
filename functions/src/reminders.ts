import type { Firestore } from 'firebase-admin/firestore'
import { loadDeviceTokens, sendReminder } from './push'
import { isReminderWindow, safeTimeZone } from './time'

const DEFAULT_APP_URL = 'https://psb0118.github.io/study-room/'

export interface ReminderRunResult {
  scanned: number
  sent: number
  skipped: number
}

export async function processStudyReminders(
  db: Firestore,
  now = new Date(),
): Promise<ReminderRunResult> {
  const users = await db
    .collection('studyUsers')
    .where('reminderEnabled', '==', true)
    .get()

  let sent = 0
  let skipped = 0
  const appUrl = (process.env.APP_URL || DEFAULT_APP_URL).trim()

  for (const user of users.docs) {
    const profile = user.data()

    // 학생만, 정지되지 않은 계정만 알림을 받는다.
    if (profile.role !== 'student') {
      skipped += 1
      continue
    }
    if (profile.accountStatus === 'suspended') {
      skipped += 1
      continue
    }

    const timeZone = safeTimeZone(profile.reminderTimezone)
    const window = isReminderWindow(now, profile.reminderTime, timeZone)
    if (!window.due) {
      skipped += 1
      continue
    }

    const devices = await loadDeviceTokens(user.ref)
    if (devices.length === 0) {
      skipped += 1
      continue
    }

    // 발송 전에 로컬 날짜를 선점해 동시 실행/재시도 시 중복 발송을 막는다.
    const claimed = await db.runTransaction(async (transaction) => {
      const fresh = await transaction.get(user.ref)
      if (fresh.get('lastReminderKey') === window.dateKey) return false
      transaction.update(user.ref, {
        lastReminderKey: window.dateKey,
        lastReminderAt: Date.now(),
      })
      return true
    })
    if (!claimed) {
      skipped += 1
      continue
    }

    try {
      sent += await sendReminder(db, user.ref, devices, {
        title: '하루결 공부 알림',
        body: '오늘의 공부 계획을 확인해 보세요.',
        url: appUrl,
      })
    } catch (error) {
      // 한 사용자의 FCM 오류가 나머지 사용자 발송을 막지 않게 한다.
      console.error('[reminders] FCM 발송 실패', {
        uid: user.id,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  console.info('[reminders] 실행 완료', {
    scanned: users.size,
    sent,
    skipped,
  })
  return { scanned: users.size, sent, skipped }
}
