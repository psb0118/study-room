/** Android Chrome는 page의 new Notification을 지원하지 않아 SW를 우선 사용한다. */
export async function showBrowserNotification(
  title: string,
  body: string,
): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const icon = new URL('icons/icon-192.png', document.baseURI).href

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.showNotification(title, { body, icon })
      return
    }
  } catch {
    // 서비스 워커가 없거나 표시에 실패하면 아래 생성자로 한 번 더 시도한다.
  }

  try {
    new Notification(title, { body, icon })
  } catch {
    // 모바일 브라우저가 생성자 표시를 막는 경우 알림 없이 넘어간다.
  }
}
