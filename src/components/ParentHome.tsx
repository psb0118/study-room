import type { PlannerApi } from '../hooks/usePlanner'
import {
  formatDuration,
  sortPlans,
  subjectMeta,
  todayKey,
  weeklyReport,
} from '../lib/planner'
import { weeklyGoalRows } from '../lib/goals'
import { completedPoints, levelInfo, pointsForPlan } from '../lib/points'
import type { UserProfile } from '../types'
import type { View } from './AppShell'
import { Avatar } from './Avatar'
import { PointsCard } from './PointsCard'
import {
  EmptyState,
  PageHeader,
  StatCard,
  StatusBadge,
  ghostButton,
  panelClass,
  primaryButton,
} from './ui'

export function ParentWelcome({
  parentName,
  onNavigate,
}: {
  parentName: string
  onNavigate: (view: View) => void
}) {
  return (
    <div>
      <PageHeader
        eyebrow="PARENT DASHBOARD"
        title={`${parentName}님, 자녀와 연결해 주세요`}
        description="자녀의 연결 코드를 입력하면 공부 일정과 진도를 함께 관리할 수 있어요."
      />
      <section className={`${panelClass} p-6 sm:p-8`}>
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#f1eeff] to-[#e8f8f0] text-3xl">
            🌿
          </div>
          <h2 className="mt-4 text-xl font-extrabold text-[#3d3a55]">
            자녀의 6자리 코드가 필요해요
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#8b88a3]">
            자녀가 하루결의 <strong>부모님 연결</strong> 화면에서 코드를
            확인할 수 있어요. 코드를 입력하면 부모님 계정과 안전하게
            연결됩니다.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('family')}
            className={`${primaryButton} mt-5`}
          >
            자녀 연결하러 가기
          </button>
        </div>
      </section>
    </div>
  )
}

export function ReportStat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-xl bg-[#faf9ff] px-3 py-2.5">
      <div className="text-[11px] font-bold text-[#8b88a3]">{label}</div>
      <div className="mt-1 text-lg font-extrabold text-[#3d3a55]">
        {value}
      </div>
      <div className="mt-0.5 text-[10px] text-[#a8a5bb]">{hint}</div>
    </div>
  )
}

