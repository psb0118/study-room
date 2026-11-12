import { useEffect } from 'react'
import { showBrowserNotification } from '../lib/notifications'
import { listenForegroundPush } from '../lib/push'

/** FCM이 등록된 사용자가 앱을 열어둔 동안 받은 메시지를 표시한다. */
export function useForegroundPush(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    let unsub: (() => void) | undefined
    let active = true
    void listenForegroundPush((title, body) => {
      void showBrowserNotification(title, body)
    }).then((cleanup) => {
      if (active) unsub = cleanup
      else cleanup?.()
    })
    return () => {
      active = false
      unsub?.()
    }
  }, [enabled])
}
