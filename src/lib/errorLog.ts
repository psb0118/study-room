import { addDoc, collection } from 'firebase/firestore'
import { auth, fs } from '../firebase'

const MAX_REPORTS_PER_SESSION = 20
let reports = 0

function errorText(error: unknown): { message: string; stack: string } {
  if (error instanceof Error) {
    return {
      message: error.message || error.name,
      stack: error.stack ?? '',
    }
  }
  if (typeof error === 'string') return { message: error, stack: '' }
  try {
    return { message: JSON.stringify(error), stack: '' }
  } catch {
    return { message: '알 수 없는 오류', stack: '' }
  }
}

/** 로그인한 사용자의 클라이언트 오류를 관리자 전용 로그로 보낸다. */
export function logAppError(error: unknown, context = 'app'): void {
  if (reports >= MAX_REPORTS_PER_SESSION) return
  if (!auth.currentUser) return
  reports += 1
  const { message, stack } = errorText(error)
  void addDoc(collection(fs, 'appErrors'), {
    message: message.slice(0, 1000),
    stack: stack.slice(0, 8000),
    context: context.slice(0, 100),
    url:
      typeof window !== 'undefined'
        ? window.location.href.slice(0, 500)
        : '',
    userAgent:
      typeof navigator !== 'undefined'
        ? navigator.userAgent.slice(0, 300)
        : '',
    uid: auth.currentUser.uid,
    createdAt: Date.now(),
  }).catch(() => {
    // 로그 전송 실패가 원래 오류를 덮지 않게 한다.
  })
}
