function codeOf(error: unknown): string {
  if (typeof error !== 'object' || error === null || !('code' in error)) return ''
  return String((error as { code: unknown }).code)
}

export function firestoreMessage(error: unknown): string {
  const code = codeOf(error)
  if (code.includes('permission-denied')) {
    return 'Firestore 권한이 없어요. 관리자에게 보안 규칙 배포를 요청해 주세요.'
  }
  if (code.includes('unavailable')) {
    return '네트워크 연결을 확인한 뒤 다시 시도해 주세요.'
  }
  if (code.includes('failed-precondition')) {
    return '데이터 준비가 필요해요. 잠시 후 다시 시도해 주세요.'
  }
  if (error instanceof Error && error.message) return error.message
  return '알 수 없는 오류가 발생했어요.'
}

export function authMessage(error: unknown): string {
  const code = codeOf(error)
  if (code.includes('invalid-email')) return '이메일 형식이 올바르지 않아요.'
  if (code.includes('missing-email')) return '이메일을 입력해 주세요.'
  if (
    code.includes('invalid-credential') ||
    code.includes('wrong-password') ||
    code.includes('user-not-found')
  ) {
    return '이메일 또는 비밀번호가 맞지 않아요.'
  }
  if (code.includes('email-already-in-use')) {
    return '이미 가입된 이메일이에요. 로그인해 주세요.'
  }
  if (code.includes('weak-password')) {
    return '비밀번호는 6자 이상으로 만들어 주세요.'
  }
  if (code.includes('requires-recent-login')) {
    return '보안을 위해 다시 로그인한 뒤 시도해 주세요.'
  }
  if (code.includes('too-many-requests')) {
    return '시도가 너무 많아요. 잠시 후 다시 시도해 주세요.'
  }
  if (code.includes('operation-not-allowed')) {
    return 'Firebase Console에서 이메일/비밀번호 로그인을 활성화해 주세요.'
  }
  if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) {
    return '로그인 창을 닫았어요.'
  }
  if (code.includes('unauthorized-domain')) {
    return '현재 도메인에서 로그인이 허용되지 않았어요. Firebase 인증 도메인을 확인해 주세요.'
  }
  if (code.includes('network-request-failed')) {
    return '네트워크 연결을 확인해 주세요.'
  }
  if (error instanceof Error && error.message) return error.message
  return '로그인에 실패했어요. 다시 시도해 주세요.'
}
