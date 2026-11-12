import { useEffect, useState } from 'react'
import {
  getInstallPrompt,
  isStandalone,
  promptInstall,
  subscribeInstallPrompt,
} from '../lib/installPrompt'

const DISMISS_KEY = 'haru-gyeol-install-dismissed'

/** Android/Chrome는 설치 버튼을, iOS Safari는 홈 화면 추가 안내를 보여준다. */
export function InstallPrompt() {
  const [available, setAvailable] = useState(Boolean(getInstallPrompt()))
  const [isIos] = useState(() =>
    /iphone|ipad|ipod/i.test(navigator.userAgent),
  )
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === '1',
  )

  useEffect(() => {
    if (isStandalone()) return
    return subscribeInstallPrompt((event) => setAvailable(Boolean(event)))
  }, [])

  if (dismissed || isStandalone() || (!available && !isIos)) return null

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <section className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e6e1ff] bg-[#faf9ff] px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-extrabold text-[#5f57c8]">
          하루결을 폰에 앱처럼 설치하세요
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-[#8b88a3]">
          {isIos
            ? 'Safari에서 공유 버튼을 누른 뒤 ‘홈 화면에 추가’를 선택하세요.'
            : '홈 화면에서 바로 열고, 앱을 닫아도 학습 알림을 받을 수 있어요.'}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {available && (
          <button
            type="button"
            onClick={() => void promptInstall()}
            className="btn btn-primary min-h-9 px-3 text-xs"
          >
            앱 설치
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="btn btn-quiet min-h-9 px-2 text-xs text-[#8b88a3]"
        >
          나중에
        </button>
      </div>
    </section>
  )
}
