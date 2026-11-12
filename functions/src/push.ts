import type {
  DocumentReference,
  Firestore,
} from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

const INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
])

const FCM_BATCH_SIZE = 500

export interface DeviceToken {
  id: string
  token: string
}

export async function loadDeviceTokens(
  userRef: DocumentReference,
): Promise<DeviceToken[]> {
  const devices = await userRef.collection('devices').get()
  const seen = new Set<string>()
  const tokens: DeviceToken[] = []
  for (const item of devices.docs) {
    const token = String(item.data().token ?? '').trim()
    if (!token || seen.has(token)) continue
    seen.add(token)
    tokens.push({ id: item.id, token })
  }
  return tokens
}

export async function removeDeviceDocuments(
  db: Firestore,
  userRef: DocumentReference,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return
  const batch = db.batch()
  for (const id of ids) {
    batch.delete(userRef.collection('devices').doc(id))
  }
  await batch.commit()
}

export interface ReminderPayload {
  title: string
  body: string
  url: string
}

/** FCM 멀티캐스트를 500개 단위로 나눠 보내고, 만료된 기기 문서를 정리한다. */
export async function sendReminder(
  db: Firestore,
  userRef: DocumentReference,
  devices: DeviceToken[],
  payload: ReminderPayload,
): Promise<number> {
  let sent = 0
  const invalidIds: string[] = []

  for (let start = 0; start < devices.length; start += FCM_BATCH_SIZE) {
    const batch = devices.slice(start, start + FCM_BATCH_SIZE)
    const response = await getMessaging().sendEachForMulticast({
      tokens: batch.map((device) => device.token),
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        url: payload.url,
      },
      webpush: {
        fcmOptions: {
          link: payload.url,
        },
      },
    })

    response.responses.forEach((result, index) => {
      if (result.success) {
        sent += 1
        return
      }
      const code = result.error?.code ?? ''
      if (INVALID_TOKEN_CODES.has(code)) {
        invalidIds.push(batch[index].id)
      }
    })
  }

  await removeDeviceDocuments(db, userRef, invalidIds)
  return sent
}
