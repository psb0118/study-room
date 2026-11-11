import { useState } from 'react'
import type { PlannerApi } from '../hooks/usePlanner'
import {
  calcStreak,
  dailyTotals,
  formatDuration,
  recentDays,
  sortPlans,
  subjectMeta,
  todayKey,
} from '../lib/planner'
import { completedPoints, levelInfo, pointsForPlan } from '../lib/points'
import type { StudyPlan } from '../types'
import type { View } from './AppShell'
import { FocusTimer } from './FocusTimer'
import { Avatar } from './Avatar'
import { PointsCard } from './PointsCard'
import {
  EmptyState,
  PageHeader,
  StatCard,
  StatusBadge,
  WeekBars,
  ghostButton,
  panelClass,
  primaryButton,
} from './ui'

interface DashboardProps {
  name: string
  photo?: string
  planner: PlannerApi
  onNavigate: (view: View) => void
}

export function Dashboard({
  name,
  photo,
  planner,
  onNavigate,
}: DashboardProps) {
  const { subjects, plans, records, loading } = planner
  const [todayLabel] = useState(() =>
    new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }).format(new Date()),
  )
  const [focusPlan, setFocusPlan] = useState<StudyPlan | null>(null)
  const today = todayKey()
  const todayPlans = sortPlans(plans.filter((p) => p.plannedDate === today))
  const completed = todayPlans.filter((p) => p.status === 'completed').length
  const days = dailyTotals(records)
  const streak = calcStreak(days, today)
  const todayMs = days[today] ?? 0
  const targetMs = todayPlans.reduce(
    (sum, p) => sum + p.targetMinutes * 60_000,
    0,
  )
  const progress = targetMs
    ? Math.min(100, Math.round((todayMs / targetMs) * 100))
    : 0
  const week = recentDays(7, days, today)
  const points = levelInfo(completedPoints(plans))

  return (
    <div>
      <PageHeader
        eyebrow={`TODAY · ${todayLabel}`}
        title={`${name}님, 오늘도 차근차근 공부해요`}
        description="계획을 완료할 때마다 포인트가 쌓이고, 100P마다 레벨이 올라가요."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate('plans')}
              className={ghostButton}
            >
              계획 관리
            </button>
            <button
              type="button"
              onClick={() => onNavigate('rooms')}
              className={primaryButton}
            >
              스터디 룸 입장
            </button>
          </div>
        }
      />

      <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="오늘 공부"
          value={formatDuration(todayMs)}
          hint={loading ? '불러오는 중…' : `목표 ${formatDuration(targetMs)}`}
        />
        <StatCard
          label="연속 학습"
          value={`${streak.streak}일`}
          hint={`최장 ${streak.longest}일`}
          accent
        />
        <StatCard
          label="포인트"
          value={`${points.points}P`}
          hint={`Lv.${points.level} · ${points.title}`}
        />
        <StatCard
          label="오늘 계획"
          value={`${completed}/${todayPlans.length}`}
          hint={
            todayPlans.length > 0
              ? `${Math.round((completed / todayPlans.length) * 100)}% 완료`
              : '계획을 세워보세요'
          }
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <section className={`${panelClass} p-5`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-extrabold tracking-[-0.025em] text-[#3d3a55]">
                  오늘의 공부 계획
                </h2>
                <p className="mt-1 text-xs text-[#a8a5bb]">
                  체크하면 완료되고 포인트가 바로 반영돼요.
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

            {todayPlans.length > 0 ? (
              <ul className="space-y-2">
                {todayPlans.map((plan) => {
                  const subject = subjectMeta(plan.subjectId, subjects)
                  const done = plan.status === 'completed'
                  const reward = pointsForPlan(plan.targetMinutes)
                  return (
                    <li
                      key={plan.id}
                      className="flex items-center gap-3 rounded-[13px] border border-[#f1eef9] bg-white px-3.5 py-3 transition hover:border-[#d8d3e8] hover:shadow-[0_5px_15px_rgba(61,58,85,0.04)]"
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
                          · 목표 {plan.targetMinutes}분
                        </div>
                      </div>
                      <span
                        className={`hidden shrink-0 text-[11px] font-extrabold sm:block ${
                          done ? 'text-[#3f9f7f]' : 'text-[#8b88a3]'
                        }`}
                      >
                        {done ? `+${reward}P` : `${reward}P`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFocusPlan(plan)}
                        className="shrink-0 rounded-md border border-[#e6e1ff] bg-[#f7f4ff] px-2 py-1 text-[11px] font-extrabold text-[#6a63c9] transition hover:border-[#b9b4ff] hover:bg-[#f1eeff]"
                      >
                        집중
                      </button>
                      <StatusBadge status={plan.status} />
                    </li>
                  )
                })}
              </ul>
            ) : (
              <EmptyState
                icon="✦"
                title="오늘은 아직 비어 있어요"
                description="작은 계획 하나부터 시작해볼까요?"
                action={
                  <button
                    type="button"
                    onClick={() => onNavigate('plans')}
                    className={primaryButton}
                  >
                    계획 추가
                  </button>
                }
              />
            )}
          </section>

          <section className={`${panelClass} p-5`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-extrabold tracking-[-0.025em] text-[#3d3a55]">
                  최근 7일 공부 시간
                </h2>
                <p className="mt-1 text-xs text-[#a8a5bb]">
                  스터디 룸 집중과 직접 기록을 합산합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('stats')}
                className="shrink-0 text-xs font-bold text-[#7c74f0] transition hover:text-[#655de0]"
              >
                통계 →
              </button>
            </div>
            <WeekBars days={week} />
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <PointsCard points={points.points} />

          <section className={`${panelClass} p-5`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold tracking-[-0.025em] text-[#3d3a55]">
                오늘 진행률
              </h2>
              <strong className="text-lg font-extrabold text-[#6f68e8]">
                {progress}%
              </strong>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#f1eef9]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#8d86f5] to-[#b9b4ff] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-[#a8a5bb]">
              <span>공부 {formatDuration(todayMs)}</span>
              <span>목표 {formatDuration(targetMs)}</span>
            </div>
            {targetMs === 0 && (
              <p className="mt-3 text-xs leading-relaxed text-[#a8a5bb]">
                오늘 계획을 추가하면 목표 대비 진행률을 계산해 드려요.
              </p>
            )}
          </section>

          <section className={`${panelClass} p-5`}>
            <div className="flex items-center gap-3">
              <Avatar name={name} photo={photo} size={42} />
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold text-[#3d3a55]">
                  {name}
                </div>
                <div className="text-xs text-[#a8a5bb]">
                  오늘도 꾸준히 쌓이는 중
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={() => onNavigate('leaderboard')}
                className="flex items-center justify-between rounded-lg border border-[#f1eef9] bg-white px-3 py-2.5 text-left text-sm font-semibold text-[#5f5c78] transition hover:border-[#d8d3e8] hover:bg-[#fbf9ff]"
              >
                포인트 순위 <span className="text-[#b8b5c9]">→</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('records')}
                className="flex items-center justify-between rounded-lg border border-[#f1eef9] bg-white px-3 py-2.5 text-left text-sm font-semibold text-[#5f5c78] transition hover:border-[#d8d3e8] hover:bg-[#fbf9ff]"
              >
                공부 기록 보기 <span className="text-[#b8b5c9]">→</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('schedule')}
                className="flex items-center justify-between rounded-lg border border-[#f1eef9] bg-white px-3 py-2.5 text-left text-sm font-semibold text-[#5f5c78] transition hover:border-[#d8d3e8] hover:bg-[#fbf9ff]"
              >
                주간 시간표 <span className="text-[#b8b5c9]">→</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('family')}
                className="flex items-center justify-between rounded-lg border border-[#f1eef9] bg-white px-3 py-2.5 text-left text-sm font-semibold text-[#5f5c78] transition hover:border-[#d8d3e8] hover:bg-[#fbf9ff]"
              >
                부모님 연결 <span className="text-[#b8b5c9]">→</span>
              </button>
            </div>
          </section>
        </div>
      </div>
      {focusPlan && (
        <FocusTimer
          key={focusPlan.id}
          plan={focusPlan}
          planner={planner}
          onClose={() => setFocusPlan(null)}
        />
      )}
    </div>
  )
}
