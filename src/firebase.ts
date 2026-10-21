/* =========================================================
   Firebase 웹 앱 설정 (클라이언트용 — 비밀값 아님)

   기본값은 기존 Firebase 프로젝트(wordgame-8e201)를 공용합니다.
   별도 프로젝트를 쓰려면 환경변수 .env 를 만들어 아래 키로
   덮어쓰면 됩니다. (VITE_FIREBASE_*)

   ※ 실제 보안은 Firestore/Realtime Database 보안 규칙이 담당합니다.
     규칙 파일: firebase/firestore.rules, firebase/database.rules.json
========================================================= */
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBu3jsJixIqsM3rSx4nvwpMcY5qVulAGNM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'wordgame-8e201.firebaseapp.com',
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ||
    'https://wordgame-8e201-default-rtdb.firebaseio.com',
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
