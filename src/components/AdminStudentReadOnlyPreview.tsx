import { useState } from 'react'
import type { PlannerApi } from '../hooks/usePlanner'
import type { ProfileApi } from '../hooks/useProfile'
import { usePlanner } from '../hooks/usePlanner'
import { useChildProfile } from '../hooks/useProfile'
import type { UserProfile } from '../types'
import { AppShell, type View } from './AppShell'
import { Dashboard } from './Dashboard'
import { Goals } from './Goals'
import { Plans } from './Plans'
import { Records } from './Records'
import { Schedule } from './Schedule'
import { Stats } from './Stats'
import { Subjects } from './Subjects'
import { panelClass, primaryButton } from './ui'

/** 학생 데이터를 수정할 수 없도록 모든 쓰기 동작을 막은 API를 만든다. */
function makeReadOnlyPlanner(planner: PlannerApi): PlannerApi {
  const deny = async () => false
  return {
    ...planner,
    saveSubject: deny,
    setSubjectArchived: deny,
    savePlan: deny,
    savePlans: deny,
    importData: deny,
    deletePlan: deny,
    setPlanStatus: deny,
    addManualRecord: deny,
    addFocusRecord: deny,
    deleteRecord: deny,
  }
}

function makeReadOnlyProfileApi(
  profile: UserProfile,
  loading: boolean,
  error: string | null,
): ProfileApi {
  const deny = async () => false
  return {
    profile,
    loading,
    error,
    actionError: null,
    busy: false,
    chooseRole: deny,
    updateNickname: deny,
    savePreferences: deny,
    linkChild: deny,
    unlinkChild: deny,
    regenerateFamilyCode: deny,
    clearError: () => undefined,
  }
}

export function AdminStudentReadOnlyPreview({
  student,
  onExit,
}: {
  student: UserProfile
  onExit: () => void
}) {
  const [view, setView] = useState<View>('home')
  const planner = usePlanner(student.uid)
  const child = useChildProfile(student.uid)
  const profile = child.profile ?? student
  const readOnlyPlanner = makeReadOnlyPlanner(planner)
  const profileApi = makeReadOnlyProfileApi(
    profile,
    child.loading,
    child.error,
  )
  const name = profile.nickname || profile.name || '학생'
  const loading = planner.loading || child.loading
  const error = planner.error || child.error

  const content = () => {
    if (loading) {
      return (
        <section className={`${panelClass} p-8 text-center`}>
          <p className="text-sm font-extrabold text-[#3d3a55]">
            학생 플래너를 불러오는 중…
          </p>
          <p className="mt-1 text-xs text-[#8b88a3]">
            관리자 읽기 권한으로 실제 데이터를 확인하고 있어요.
          </p>
        </section>
      )
    }

    if (error) {
      return (
        <section className={`${panelClass} p-6`}>
          <p className="text-sm font-extrabold text-[#d96a7c]">
            학생 플래너를 불러오지 못했어요.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#8b88a3]">
            {error}
          </p>
          <p className="mt-3 rounded-xl bg-[#fff9ec] px-3.5 py-2.5 text-xs leading-relaxed text-[#9a7b4f]">
            Firestore 규칙에 관리자 읽기 권한이 게시됐는지 확인해 주세요.
            학생 데이터는 읽기만 하며 수정할 수 없습니다.
          </p>
        </section>
      )
    }

    switch (view) {
      case 'plans':
        return <Plans planner={readOnlyPlanner} onNavigate={setView} readOnly />
      case 'subjects':
        return <Subjects planner={readOnlyPlanner} readOnly />
      case 'records':
        return (
          <Records
            planner={readOnlyPlanner}
            onNavigate={setView}
            readOnly
          />
        )
      case 'stats':
        return <Stats planner={readOnlyPlanner} />
      case 'goals':
        return (
          <Goals
            profile={profile}
            profileApi={profileApi}
            planner={readOnlyPlanner}
            readOnly
          />
        )
      case 'schedule':
        return (
          <Schedule
            planner={readOnlyPlanner}
            onNavigate={setView}
            readOnly
          />
        )
      case 'rooms':
      case 'leaderboard':
      case 'family':
        return (
          <section className={`${panelClass} p-8`}>
            <p className="text-[11px] font-extrabold tracking-[0.08em] text-[#7c74f0] uppercase">
              READ ONLY PREVIEW
            </p>
            <h2 className="mt-2 text-lg font-extrabold text-[#3d3a55]">
              이 화면은 읽기 전용 미리보기에서 제공하지 않아요
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#8b88a3]">
              스터디 룸·포인트 순위·부모 연결은 실시간 Firebase 연결이
              필요한 화면이에요. 학생 플래너의 계획·과목·기록·통계는 위
              메뉴에서 확인할 수 있습니다.
            </p>
            <button
              type="button"
              onClick={() => setView('home')}
              className={`${primaryButton} mt-5`}
            >
              홈으로 돌아가기
            </button>
          </section>
        )
      default:
        return (
          <Dashboard
            name={name}
            photo={profile.photo || undefined}
            planner={readOnlyPlanner}
            onNavigate={setView}
            readOnly
          />
        )
    }
  }

  return (
    <AppShell
      name={name}
      photo={profile.photo || undefined}
      role="student"
      view={view}
      onNavigate={setView}
      onLogout={onExit}
      logoutLabel="관리자로 돌아가기"
      preview
    >
      <section className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d6d1ff] bg-[#faf9ff] px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold tracking-[0.1em] text-[#7c74f0] uppercase">
            ADMIN READ ONLY
          </p>
          <h1 className="mt-0.5 truncate text-sm font-extrabold text-[#3d3a55]">
            {name} 학생의 실제 플래너
          </h1>
          <p className="mt-0.5 truncate text-[11px] text-[#8b88a3]">
            {profile.email} · 읽기 전용 · 수정과 알림은 할 수 없어요
          </p>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="shrink-0 rounded-xl border border-[#d6d1ff] bg-white px-3 py-2 text-xs font-extrabold text-[#6a63c9] transition hover:bg-[#f1eeff]"
        >
          관리자로 돌아가기
        </button>
      </section>

      {content()}
    </AppShell>
  )
}
