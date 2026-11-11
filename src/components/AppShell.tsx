import type { ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { Avatar } from './Avatar'

export type View =
  | 'home'
  | 'rooms'
  | 'plans'
  | 'subjects'
  | 'records'
  | 'stats'
  | 'schedule'

const NAV: { id: View; icon: string; label: string }[] = [
  { id: 'home', icon: '◒', label: '홈' },
  { id: 'rooms', icon: '◷', label: '스터디 룸' },
  { id: 'plans', icon: '▣', label: '공부 계획' },
  { id: 'subjects', icon: '●', label: '과목 관리' },
  { id: 'records', icon: '▤', label: '공부 기록' },
  { id: 'stats', icon: '▥', label: '통계' },
  { id: 'schedule', icon: '▦', label: '시간표' },
]

const MOBILE_NAV = NAV.filter((item) =>
  ['home', 'plans', 'rooms', 'stats', 'schedule'].includes(item.id),
)

interface AppShellProps {
  user: User
  view: View
  onNavigate: (view: View) => void
  onLogout: () => void
  children: ReactNode
}

export function AppShell({
  user,
  view,
  onNavigate,
  onLogout,
  children,
}: AppShellProps) {
  const name = user.displayName ?? '익명'

  return (
    <div className="min-h-screen bg-[#f6f7fb] lg:flex">
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-[#e7e9f2] bg-white/90 px-4 py-[27px] backdrop-blur-xl lg:flex">
        <div className="mb-7 flex items-center gap-2.5 px-2.5">
          <span className="grid h-[34px] w-[34px] place-items-center rounded-[11px] bg-gradient-to-br from-[#6f7df0] to-[#4958cf] text-lg text-white shadow-[0_7px_15px_rgba(78,92,207,0.25)]">
            ⌁
          </span>
          <div>
            <div className="text-[21px] leading-none font-extrabold tracking-[-0.04em] text-[#202538]">
              하루결
            </div>
            <div className="mt-1.5 text-[10px] font-extrabold tracking-[0.09em] text-[#a1a5b5]">
              STUDY ROOM · PLANNER
            </div>
          </div>
        </div>

        <div className="mb-2 px-3 text-[11px] font-extrabold tracking-[0.09em] text-[#a1a5b5]">
          MENU
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 text-left text-sm font-bold transition ${
                view === item.id
                  ? 'bg-[#eef0ff] text-[#5969df]'
                  : 'text-[#62687d] hover:bg-[#f5f6ff] hover:text-[#5969df]'
              }`}
            >
              <span className="w-5 text-center text-[17px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto rounded-[14px] border border-[#ebe9fe] bg-[#f9f8ff] p-3.5 text-xs leading-relaxed text-[#5f6280]">
          <div className="mb-2 flex items-center gap-2.5">
            <Avatar name={name} photo={user.photoURL ?? undefined} size={30} />
            <div className="min-w-0">
              <div className="truncate text-xs font-extrabold text-[#4d50a6]">
                {name}
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="text-[11px] text-[#8387a0] transition hover:text-[#4d50a6]"
              >
                로그아웃
              </button>
            </div>
          </div>
          <strong className="block text-[11px] text-[#4d50a6]">
            내 계정에 안전하게 저장 중
          </strong>
          계획과 기록은 로그인한 계정에 동기화됩니다.
        </div>
      </aside>

      <div className="min-w-0 flex-1 pb-24 lg:pb-0">
        <header className="flex items-center justify-between gap-3 border-b border-[#e7e9f2] bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#202538]">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[#6f7df0] to-[#4958cf] text-white">
              ⌁
            </span>
            하루결
          </div>
          <div className="flex items-center gap-2">
            <Avatar name={name} photo={user.photoURL ?? undefined} size={26} />
            <button
              type="button"
              onClick={onLogout}
              className="text-xs font-medium text-[#72778d] transition hover:text-[#5969df]"
            >
              로그아웃
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#e5e7ee] bg-white/95 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(29,34,60,0.05)] backdrop-blur-xl lg:hidden">
        {MOBILE_NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`grid place-items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-bold transition ${
              view === item.id
                ? 'bg-[#eef0ff] text-[#5969df]'
                : 'text-[#7a8092] hover:text-[#5969df]'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
