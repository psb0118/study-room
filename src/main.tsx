import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { logAppError } from './lib/errorLog'
import { captureInstallPrompt } from './lib/installPrompt'

/**
 * 프로덕션 빌드에서 앱 셸을 서비스 워커에 캐시한다.
 * 첫 방문에는 index.html을, 이후 로드에서는 해시된 JS/CSS를 캐시해
 * 네트워크가 끊겨도 앱을 다시 열 수 있게 한다.
 */
function registerAppShell() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    void navigator.serviceWorker
      .register(new URL('sw.js', document.baseURI).href)
      .then(async (registration) => {
        await navigator.serviceWorker.ready
        const assetUrls = [
          ...Array.from(
            document.querySelectorAll<HTMLScriptElement>('script[src]'),
            (node) => node.src,
          ),
          ...Array.from(
            document.querySelectorAll<HTMLLinkElement>(
              'link[rel="stylesheet"]',
            ),
            (node) => node.href,
          ),
        ]
        registration.active?.postMessage({
          type: 'CACHE_URLS',
          urls: assetUrls,
        })
      })
      .catch((e) => {
        console.warn('[offline] 앱 셸을 준비하지 못했습니다:', e)
      })
  })
}

registerAppShell()
captureInstallPrompt()

window.addEventListener('error', (event) => {
  logAppError(event.error ?? event.message, 'window.error')
})
window.addEventListener('unhandledrejection', (event) => {
  logAppError(event.reason, 'unhandledrejection')
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
