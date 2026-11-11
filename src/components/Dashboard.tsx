import { useState } from 'react'
import type { User } from 'firebase/auth'
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
import type { View } from './AppShell'
import { Avatar } from './Avatar'
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
  user: User
  planner: PlannerApi
  onNavigate: (view: View) => void
}

export function Dashboard({ user, planner, onNavigate }: DashboardProps) {
  const { subjects, plans, records, loading } = planner
  const [todayLabel] = useState(() =>
    new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }).format(new Date()),
  )
  const today = todayKey()
  const todayPlans = sortPlans(plans.filter((p) => p.plannedDate === today))
  const completed = todayPlans.filter((p) => p.status === 'completed').length
  const days = dailyTotals(records)
  const streak = calcStreak(days, today)
  const todayMs = days[today] ?? 0
  const totalMs = records.reduce((sum, r) => sum + r.durationMs, 0)
  const targetMs = todayPlans.reduce(
    (sum, p) => sum + p.targetMinutes * 60_000,
    0,
  )
  const progress = targetMs
    ? Math.min(100, Math.round((todayMs / targetMs) * 100))
    : 0
  const week = recentDays(7, days, today)

  return (
    <div>
      <PageHeader
        eyebrow={`TODAY · ${todayLabel}`}
        title={`${user.displayName ?? '익명'}님, 오늘도 함께 공부해요`}
        description="개인 계획을 세우고, 스터디 룸에서 실시간으로 집중하세요."
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
          label="오늘 계획"
          value={`${completed}/${todayPlans.length}`}
          hint={
            todayPlans.length > 0
              ? `${Math.round((completed / todayPlans.length) * 100)}% 완료`
              : '계획을 세워보세요'
          }
        />
        <StatCard
          label="누적 공부"
          value={formatDuration(totalMs)}
          hint={`${records.length}개의 기록`}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <section className={`${panelClass} p-5`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-extrabold tracking-[-0.025em] text-[#202538]">
                  오늘의 공부 계획
                </h2>
                <p className="mt-1 text-xs text-[#9498a7]">
                  체크해서 바로 완료 상태로 바꿀 수 있어요.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('plans')}
                className="shrink-0 text-xs font-bold text-[#5969df] transition hover:text-[#4555cc]"
              >
                전체 보기 →
              </button>
            </div>

            {todayPlans.length > 0 ? (
              <ul className="space-y-2">
                {todayPlans.map((plan) => {
                  const subject = subjectMeta(plan.subjectId, subjects)
                  const done = plan.status === 'completed'
                  return (
                    <li
                      key={plan.id}
                      className="flex items-center gap-3 rounded-[13px] border border-[#edf0f5] bg-white px-3.5 py-3 transition hover:border-[#d9deee] hover:shadow-[0_5px_15px_rgba(28,33,62,0.04)]"
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
                            ? 'border-[#b9e6d3] bg-[#e9f8f1] text-[#278b66]'
                            : 'border-[#dfe2ec] bg-white text-transparent hover:border-[#7d8af0]'
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
                            done ? 'text-[#9498a7] line-through' : 'text-[#202538]'
                          }`}
                        >
                          {plan.title}
                        </div>
                        <div className="mt-0.5 truncate text-[11px] text-[#9498a7]">
                          {subject.name} ·{' '}
                          {plan.startTime
                            ? `${plan.startTime}${plan.endTime ? `–${plan.endTime}` : ''}`
                            : '시간 미정'}{' '}
                          · 목표 {plan.targetMinutes}분
                        </div>
                      </div>
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
                <h2 className="text-[15px] font-extrabold tracking-[-0.025em] text-[#202538]">
                  최근 7일 공부 시간
                </h2>
                <p className="mt-1 text-xs text-[#9498a7]">
                  스터디 룸 집중과 직접 기록을 합산합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('stats')}
                className="shrink-0 text-xs font-bold text-[#5969df] transition hover:text-[#4555cc]"
              >
                통계 →
              </button>
            </div>
            <WeekBars days={week} />
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className={`${panelClass} p-5`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold tracking-[-0.025em] text-[#202538]">
                오늘 진행률
              </h2>
              <strong className="text-lg font-extrabold text-[#5969df]">
                {progress}%
              </strong>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#edf0f6]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#6675ea] to-[#8c98f5] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-[#9498a7]">
              <span>공부 {formatDuration(todayMs)}</span>
              <span>목표 {formatDuration(targetMs)}</span>
            </div>
            {targetMs === 0 && (
              <p className="mt-3 text-xs leading-relaxed text-[#9498a7]">
                오늘 계획을 추가하면 목표 대비 진행률을 계산해 드려요.
              </p>
            )}
          </section>

          <section className={`${panelClass} p-5`}>
            <div className="flex items-center gap-3">
              <Avatar
                name={user.displayName ?? '익명'}
                photo={user.photoURL ?? undefined}
                size={42}
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold text-[#202538]">
                  {user.displayName ?? '익명'}
                </div>
                <div className="text-xs text-[#9498a7]">
                  오늘도 꾸준히 쌓이는 중
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={() => onNavigate('records')}
                className="flex items-center justify-between rounded-lg border border-[#edf0f5] bg-white px-3 py-2.5 text-left text-sm font-semibold text-[#52586e] transition hover:border-[#d9deee] hover:bg-[#fafbfe]"
              >
                공부 기록 보기 <span className="text-[#b0b4c3]">→</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('subjects')}
                className="flex items-center justify-between rounded-lg border border-[#edf0f5] bg-white px-3 py-2.5 text-left text-sm font-semibold text-[#52586e] transition hover:border-[#d9deee] hover:bg-[#fafbfe]"
              >
                과목 관리 <span className="text-[#b0b4c3]">→</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('stats')}
                className="flex items-center justify-between rounded-lg border border-[#edf0f5] bg-white px-3 py-2.5 text-left text-sm font-semibold text-[#52586e] transition hover:border-[#d9deee] hover:bg-[#fafbfe]"
              >
                기간별 통계 <span className="text-[#b0b4c3]">→</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('schedule')}
                className="flex items-center justify-between rounded-lg border border-[#edf0f5] bg-white px-3 py-2.5 text-left text-sm font-semibold text-[#52586e] transition hover:border-[#d9deee] hover:bg-[#fafbfe]"
              >
                주간 시간표 <span className="text-[#b0b4c3]">→</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
