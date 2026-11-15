import { useState } from 'react'
import type { ManualRecordInput, PlannerApi } from '../hooks/usePlanner'
import type { ProfileApi } from '../hooks/useProfile'
import type { ImportBundle } from '../lib/exportData'
import { normalizePlanReminderOffset } from '../lib/planReminder'
import { SUBJECT_COLORS, todayKey } from '../lib/planner'
import { addDays } from '../lib/streak'
import type {
  PlanInput,
  PlanStatus,
  StudyPlan,
  StudyRecord,
  Subject,
  UserProfile,
} from '../types'
import { AppShell, type View } from './AppShell'
import { Dashboard } from './Dashboard'
import { Goals } from './Goals'
import { Plans } from './Plans'
import { Records } from './Records'
import { Schedule } from './Schedule'
import { Stats } from './Stats'
import { Subjects } from './Subjects'
import { panelClass } from './ui'

const DEMO_SUBJECT_IDS = {
  korean: 'demo-subject-korean',
  math: 'demo-subject-math',
  english: 'demo-subject-english',
} as const

let demoIdSequence = 0

function nextDemoId(prefix: string): string {
  demoIdSequence += 1
  return `demo-${prefix}-${Date.now()}-${demoIdSequence}`
}

function makeDemoPlan(
  id: string,
  subjectId: string,
  title: string,
  plannedDate: string,
  targetMinutes: number,
  overrides: Partial<StudyPlan> = {},
): StudyPlan {
  const now = Date.now()
  return {
    id,
    subjectId,
    title,
    description: '',
    plannedDate,
    startTime: '',
    endTime: '',
    targetMinutes,
    priority: 'medium',
    status: 'planned',
    completedAt: 0,
    memo: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function makeDemoRecord(
  id: string,
  subjectId: string,
  planId: string,
  dateKey: string,
  minutes: number,
  hour: number,
): StudyRecord {
  const startedAt = new Date(
    `${dateKey}T${String(hour).padStart(2, '0')}:00:00`,
  ).getTime()
  return {
    id,
    subjectId,
    planId,
    dateKey,
    source: 'manual',
    startedAt,
    endedAt: startedAt + minutes * 60_000,
    durationMs: minutes * 60_000,
    memo: '',
    createdAt: startedAt + minutes * 60_000,
  }
}

function makeDemoData(): {
  subjects: Subject[]
  plans: StudyPlan[]
  records: StudyRecord[]
} {
  const today = todayKey()
  const yesterday = addDays(today, -1)
  const twoDaysAgo = addDays(today, -2)
  const tomorrow = addDays(today, 1)
  const now = Date.now()

  const subjects: Subject[] = [
    {
      id: DEMO_SUBJECT_IDS.korean,
      name: '국어',
      color: SUBJECT_COLORS[0],
      archived: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_SUBJECT_IDS.math,
      name: '수학',
      color: SUBJECT_COLORS[1],
      archived: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_SUBJECT_IDS.english,
      name: '영어',
      color: SUBJECT_COLORS[2],
      archived: false,
      createdAt: now,
      updatedAt: now,
    },
  ]

  const plans: StudyPlan[] = [
    makeDemoPlan(
      'demo-plan-math-today',
      DEMO_SUBJECT_IDS.math,
      '수학 문제집 2단원',
      today,
      40,
      {
        description: '분수와 소수 문제 풀기',
        startTime: '19:00',
        endTime: '19:40',
        priority: 'high',
        memo: '틀린 문제는 오답 노트에 정리하기',
      },
    ),
    makeDemoPlan(
      'demo-plan-english-today',
      DEMO_SUBJECT_IDS.english,
      '영어 단어 20개',
      today,
      20,
      {
        startTime: '08:00',
        endTime: '08:20',
        status: 'completed',
        completedAt: now - 60 * 60_000,
      },
    ),
    makeDemoPlan(
      'demo-plan-korean-yesterday',
      DEMO_SUBJECT_IDS.korean,
      '국어 독서 기록',
      yesterday,
      30,
      { memo: '어제 마무리하지 못한 계획' },
    ),
    makeDemoPlan(
      'demo-plan-math-two-days',
      DEMO_SUBJECT_IDS.math,
      '수학 오답 노트',
      twoDaysAgo,
      30,
      {
        status: 'completed',
        completedAt: now - 2 * 24 * 60 * 60_000,
      },
    ),
    makeDemoPlan(
      'demo-plan-english-tomorrow',
      DEMO_SUBJECT_IDS.english,
      '영어 듣기 연습',
      tomorrow,
      25,
      { startTime: '20:00', endTime: '20:25' },
    ),
  ]

  const records: StudyRecord[] = [
    makeDemoRecord(
      'demo-record-english-today',
      DEMO_SUBJECT_IDS.english,
      'demo-plan-english-today',
      today,
      20,
      8,
    ),
    makeDemoRecord(
      'demo-record-korean-yesterday',
      DEMO_SUBJECT_IDS.korean,
      '',
      yesterday,
      45,
      18,
    ),
    makeDemoRecord(
      'demo-record-math-two-days',
      DEMO_SUBJECT_IDS.math,
      'demo-plan-math-two-days',
      twoDaysAgo,
      30,
      19,
    ),
  ]

  return { subjects, plans, records }
}

function toStudyPlan(id: string, input: PlanInput, createdAt: number): StudyPlan {
  const now = Date.now()
  return {
    id,
    ...input,
    completedAt:
      input.status === 'completed' ? input.completedAt || now : 0,
    createdAt,
    updatedAt: now,
  }
}

/** Firestore를 전혀 사용하지 않는 관리자용 학생 플래너 데이터. */
function useDemoPlanner(): PlannerApi {
  const [initial] = useState(makeDemoData)
  const [subjects, setSubjects] = useState<Subject[]>(initial.subjects)
  const [plans, setPlans] = useState<StudyPlan[]>(initial.plans)
  const [records, setRecords] = useState<StudyRecord[]>(initial.records)

  const saveSubject: PlannerApi['saveSubject'] = async (input) => {
    const name = input.name.trim()
    if (!name) return false
    const now = Date.now()
    setSubjects((prev) => {
      if (input.id) {
        return prev.map((subject) =>
          subject.id === input.id
            ? {
                ...subject,
                name,
                color: input.color,
                updatedAt: now,
              }
            : subject,
        )
      }
      return [
        ...prev,
        {
          id: nextDemoId('subject'),
          name,
          color: input.color,
          archived: false,
          createdAt: now,
          updatedAt: now,
        },
      ]
    })
    return true
  }

  const setSubjectArchived: PlannerApi['setSubjectArchived'] = async (
    id,
    archived,
  ) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === id
          ? { ...subject, archived, updatedAt: Date.now() }
          : subject,
      ),
    )
    return true
  }

  const savePlan: PlannerApi['savePlan'] = async (input) => {
    const now = Date.now()
    setPlans((prev) => {
      if (input.id) {
        return prev.map((plan) =>
          plan.id === input.id
            ? toStudyPlan(plan.id, input, plan.createdAt)
            : plan,
        )
      }
      return [...prev, toStudyPlan(nextDemoId('plan'), input, now)]
    })
    return true
  }

  const savePlans: PlannerApi['savePlans'] = async (inputs) => {
    const now = Date.now()
    setPlans((prev) => [
      ...prev,
      ...inputs.map((input) => toStudyPlan(nextDemoId('plan'), input, now)),
    ])
    return true
  }

  const importData: PlannerApi['importData'] = async (bundle: ImportBundle) => {
    setSubjects(bundle.subjects)
    setPlans(bundle.plans)
    setRecords(bundle.records)
    return true
  }

  const deletePlan: PlannerApi['deletePlan'] = async (id) => {
    setPlans((prev) => prev.filter((plan) => plan.id !== id))
    return true
  }

  const setPlanStatus: PlannerApi['setPlanStatus'] = async (
    id,
    status: PlanStatus,
  ) => {
    const now = Date.now()
    setPlans((prev) =>
      prev.map((plan) =>
        plan.id === id
          ? {
              ...plan,
              status,
              completedAt: status === 'completed' ? now : 0,
              updatedAt: now,
            }
          : plan,
      ),
    )
    return true
  }

  const addManualRecord: PlannerApi['addManualRecord'] = async (
    input: ManualRecordInput,
  ) => {
    const minutes = Math.round(input.minutes)
    const ended = new Date(`${input.date}T12:00:00`)
    const started = new Date(ended.getTime() - minutes * 60_000)
    setRecords((prev) => [
      ...prev,
      {
        id: nextDemoId('record'),
        subjectId: input.subjectId,
        planId: input.planId,
        dateKey: input.date,
        source: 'manual',
        startedAt: started.getTime(),
        endedAt: ended.getTime(),
        durationMs: minutes * 60_000,
        memo: input.memo.trim(),
        createdAt: Date.now(),
      },
    ])
    return true
  }

  const addFocusRecord: PlannerApi['addFocusRecord'] = async (input) => {
    const endedAt = input.endedAt || Date.now()
    const startedAt = input.startedAt || endedAt - input.minutes * 60_000
    setRecords((prev) => [
      ...prev,
      {
        id: nextDemoId('record'),
        subjectId: input.subjectId,
        planId: input.planId,
        dateKey: todayKey(),
        source: 'manual',
        startedAt,
        endedAt,
        durationMs: input.minutes * 60_000,
        memo: input.memo.trim(),
        createdAt: Date.now(),
      },
    ])
    return true
  }

  const deleteRecord: PlannerApi['deleteRecord'] = async (id) => {
    setRecords((prev) => prev.filter((record) => record.id !== id))
    return true
  }

  return {
    subjects,
    plans,
    records,
    loading: false,
    error: null,
    saveSubject,
    setSubjectArchived,
    savePlan,
    savePlans,
    importData,
    deletePlan,
    setPlanStatus,
    addManualRecord,
    addFocusRecord,
    deleteRecord,
  }
}

