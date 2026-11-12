import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { processStudyReminders } from './reminders'

initializeApp()

export const sendStudyReminders = onSchedule(
  {
    schedule: 'every 5 minutes',
    timeZone: 'Asia/Seoul',
    region: 'asia-northeast3',
    timeoutSeconds: 540,
    memory: '256MiB',
    retryCount: 0,
    maxInstances: 1,
  },
  async () => {
    await processStudyReminders(getFirestore())
  },
)
