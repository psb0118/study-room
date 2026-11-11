import type { Role, UserProfile } from '../types'

interface RoleSetupProps {
  profile: UserProfile
  busy: boolean
  error: string | null
  onChoose: (role: Role) => Promise<boolean>
  onLogout: () => void
}

export function RoleSetup({
  profile,
  busy,
  error,
  onChoose,
  onLogout,
}: RoleSetupProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf8ff] px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#b9b4ff] to-[#8d86f5] text-2xl text-white shadow-[0_10px_24px_rgba(141,134,245,0.3)]">
            ⌁
          </div>
          <p className="text-[11px] font-extrabold tracking-[0.12em] text-[#7c74f0] uppercase">
            WELCOME TO HARUGYEOL
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.045em] text-[#3d3a55]">
            {profile.name}님, 어떤 역할로 시작할까요?
          </h1>
          <p className="mt-2 text-sm text-[#8b88a3]">
            역할은 한 번만 선택하면 돼요. 학생과 부모 모두 이메일 계정으로
            시작할 수 있어요.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void onChoose('student')}
            className="group rounded-[18px] border border-[#e6e1ff] bg-white p-6 text-left shadow-[0_12px_35px_rgba(111,104,232,0.07)] transition hover:-translate-y-0.5 hover:border-[#b9b4ff] disabled:opacity-60"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#f1eeff] text-xl">
              📚
            </span>
            <strong className="mt-4 block text-base font-extrabold text-[#3d3a55]">
              학생이에요
            </strong>
            <span className="mt-1 block text-sm leading-relaxed text-[#8b88a3]">
              공부 계획을 세우고 완료하면서 포인트와 레벨을 모아요.
            </span>
            <span className="mt-4 inline-flex rounded-full bg-[#e8f8f0] px-2.5 py-1 text-[11px] font-extrabold text-[#3f9f7f]">
              계획 · 포인트 · 랭킹
            </span>
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => void onChoose('parent')}
            className="group rounded-[18px] border border-[#e6e1ff] bg-white p-6 text-left shadow-[0_12px_35px_rgba(111,104,232,0.07)] transition hover:-translate-y-0.5 hover:border-[#b9b4ff] disabled:opacity-60"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fff1e8] text-xl">
              🌿
            </span>
            <strong className="mt-4 block text-base font-extrabold text-[#3d3a55]">
              부모님이에요
            </strong>
            <span className="mt-1 block text-sm leading-relaxed text-[#8b88a3]">
              자녀의 연결 코드를 입력하고 일정과 진도를 함께 관리해요.
            </span>
            <span className="mt-4 inline-flex rounded-full bg-[#f1eeff] px-2.5 py-1 text-[11px] font-extrabold text-[#6a63c9]">
              일정 추가 · 삭제 · 완료 취소
            </span>
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-[#f6d6dd] bg-[#ffeff3] px-4 py-3 text-center text-sm text-[#d96a7c]">
            {error}
          </p>
        )}
        {busy && (
          <p className="mt-4 text-center text-sm text-[#8b88a3]">
            계정을 준비하고 있어요…
          </p>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onLogout}
            className="text-xs font-semibold text-[#8b88a3] underline underline-offset-4 transition hover:text-[#6f68e8]"
          >
            다른 계정으로 로그인
          </button>
        </div>
      </div>
    </div>
  )
}
