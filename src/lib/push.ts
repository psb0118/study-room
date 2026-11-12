import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging'
import { deleteDoc, doc, setDoc } from 'firebase/firestore'
import { app, fs } from '../firebase'
import { STUDY_USERS } from './stats'

const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY?.trim()
const TOKEN_STORAGE_PREFIX = 'haru-gyeol-device:'

function baseUrl(): URL {
  return new URL('./', document.baseURI)
}

function deviceStorageKey(uid: string): string {
  return `${TOKEN_STORAGE_PREFIX}${uid}`
}

async function registerPushWorker(): Promise<ServiceWorkerRegistration> {
  const base = baseUrl()
  const scope = new URL('push/', base).pathname
  const existing = await navigator.serviceWorker.getRegistration(scope)
  if (existing) return existing
  return navigator.serviceWorker.register(new URL('push-sw.js', base), {
    scope,
  })
}

async function tokenDocumentId(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token),
  )
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export interface PushResult {
  ok: boolean
  error?: string
}

export async function isPushSupported(): Promise<boolean> {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('Notification' in window) ||
    !('PushManager' in window)
  ) {
    return false
  }
  try {
    return await isSupported()
  } catch {
    return false
  }
}

/** 권한을 확인하고 FCM 토큰을 발급해 현재 사용자의 기기 문서에 저장한다. */
export async function registerPushToken(uid: string): Promise<PushResult> {
  if (!uid) return { ok: false, error: '사용자 정보를 찾을 수 없어요.' }
  if (!VAPID_KEY) {
    return {
      ok: false,
      error:
        'FCM VAPID 키가 설정되지 않았어요. VITE_FCM_VAPID_KEY를 설정해 주세요.',
    }
  }
  if (!(await isPushSupported())) {
    return {
      ok: false,
      error: '이 브라우저에서는 백그라운드 알림을 지원하지 않아요.',
    }
  }
  if (Notification.permission !== 'granted') {
    return { ok: false, error: '브라우저 알림 권한이 필요해요.' }
  }

  try {
    const registration = await registerPushWorker()
    const token = await getToken(getMessaging(app), {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })
    if (!token) {
      return {
        ok: false,
        error: '알림 토큰을 발급하지 못했어요. 잠시 후 다시 시도해 주세요.',
      }
    }
    const id = await tokenDocumentId(token)
    const ref = doc(fs, STUDY_USERS, uid, 'devices', id)
    await setDoc(ref, {
      token,
      platform: 'web',
      userAgent: navigator.userAgent.slice(0, 300),
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
    })
    localStorage.setItem(deviceStorageKey(uid), id)
    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error
          ? e.message
          : 'FCM 기기 등록에 실패했어요. 잠시 후 다시 시도해 주세요.',
    }
  }
}

/** 로그아웃·알림 끄기 시 현재 기기 토큰을 정리한다. */
export async function removePushToken(uid: string): Promise<void> {
  let id = localStorage.getItem(deviceStorageKey(uid))
  if (!id && VAPID_KEY && (await isPushSupported())) {
    try {
      const token = await getToken(getMessaging(app), { vapidKey: VAPID_KEY })
      if (token) id = await tokenDocumentId(token)
    } catch {
      // 권한이 없거나 이미 해제된 기기는 아래에서 로컬 기록만 정리한다.
    }
  }
  if (!id) return
  try {
    await deleteDoc(doc(fs, STUDY_USERS, uid, 'devices', id))
  } catch {
    // 이미 삭제됐거나 권한이 없어도 로그아웃은 계속한다.
  } finally {
    localStorage.removeItem(deviceStorageKey(uid))
  }
}

/** 앱을 열어둔 동안 도착한 FCM 메시지를 브라우저 알림으로 보여준다. */
export async function listenForegroundPush(
  onPayload: (title: string, body: string) => void,
): Promise<(() => void) | undefined> {
  if (!(await isPushSupported())) return undefined
  try {
    return onMessage(getMessaging(app), (payload) => {
      onPayload(
        payload.notification?.title ?? '하루결 공부 알림',
        payload.notification?.body ??
          '오늘의 공부 계획을 확인해 보세요.',
      )
    })
  } catch {
    return undefined
  }
}
