import { useState, type FormEvent } from 'react'
import { inputClass, primaryButton } from './ui'

interface LoginProps {
  onGoogle: () => void
  onEmailSignIn: (email: string, password: string) => Promise<boolean>
  onEmailSignUp: (
    name: string,
    email: string,
    password: string,
  ) => Promise<boolean>
  onResetPassword: (email: string) => Promise<boolean>
  error: string | null
  clearError: () => void
}

type Mode = 'signin' | 'signup'

export function Login({
  onGoogle,
  onEmailSignIn,
  onEmailSignUp,
  onResetPassword,
  error,
  clearError,
}: LoginProps) {
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const switchMode = (next: Mode) => {
    setMode(next)
    setLocalError(null)
    setNotice(null)
    clearError()
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLocalError(null)
    setNotice(null)
    if (!email.trim()) {
      setLocalError('이메일을 입력해 주세요.')
      return
    }
    if (!password) {
      setLocalError('비밀번호를 입력해 주세요.')
      return
    }
    if (mode === 'signup' && !name.trim()) {
      setLocalError('이름을 입력해 주세요.')
      return
    }
    if (mode === 'signup' && password.length < 6) {
      setLocalError('비밀번호는 6자 이상으로 만들어 주세요.')
      return
    }

    setBusy(true)
    const ok =
      mode === 'signup'
        ? await onEmailSignUp(name, email, password)
        : await onEmailSignIn(email, password)
    setBusy(false)
    if (ok) setPassword('')
  }

  const resetPassword = async () => {
    setLocalError(null)
    setNotice(null)
    if (!email.trim()) {
      setLocalError('비밀번호를 재설정할 이메일을 먼저 입력해 주세요.')
      return
    }
    setBusy(true)
    const ok = await onResetPassword(email)
    setBusy(false)
    if (ok) setNotice('비밀번호 재설정 메일을 보냈어요. 메일함을 확인해 주세요.')
  }

  const displayError = localError ?? error

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#faf8ff] px-4 py-8">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#f1eeff] blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-[#e8f8f0] blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#b9b4ff] to-[#8d86f5] text-2xl text-white shadow-[0_10px_24px_rgba(141,134,245,0.3)]">
            ⌁
          </div>
          <h1 className="text-2xl font-extrabold tracking-[-0.045em] text-[#3d3a55]">
            하루결
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#8b88a3]">
            공부 계획과 포인트를 쌓아가는 나만의 공부 공간
          </p>
        </div>

        <div className="surface p-5 sm:p-6">
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-[#f7f4ff] p-1">
            {(
              [
                ['signin', '로그인'],
                ['signup', '회원가입'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => switchMode(value)}
                className={`rounded-lg px-3 py-2 text-xs font-extrabold transition ${
                  mode === value
                    ? 'bg-white text-[#5f57c8] shadow-sm'
                    : 'text-[#8b88a3] hover:text-[#6a63c9]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="grid gap-3">
            {mode === 'signup' && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[#5f5c78]">
                  이름
                </span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  placeholder="하루"
                  className={inputClass}
                />
              </label>
            )}
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#5f5c78]">
                이메일
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="student@example.com"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#5f5c78]">
                비밀번호
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={
                  mode === 'signup' ? 'new-password' : 'current-password'
                }
                placeholder="6자 이상"
                className={inputClass}
              />
            </label>

            {mode === 'signin' && (
              <button
                type="button"
                onClick={() => void resetPassword()}
                disabled={busy}
                className="justify-self-end text-[11px] font-semibold text-[#8b88a3] underline underline-offset-4 transition hover:text-[#6f68e8]"
              >
                비밀번호를 잊었나요?
              </button>
            )}

            <button
              type="submit"
              disabled={busy}
              className={`${primaryButton} mt-1 w-full`}
            >
              {busy
                ? '처리 중…'
                : mode === 'signup'
                  ? '이메일로 가입하기'
                  : '이메일로 로그인'}
            </button>
          </form>

          {displayError && (
            <p className="mt-3 rounded-xl bg-[#ffeff3] px-3 py-2.5 text-center text-xs text-[#d96a7c]">
              {displayError}
            </p>
          )}
          {notice && (
            <p className="mt-3 rounded-xl bg-[#e8f8f0] px-3 py-2.5 text-center text-xs text-[#3f9f7f]">
              {notice}
            </p>
          )}

          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-[#ece8f7]" />
            <span className="text-[10px] font-bold text-[#aaa7ba]">또는</span>
            <span className="h-px flex-1 bg-[#ece8f7]" />
          </div>

          <button
            type="button"
            onClick={onGoogle}
            disabled={busy}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#e4e0f0] bg-white px-4 py-2.5 text-sm font-bold text-[#3d3a55] transition hover:border-[#c9c3e2] hover:bg-[#fbf9ff]"
          >
            <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.5 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.1 17.7 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.6-.15-3.15-.42-4.65H24v9.02h12.9c-.55 2.9-2.2 5.35-4.7 7l7.6 5.9c4.45-4.1 7.18-10.15 7.18-17.27z"
              />
              <path
                fill="#FBBC05"
                d="M10.4 28.7a14.5 14.5 0 0 1 0-9.4l-7.8-6.1a24 24 0 0 0 0 21.6l7.8-6.1z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.5 0 11.95-2.15 15.93-5.83l-7.6-5.9c-2.1 1.42-4.8 2.28-8.33 2.28-6.3 0-11.7-3.6-13.6-8.6l-7.8 6.1C6.5 42.6 14.6 48 24 48z"
              />
            </svg>
            Google로 계속하기
          </button>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-[#aaa7ba]">
            학생과 부모 모두 이메일로 가입할 수 있어요.
            <br />
            로그인하면 계획과 포인트가 계정에 저장됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}
