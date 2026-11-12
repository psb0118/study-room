/* =========================================================
   Firebase 웹 앱 설정 (클라이언트용 — 비밀값 아님)

   대상 프로젝트: study-room-d0c89
   다른 프로젝트/값을 쓰려면 환경변수 .env (또는 GitHub Actions 변수
   VITE_FIREBASE_*) 로 아래 키를 덮어쓰면 됩니다.

   ※ databaseURL 은 반드시 DB의 "루트 URL"이어야 합니다.
     (콘솔 주소창 URL 은 사용 불가 → 차단되어 기본값으로 대체)
   ※ 실제 보안은 Firestore/Realtime Database 보안 규칙이 담당합니다.
     규칙 파일: firebase/firestore.rules, firebase/database.rules.json
========================================================= */
import { initializeApp } from 'firebase/app'
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
} from 'firebase/app-check'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const FALLBACK_DATABASE_URL = 'https://study-room-d0c89-default-rtdb.asia-southeast1.firebasedatabase.app'

/** DB 루트 URL 형태가 아니면(콘솔 URL, 자식 경로 포함 등) 사용하지 않는다. */
function normalizeDatabaseUrl(raw: string | undefined, fallback: string): string {
  const value = raw?.trim().replace(/\/+$/, '')
  if (!value) return fallback
  if (/^https:\/\/[a-z0-9.-]+\.(firebasedatabase\.app|firebaseio\.com)$/i.test(value)) return value
  console.warn(
    '[firebase] databaseURL 형식이 올바르지 않아 기본값으로 대체합니다. (DB 루트 URL: https://<프로젝트>-default-rtdb.<지역>.firebasedatabase.app)',
    value,
  )
  return fallback
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD0ejZvI_HGfOfpBklb8RuxELxmFROoTko',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'study-room-d0c89.firebaseapp.com',
  databaseURL: normalizeDatabaseUrl(
    import.meta.env.VITE_FIREBASE_DATABASE_URL,
    FALLBACK_DATABASE_URL,
  ),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'study-room-d0c89',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'study-room-d0c89.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '916640443953',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:916640443953:web:d9e7a9edd515783a232f10',
}

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

export const app = initializeApp(firebaseConfig)

// App Check는 사이트 키가 설정된 경우에만 활성화한다. 콘솔에서
// Firestore/Storage/RTDB의 App Check 적용(Enforcement)을 켜기 전에
// 먼저 토큰이 정상 발급되는지 확인해야 한다.
const appCheckSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim()
if (appCheckSiteKey) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    })
  } catch (e) {
    console.warn('[firebase] App Check를 초기화하지 못했습니다.', e)
  }
}

export const auth = getAuth(app)
export const db = getDatabase(app)

/** 오프라인에서도 마지막으로 불러온 플래너 데이터를 읽고, 변경을 대기열에 저장한다. */
function createFirestore() {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  } catch (e) {
    console.warn(
      '[firebase] 오프라인 캐시를 초기화하지 못해 기본 Firestore를 사용합니다.',
      e,
    )
    return getFirestore(app)
  }
}

export const fs = createFirestore()
export const googleProvider = new GoogleAuthProvider()
