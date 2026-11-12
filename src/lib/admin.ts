/** 앱 관리자 계정. Firestore 규칙의 isAdmin()과 같은 주소를 유지해야 한다. */
export const ADMIN_EMAIL = 'soundpsb1@gmail.com'

export function isAdminEmail(email: string | null | undefined): boolean {
  return (email ?? '').trim().toLowerCase() === ADMIN_EMAIL
}

/** 관리자 화면은 Google 로그인 세션에서만 연다. */
export function isGoogleAccount(user: {
  providerData?: { providerId: string }[]
} | null | undefined): boolean {
  return Boolean(
    user?.providerData?.some((provider) => provider.providerId === 'google.com'),
  )
}
