interface LoginProps {
  onSignIn: () => void
  error: string | null
}

export function Login({ onSignIn, error }: LoginProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 text-2xl ring-1 ring-indigo-400/40">
            ⏱
          </div>
          <h1 className="text-2xl font-bold text-white">스터디 룸</h1>
          <p className="mt-2 text-sm text-slate-400">
            실시간 포모도로 · 화이트보드 · 채팅으로 함께 공부해요
          </p>
        </div>
        <button
          type="button"
          onClick={onSignIn}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
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
          Google로 시작하기
        </button>
        {error && (
          <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-center text-sm text-red-300">
            {error}
          </p>
        )}
        <p className="mt-5 text-center text-xs text-slate-500">
          로그인하면 학습 기록과 스트릭이 계정에 저장됩니다.
        </p>
      </div>
    </div>
  )
}
