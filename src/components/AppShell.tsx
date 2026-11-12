import type { ReactNode } from 'react'
import type { Role } from '../types'
import { Avatar } from './Avatar'
import { InstallPrompt } from './InstallPrompt'
import { OfflineNotice } from './OfflineNotice'

export type View =
  | 'home'
  | 'rooms'
  | 'plans'
  | 'subjects'
  | 'records'
  | 'goals'
  | 'stats'
  | 'schedule'
  | 'leaderboard'
  | 'family'

const STUDENT_NAV: { id: View; icon: string; label: string }[] = [
  { id: 'home', icon: '◒', label: '홈' },
  { id: 'rooms', icon: '◷', label: '스터디 룸' },
  { id: 'plans', icon: '▣', label: '공부 계획' },
  { id: 'subjects', icon: '●', label: '과목 관리' },
  { id: 'records', icon: '▤', label: '공부 기록' },
  { id: 'goals', icon: '◎', label: '주간 목표' },
  { id: 'stats', icon: '▥', label: '통계' },
  { id: 'schedule', icon: '▦', label: '시간표' },
  { id: 'leaderboard', icon: '★', label: '포인트 순위' },
  { id: 'family', icon: '♧', label: '부모님 연결' },
]

const PARENT_NAV: { id: View; icon: string; label: string }[] = [
  { id: 'home', icon: '◒', label: '자녀 현황' },
  { id: 'plans', icon: '▣', label: '일정 관리' },
  { id: 'schedule', icon: '▦', label: '시간표' },
  { id: 'stats', icon: '▥', label: '통계' },
  { id: 'leaderboard', icon: '★', label: '포인트 순위' },
  { id: 'family', icon: '♧', label: '자녀 연결' },
]

const ADMIN_NAV: { id: View; icon: string; label: string }[] = [
  { id: 'home', icon: '⚙', label: '관리자' },
]

const STUDENT_MOBILE = ['home', 'plans', 'rooms', 'leaderboard', 'family']
const PARENT_MOBILE = ['home', 'plans', 'stats', 'leaderboard', 'family']
const ADMIN_MOBILE = ['home']

interface AppShellProps {
  name: string
  photo?: string
  role: Role
  view: View
  onNavigate: (view: View) => void
  onLogout: () => void
  children: ReactNode
}

export function AppShell({
  name,
  photo,
  role,
  view,
  onNavigate,
  onLogout,
  children,
}: AppShellProps) {
  const nav =
    role === 'parent' ? PARENT_NAV : role === 'admin' ? ADMIN_NAV : STUDENT_NAV
  const mobileIds =
    role === 'parent'
      ? PARENT_MOBILE
      : role === 'admin'
        ? ADMIN_MOBILE
        : STUDENT_MOBILE
  const mobileNav = nav.filter((item) => mobileIds.includes(item.id))
  const roleLabel =
    role === 'parent'
      ? '부모 관리'
      : role === 'admin'
        ? '관리자'
        : '학생 플래너'

  return (
    <div className="min-h-screen bg-transparent lg:flex">
      <aside className="sticky top-0 hidden h-screen w-[252px] shrink-0 flex-col border-r border-[#ece8f7] bg-white/90 px-4 py-[27px] backdrop-blur-xl lg:flex">
        <div className="mb-7 flex items-center gap-2.5 px-2.5">
          <span className="grid h-[34px] w-[34px] place-items-center rounded-[11px] bg-gradient-to-br from-[#b9b4ff] to-[#8d86f5] text-lg text-white shadow-[0_7px_15px_rgba(141,134,245,0.3)]">
            ⌁
          </span>
          <div>
            <div className="text-[21px] leading-none font-extrabold tracking-[-0.04em] text-[#3d3a55]">
              하루결
            </div>
            <div className="mt-1.5 text-[10px] font-extrabold tracking-[0.09em] text-[#aaa7ba]">
              STUDY ROOM · PLANNER
            </div>
          </div>
        </div>

        <div className="mb-2 flex items-center justify-between px-3">
          <span className="text-[11px] font-extrabold tracking-[0.09em] text-[#aaa7ba]">
            MENU
          </span>
          <span className="rounded-full bg-[#f1eeff] px-2 py-0.5 text-[9px] font-extrabold text-[#6a63c9]">
            {roleLabel}
          </span>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={view === item.id ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 text-left text-sm font-bold transition ${
                view === item.id
                  ? 'bg-[#f1eeff] text-[#6f68e8]'
                  : 'text-[#706d8a] hover:bg-[#f7f4ff] hover:text-[#6f68e8]'
              }`}
            >
              <span className="w-5 text-center text-[17px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto rounded-[14px] border border-[#f0ecff] bg-[#faf9ff] p-3.5 text-xs leading-relaxed text-[#6d6a85]">
          <div className="mb-2 flex items-center gap-2.5">
            <Avatar name={name} photo={photo} size={30} />
            <div className="min-w-0">
              <div className="truncate text-xs font-extrabold text-[#5f57c8]">
                {name}
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="text-[11px] text-[#9692ad] transition hover:text-[#5f57c8]"
              >
                로그아웃
              </button>
            </div>
          </div>
          <strong className="block text-[11px] text-[#5f57c8]">
            내 계정에 안전하게 저장 중
          </strong>
          {role === 'parent'
            ? '자녀의 계획과 포인트가 Firebase에 동기화됩니다.'
            : role === 'admin'
              ? '관리자 화면에서 계정 이용 상태를 관리할 수 있습니다.'
              : '계획과 기록은 로그인한 계정에 동기화됩니다.'}
        </div>
      </aside>

      <div className="min-w-0 flex-1 pb-24 lg:pb-0">
        <header className="flex items-center justify-between gap-3 border-b border-[#ece8f7] bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#3d3a55]">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[#b9b4ff] to-[#8d86f5] text-white">
              ⌁
            </span>
            하루결
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#f1eeff] px-2 py-0.5 text-[9px] font-extrabold text-[#6a63c9]">
              {roleLabel}
            </span>
            <Avatar name={name} photo={photo} size={26} />
            <button
              type="button"
              onClick={onLogout}
              className="text-xs font-medium text-[#8b88a3] transition hover:text-[#6f68e8]"
            >
              로그아웃
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          <OfflineNotice />
          <InstallPrompt />
          {children}
        </main>
      </div>

      <nav
        className={`fixed inset-x-0 bottom-0 z-30 grid border-t border-[#ece8f7] bg-white/95 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(61,58,85,0.05)] backdrop-blur-xl lg:hidden ${
          role === 'admin' ? 'grid-cols-1' : 'grid-cols-5'
        }`}
      >
        {mobileNav.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            aria-current={view === item.id ? 'page' : undefined}
            className={`grid place-items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-bold transition ${
              view === item.id
                ? 'bg-[#f1eeff] text-[#6f68e8]'
                : 'text-[#8b88a3] hover:text-[#6f68e8]'
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
