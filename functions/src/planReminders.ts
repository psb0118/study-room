import { createHash } from 'node:crypto'
import type { Firestore } from 'firebase-admin/firestore'
import {
  addDateKey,
  isPlanReminderDue,
  normalizePlanReminderOffset,
} from './planTime'
import { loadDeviceTokens, sendReminder } from './push'
import { safeTimeZone, zonedClock } from './time'

const DEFAULT_APP_URL = 'https://psb0118.github.io/study-room/'

export interface PlanReminderRunResult {
  users: number
  plans: number
  sent: number
  skipped: number
}

function deliveryKey(
  uid: string,
  planId: string,
  plannedDate: string,
  startTime: string,
  offsetMinutes: number,
): string {
  return createHash('sha256')
    .update(
      [uid, planId, plannedDate, startTime, offsetMinutes].join('|'),
      'utf8',
    )
    .digest('hex')
    .slice(0, 40)
}

function planBody(
  title: string,
  startTime: string,
  offsetMinutes: number,
): string {
  if (offsetMinutes > 0) {
    return `${offsetMinutes}분 뒤 ${startTime} ${title} 계획이 있어요.`
  }
  return `${startTime} ${title} 계획을 시작할 시간이에요.`
}

export async function processPlanReminders(
  db: Firestore,
  now = new Date(),
): Promise<PlanReminderRunResult> {
  const users = await db
    .collection('studyUsers')
    .where('planReminderEnabled', '==', true)
    .get()

  let plans = 0
  let sent = 0
  let skipped = 0
  const appUrl = (process.env.APP_URL || DEFAULT_APP_URL).trim()

  for (const user of users.docs) {
    const profile = user.data()

    // 일정 알림은 학생 본인에게만 보낸다.
    if (profile.role !== 'student') {
      skipped += 1
      continue
    }
    if (profile.accountStatus === 'suspended') {
      skipped += 1
      continue
    }

    const timeZone = safeTimeZone(profile.reminderTimezone)
    const clock = zonedClock(now, timeZone)
    const offsetMinutes = normalizePlanReminderOffset(
      profile.planReminderOffsetMinutes,
    )

    try {
      // 00:xx 계획을 전날 미리 알리는 경우까지 포함하려면 내일 날짜도 필요하다.
      const planSnapshot = await user.ref
        .collection('plans')
        .where('plannedDate', 'in', [
          clock.dateKey,
          addDateKey(clock.dateKey, 1),
        ])
        .get()

      const duePlans = planSnapshot.docs.filter((plan) => {
        const data = plan.data()
        if (data.status === 'completed') return false
        return isPlanReminderDue(
          now,
          timeZone,
          data.plannedDate,
          data.startTime,
          offsetMinutes,
        )
      })

      plans += duePlans.length
      if (duePlans.length === 0) {
        skipped += 1
        continue
      }

      const devices = await loadDeviceTokens(user.ref)
      if (devices.length === 0) {
        skipped += duePlans.length
        continue
      }

      for (const plan of duePlans) {
        const data = plan.data()
        const plannedDate = String(data.plannedDate ?? '')
        const startTime = String(data.startTime ?? '')
        const title = String(data.title ?? '').trim().slice(0, 80) || '공부'
        const key = deliveryKey(
          user.id,
          plan.id,
          plannedDate,
          startTime,
          offsetMinutes,
        )
        const deliveryRef = user.ref
          .collection('planReminderDeliveries')
          .doc(key)

        // 같은 계획·날짜·시간은 한 번만 발송한다.
        const claimed = await db.runTransaction(async (transaction) => {
          const existing = await transaction.get(deliveryRef)
          if (existing.exists) return false
          transaction.set(deliveryRef, {
            planId: plan.id,
            plannedDate,
            startTime,
            timezone: timeZone,
            offsetMinutes,
            status: 'sending',
            createdAt: Date.now(),
          })
          return true
        })
        if (!claimed) {
          skipped += 1
          continue
        }

        try {
          const delivered = await sendReminder(db, user.ref, devices, {
            title: '하루결 공부 알림',
            body: planBody(title, startTime, offsetMinutes),
            url: appUrl,
          })
          await deliveryRef.update({
            status: delivered > 0 ? 'sent' : 'failed',
            sentAt: Date.now(),
            deviceCount: delivered,
          })
          if (delivered > 0) sent += 1
          else skipped += 1
        } catch (error) {
          await deliveryRef
            .update({
              status: 'failed',
              sentAt: Date.now(),
              deviceCount: 0,
              errorCode:
                error instanceof Error ? error.name : 'UnknownError',
            })
            .catch(() => undefined)
          console.error('[plan-reminders] FCM 발송 실패', {
            uid: user.id,
            planId: plan.id,
            error: error instanceof Error ? error.message : String(error),
          })
          skipped += 1
        }
      }
    } catch (error) {
      // 한 사용자의 조회 오류가 나머지 사용자 발송을 막지 않게 한다.
      console.error('[plan-reminders] 사용자 처리 실패', {
        uid: user.id,
        error: error instanceof Error ? error.message : String(error),
      })
      skipped += 1
    }
  }

  console.info('[plan-reminders] 실행 완료', {
    users: users.size,
    plans,
    sent,
    skipped,
  })
  return { users: users.size, plans, sent, skipped }
}
