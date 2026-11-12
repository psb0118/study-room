/* FCM 전용 서비스 워커. public/sw.js(오프라인 앱 셸)와 scope를 분리한다. */
importScripts(
  'https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js',
)
importScripts(
  'https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js',
)

firebase.initializeApp({
  apiKey: 'AIzaSyD0ejZvI_HGfOfpBklb8RuxELxmFROoTko',
  authDomain: 'study-room-d0c89.firebaseapp.com',
  projectId: 'study-room-d0c89',
  storageBucket: 'study-room-d0c89.firebasestorage.app',
  messagingSenderId: '916640443953',
  appId: '1:916640443953:web:d9e7a9edd515783a232f10',
})

const messaging = firebase.messaging()

function appUrl() {
  return new URL('./', self.location).href
}

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {}
  const data = payload.data || {}
  self.registration.showNotification(
    notification.title || '하루결 공부 알림',
    {
      body: notification.body || '오늘의 공부 계획을 확인해 보세요.',
      icon: new URL('icons/icon-192.png', self.location).href,
      badge: new URL('icons/icon-192.png', self.location).href,
      data: { url: data.url || appUrl() },
    },
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data?.url || appUrl()
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windows) => {
        for (const client of windows) {
          if (client.url === target && 'focus' in client) return client.focus()
        }
        return clients.openWindow(target)
      }),
  )
})