export function ParentHome({
  parentName,
  child,
  planner,
  loading,
  onNavigate,
}: {
  parentName: string
  child: UserProfile | null
  planner: PlannerApi
  loading: boolean
  onNavigate: (view: View) => void
}) {
  if (loading) {
    return (
      <div>
        <PageHeader
          eyebrow={`PARENT VIEW · ${parentName}`}
          title="자녀의 공부 현황"
          description="자녀의 계획과 기록을 불러오고 있어요."
        />
        <section className={`${panelClass} p-10 text-center text-sm text-[#8b88a3]`}>
          불러오는 중…
        </section>
      </div>
    )
  }

  const today = todayKey()
  const todayPlans = sortPlans(planner.plans.filter((p) => p.plannedDate === today))
  const completed = todayPlans.filter((p) => p.status === 'completed')
  const targetMinutes = todayPlans.reduce((sum, p) => sum + p.targetMinutes, 0)
  const points = levelInfo(completedPoints(planner.plans))
  const report = weeklyReport(planner.plans, planner.records, today)
  const goalRows = weeklyGoalRows(
    planner.subjects,
    child?.weeklyGoals ?? {},
    planner.records,
  )
  const childName = child?.name ?? '자녀'

  return (
    <div>
      <PageHeader
        eyebrow={`PARENT VIEW · ${parentName}`}
        title={`${childName}님의 공부 현황`}
        description="부모님은 일정을 추가·삭제하거나 완료를 취소할 수 있어요."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate('schedule')}
              className={ghostButton}
            >
              시간표 보기
            </button>
            <button
              type="button"
              onClick={() => onNavigate('plans')}
              className={primaryButton}
            >
              일정 관리
            </button>
          </div>
        }
      />

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PointsCard points={points.points} label={`${childName} 포인트`} />
        </div>
        <section className={`${panelClass} flex items-center gap-3 p-5`}>
          <Avatar
            name={childName}
            photo={child?.photo || undefined}
            size={44}
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-extrabold text-[#3d3a55]">
              {childName}
            </div>
            <div className="mt-0.5 text-xs text-[#8b88a3]">
              {child?.email || '연결된 자녀'}
            </div>
            <div className="mt-1 text-[11px] font-bold text-[#6a63c9]">
              Lv.{points.level} {points.title}
            </div>
          </div>
        </section>
      </div>

      <section className={`${panelClass} mb-4 p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-extrabold tracking-[-0.025em] text-[#3d3a55]">
              이번 주 리포트
            </h2>
            <p className="mt-1 text-xs text-[#8b88a3]">
              월요일부터 오늘까지의 완료율과 공부 기록이에요.
            </p>
          </div>
          <span className="rounded-full bg-[#f1eeff] px-2.5 py-1 text-[11px] font-extrabold text-[#6a63c9]">
            {report.completedPlans}/{report.totalPlans} 완료
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ReportStat
            label="완료율"
            value={`${report.completionRate}%`}
            hint={`목표 ${report.targetMinutes}분`}
          />
          <ReportStat
            label="공부 시간"
            value={formatDuration(report.studyMs)}
            hint="기록 기준"
          />
          <ReportStat
            label="연속 학습"
            value={`${report.streak}일`}
            hint="현재 스트릭"
          />
          <ReportStat
            label="놓친 계획"
            value={`${report.missed}개`}
            hint="이번 주 지난 일정"
          />
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f1eef9]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#8d86f5] to-[#b9b4ff] transition-all"
            style={{ width: `${report.completionRate}%` }}
          />
        </div>
      </section>

      {goalRows.length > 0 && (
        <section className={`${panelClass} mb-4 p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-extrabold tracking-[-0.025em] text-[#3d3a55]">
                주간 목표
              </h2>
              <p className="mt-1 text-xs text-[#8b88a3]">
                자녀가 설정한 과목별 목표와 이번 주 기록이에요.
              </p>
            </div>
            <span className="rounded-full bg-[#f1eeff] px-2.5 py-1 text-[11px] font-extrabold text-[#6a63c9]">
              {goalRows.length}개 과목
            </span>
          </div>
          <div className="mt-4 space-y-4">
            {goalRows.map((row) => (
              <div key={row.subjectId}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-2 font-bold text-[#5f5c78]">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                    {row.name}
                  </span>
                  <span className="text-[#8b88a3]">
                    {formatDuration(row.studiedMs)} / {row.targetMinutes}분 ·{' '}
                    <strong className="text-[#6f68e8]">{row.progress}%</strong>
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#f1eef9]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${row.progress}%`,
                      backgroundColor: row.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="오늘 계획"
          value={`${completed.length}/${todayPlans.length}`}
          hint={todayPlans.length ? '완료한 일정' : '오늘 일정이 없어요'}
        />
        <StatCard
          label="오늘 목표"
          value={`${targetMinutes}분`}
          hint="계획된 공부 시간"
        />
        <StatCard
          label="모은 포인트"
          value={`${points.points}P`}
          hint="완료한 계획 기준"
          accent
        />
        <StatCard
          label="현재 레벨"
          value={`Lv.${points.level}`}
          hint={points.title}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className={`${panelClass} p-5 lg:col-span-2`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-extrabold tracking-[-0.025em] text-[#3d3a55]">
                오늘의 일정
              </h2>
              <p className="mt-1 text-xs text-[#8b88a3]">
                체크를 누르면 완료, 다시 누르면 완료 취소예요.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('plans')}
              className="shrink-0 text-xs font-bold text-[#7c74f0] transition hover:text-[#655de0]"
            >
              전체 보기 →
            </button>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-[#8b88a3]">
              자녀의 일정을 불러오는 중…
            </p>
          ) : todayPlans.length > 0 ? (
            <ul className="space-y-2">
              {todayPlans.map((plan) => {
                const subject = subjectMeta(plan.subjectId, planner.subjects)
                const done = plan.status === 'completed'
                const earned = pointsForPlan(plan.targetMinutes)
                return (
                  <li
                    key={plan.id}
                    className="flex items-center gap-3 rounded-[13px] border border-[#f1eef9] bg-white px-3.5 py-3 transition hover:border-[#d8d3e8]"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        void planner.setPlanStatus(
                          plan.id,
                          done ? 'planned' : 'completed',
                        )
                      }
                      aria-label={done ? '완료 취소' : '완료 표시'}
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[11px] transition ${
                        done
                          ? 'border-[#ccecdd] bg-[#e8f8f0] text-[#3f9f7f]'
                          : 'border-[#e4e0f0] bg-white text-transparent hover:border-[#8d86f5]'
                      }`}
                    >
                      ✓
                    </button>
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: subject.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className={`truncate text-sm font-bold ${
                          done
                            ? 'text-[#a8a5bb] line-through'
                            : 'text-[#3d3a55]'
                        }`}
                      >
                        {plan.title}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-[#a8a5bb]">
                        {subject.name} ·{' '}
                        {plan.startTime
                          ? `${plan.startTime}${plan.endTime ? `–${plan.endTime}` : ''}`
                          : '시간 미정'}{' '}
                        · {earned}P
                      </div>
                    </div>
                    <StatusBadge status={plan.status} />
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `“${plan.title}” 일정을 삭제할까요?`,
                          )
                        ) {
                          void planner.deletePlan(plan.id)
                        }
                      }}
                      aria-label="일정 삭제"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#f7f4ff] text-[#d96a7c] transition hover:bg-[#ffeff3]"
                    >
                      ⌫
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyState
              icon="✦"
              title="오늘은 아직 일정이 없어요"
              description="자녀를 위해 작은 공부 일정을 추가해 보세요."
              action={
                <button
                  type="button"
                  onClick={() => onNavigate('plans')}
                  className={primaryButton}
                >
                  일정 추가
                </button>
              }
            />
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <section className={`${panelClass} p-5`}>
            <h2 className="text-sm font-extrabold text-[#3d3a55]">
              부모님 관리 안내
            </h2>
            <ul className="mt-3 space-y-3 text-xs leading-relaxed text-[#706d8a]">
              <li>✓ 자녀가 잊은 일정을 대신 추가할 수 있어요.</li>
              <li>✓ 완료한 일정의 체크를 해제하면 포인트도 함께 조정돼요.</li>
              <li>✓ 불필요한 일정은 삭제할 수 있어요.</li>
            </ul>
            <button
              type="button"
              onClick={() => onNavigate('leaderboard')}
              className={`${ghostButton} mt-4 w-full`}
            >
              포인트 순위 보기
            </button>
          </section>
          <section className={`${panelClass} p-5`}>
            <p className="text-xs leading-relaxed text-[#8b88a3]">
              자녀의 공부 기록과 통계는 자녀가 스터디 룸이나 직접 기록을
              추가할 때 쌓여요. 부모님은 완료 상태와 계획을 관리할 수
              있습니다.
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}