function makeDemoProfile(): UserProfile {
  const now = Date.now()
  return {
    uid: 'demo-student',
    name: '테스트 학생',
    nickname: '미리보기 학생',
    email: 'preview@example.com',
    photo: '',
    role: 'student',
    familyCode: 'DEMO01',
    childUid: '',
    childUids: [],
    childNames: {},
    accountStatus: 'active',
    statusReason: '',
    statusUpdatedAt: 0,
    statusUpdatedBy: '',
    weeklyGoals: {
      [DEMO_SUBJECT_IDS.korean]: 60,
      [DEMO_SUBJECT_IDS.math]: 120,
      [DEMO_SUBJECT_IDS.english]: 60,
    },
    reminderEnabled: false,
    reminderTime: '19:00',
    reminderTimezone: 'Asia/Seoul',
    pushEnabled: false,
    planReminderEnabled: false,
    planReminderOffsetMinutes: 10,
    lastReminderKey: '',
    lastReminderAt: 0,
    createdAt: now,
    updatedAt: now,
  }
}

/** 관리자 미리보기용 ProfileApi. 실제 프로필이나 알림에는 접근하지 않는다. */
function useDemoProfile(): ProfileApi {
  const [profile, setProfile] = useState<UserProfile>(makeDemoProfile)
  const [actionError, setActionError] = useState<string | null>(null)

  const savePreferences: ProfileApi['savePreferences'] = async (patch) => {
    setProfile((prev) => ({
      ...prev,
      ...patch,
      planReminderOffsetMinutes: normalizePlanReminderOffset(
        patch.planReminderOffsetMinutes ?? prev.planReminderOffsetMinutes,
      ),
      updatedAt: Date.now(),
    }))
    return true
  }

  const updateNickname = async (rawNickname: string): Promise<boolean> => {
    const nickname = rawNickname.trim()
    if (nickname.length < 2 || nickname.length > 20) {
      setActionError('닉네임은 2~20자로 입력해 주세요.')
      return false
    }
    setProfile((prev) => ({ ...prev, nickname, updatedAt: Date.now() }))
    return true
  }

  return {
    profile,
    loading: false,
    error: null,
    actionError,
    busy: false,
    chooseRole: async () => false,
    updateNickname,
    savePreferences,
    linkChild: async () => false,
    unlinkChild: async () => false,
    regenerateFamilyCode: async () => false,
    clearError: () => setActionError(null),
  }
}

