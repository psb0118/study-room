export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: InstallPromptEvent | null = null
let captureStarted = false
const listeners = new Set<(event: InstallPromptEvent | null) => void>()

/** beforeinstallprompt는 앱이 마운트되기 전에 발생할 수 있어 main에서 먼저 잡는다. */
export function captureInstallPrompt() {
  if (captureStarted || typeof window === 'undefined') return
  captureStarted = true
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event as InstallPromptEvent
    listeners.forEach((listener) => listener(deferredPrompt))
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    listeners.forEach((listener) => listener(null))
  })
}

export function getInstallPrompt(): InstallPromptEvent | null {
  return deferredPrompt
}

export function subscribeInstallPrompt(
  listener: (event: InstallPromptEvent | null) => void,
): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false
  const event = deferredPrompt
  await event.prompt()
  const choice = await event.userChoice
  deferredPrompt = null
  listeners.forEach((listener) => listener(null))
  return choice.outcome === 'accepted'
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}
