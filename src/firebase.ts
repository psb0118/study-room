/* =========================================================
   Firebase 웹 앱 설정 (클라이언트용 — 비밀값 아님)

   기본값은 기존 Firebase 프로젝트(wordgame-8e201)를 공용합니다.
   별도 프로젝트를 쓰려면 환경변수 .env (또는 GitHub Actions 변수
   VITE_FIREBASE_*) 로 아래 키를 덮어쓰면 됩니다.

   ※ databaseURL 은 반드시 DB의 "루트 URL"이어야 합니다.
     (콘솔 주소창 URL 은 사용 불가 → 차단되어 기본값으로 대체)
   ※ 실제 보안은 Firestore/Realtime Database 보안 규칙이 담당합니다.
     규칙 파일: firebase/firestore.rules, firebase/database.rules.json
========================================================= */
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getFirestore } from 'firebase/firestore'

const FALLBACK_DATABASE_URL = 'https://wordgame-8e201-default-rtdb.firebaseio.com'

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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBu3jsJixIqsM3rSx4nvwpMcY5qVulAGNM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'wordgame-8e201.firebaseapp.com',
  databaseURL: normalizeDatabaseUrl(
    import.meta.env.VITE_FIREBASE_DATABASE_URL,
    FALLBACK_DATABASE_URL,
  ),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'wordgame-8e201',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'wordgame-8e201.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '603397246848',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:603397246848:web:d0c356501e15ece7053b65',
}

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getDatabase(app)
export const fs = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