export function AdminStudentPreview({
  admin,
  onExit,
}: {
  admin: UserProfile
  onExit: () => void
}) {
  const planner = useDemoPlanner()
  const profileApi = useDemoProfile()
  const profile = profileApi.profile
  const [view, setView] = useState<View>('home')

  const page = (() => {
    switch (view) {
      case 'plans':
        return <Plans planner={planner} onNavigate={setView} />
      case 'subjects':
        return <Subjects planner={planner} />
      case 'records':
        return <Records planner={planner} onNavigate={setView} />
      case 'goals':
        return (
          <Goals
            profile={profile ?? makeDemoProfile()}
            profileApi={profileApi}
            planner={planner}
            preview
          />
        )
      case 'stats':
        return <Stats planner={planner} />
      case 'schedule':
        return <Schedule planner={planner} onNavigate={setView} />
      case 'rooms':
      case 'leaderboard':
      case 'family':
        return <PreviewUnavailable view={view} onNavigate={setView} />
      case 'home':
      default:
        return (
          <Dashboard
            name={profile?.name ?? '테스트 학생'}
            planner={planner}
            onNavigate={setView}
          />
        )
    }
  })()

  return (
    <AppShell
      name={profile?.name ?? '테스트 학생'}
      role="student"
      view={view}
      onNavigate={setView}
      onLogout={onExit}
      logoutLabel="미리보기 종료"
      preview
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d6d1ff] bg-[#f7f4ff] px-4 py-3 text-sm text-[#5f5c78]">
        <div>
          <strong className="font-extrabold text-[#5f57c8]">
            학생 플래너 미리보기
          </strong>
          <p className="mt-0.5 text-xs leading-relaxed text-[#8b88a3]">
            {admin.nickname || admin.name}님이 보는 데모 데이터예요. 실제
            계정·Firestore·알림에는 저장되지 않습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="rounded-lg border border-[#d6d1ff] bg-white px-3 py-1.5 text-xs font-extrabold text-[#6a63c9] transition hover:bg-[#f1eeff]"
        >
          관리자로 돌아가기
        </button>
      </div>
      {page}
    </AppShell>
  )
}

function PreviewUnavailable({
  view,
  onNavigate,
}: {
  view: View
  onNavigate: (view: View) => void
}) {
  const label =
    view === 'rooms'
      ? '스터디 룸'
      : view === 'leaderboard'
        ? '포인트 순위'
        : '부모님 연결'
  return (
    <section className={`${panelClass} p-8 text-center`}>
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#f1eeff] text-xl">
        ◌
      </div>
      <h2 className="mt-4 text-lg font-extrabold text-[#3d3a55]">
        {label}은 미리보기에서 열 수 없어요
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#8b88a3]">
        이 화면은 실제 Firebase 연결이 필요한 기능이에요. 학생 계정으로
        로그인하면 스터디 룸·순위·가족 연결을 실제로 사용할 수 있습니다.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="rounded-xl bg-[#6f68e8] px-4 py-2 text-sm font-extrabold text-white transition hover:bg-[#5f57c8]"
        >
          미리보기 홈으로
        </button>
        <button
          type="button"
          onClick={() => onNavigate('plans')}
          className="rounded-xl border border-[#e4e0f0] bg-white px-4 py-2 text-sm font-extrabold text-[#77738f] transition hover:bg-[#faf9ff]"
        >
          공부 계획 보기
        </button>
      </div>
    </section>
  )
}
