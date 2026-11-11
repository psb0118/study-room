import { useState } from 'react'
import type { PlannerApi } from '../hooks/usePlanner'
import {
  formatDateKey,
  sortPlans,
  startOfWeek,
  subjectMeta,
  todayKey,
} from '../lib/planner'
import { pointsForPlan } from '../lib/points'
import { addDays } from '../lib/streak'
import type { View } from './AppShell'
import {
  PageHeader,
  ghostButton,
  panelClass,
  primaryButton,
} from './ui'

interface ScheduleProps {
  planner: PlannerApi
  onNavigate: (view: View) => void
}

export function Schedule({ planner, onNavigate }: ScheduleProps) {
  const [offset, setOffset] = useState(0)
  const today = todayKey()
  const monday = addDays(startOfWeek(today), offset * 7)
  const dates = Array.from({ length: 7 }, (_, i) => addDays(monday, i))

  return (
    <div>
      <PageHeader
        eyebrow="WEEKLY SCHEDULE"
        title="주간 시간표"
        description="계획이 겹쳐도 카드를 세로로 정리해 정보가 가려지지 않도록 보여줍니다."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOffset((v) => v - 1)}
              className={ghostButton}
            >
              ‹ 이전
            </button>
            <button
              type="button"
              onClick={() => setOffset(0)}
              className={ghostButton}
            >
              이번 주
            </button>
            <button
              type="button"
              onClick={() => setOffset((v) => v + 1)}
              className={ghostButton}
            >
              다음 ›
            </button>
          </div>
        }
      />

      <section className={`${panelClass} p-4`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-extrabold text-[#3d3a55]">
            {formatDateKey(monday, { month: 'long', day: 'numeric' })} –{' '}
            {formatDateKey(dates[6], { month: 'long', day: 'numeric' })}
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('plans')}
            className={primaryButton}
          >
            계획 추가
          </button>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="grid min-w-[900px] grid-cols-7 gap-2">
            {dates.map((key) => {
              const plans = sortPlans(
                planner.plans.filter((p) => p.plannedDate === key),
              )
              const isToday = key === today
              return (
                <section
                  key={key}
                  className={`min-h-[320px] rounded-xl border p-2 ${
                    isToday
                      ? 'border-[#d6d1ff] bg-[#f7f4ff]'
                      : 'border-[#f0edf9] bg-[#fbf9ff]'
                  }`}
                >
                  <div className="mb-2 flex items-baseline justify-between px-1">
                    <strong
                      className={`text-xs ${
                        isToday ? 'text-[#7c74f0]' : 'text-[#5f5c78]'
                      }`}
                    >
                      {formatDateKey(key, { weekday: 'short' })}
                    </strong>
                    <span className="text-[10px] text-[#a8a5bb]">
                      {new Date(`${key}T12:00:00`).getDate()}일
                    </span>
                  </div>

                  {plans.length > 0 ? (
                    plans.map((plan) => {
                      const subject = subjectMeta(plan.subjectId, planner.subjects)
                      const done = plan.status === 'completed'
                      const reward = pointsForPlan(plan.targetMinutes)
                      return (
                        <article
                          key={plan.id}
                          className={`mb-2 rounded-lg border-l-[3px] p-2.5 shadow-[0_3px_8px_rgba(61,58,85,0.04)] ${
                            done ? 'bg-[#f5fbf8]' : 'bg-white'
                          }`}
                          style={{ borderLeftColor: subject.color }}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0 truncate text-[10px] font-bold text-[#9692ad]">
                              {plan.startTime
                                ? `${plan.startTime}${plan.endTime ? ` – ${plan.endTime}` : ''}`
                                : '시간 미정'}{' '}
                              · {subject.name}
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                void planner.setPlanStatus(
                                  plan.id,
                                  done ? 'planned' : 'completed',
                                )
                              }
                              aria-label={done ? '완료 취소' : '완료 표시'}
                              className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[10px] transition ${
                                done
                                  ? 'border-[#ccecdd] bg-[#e8f8f0] text-[#3f9f7f]'
                                  : 'border-[#e4e0f0] bg-white text-[#b8b5c9] hover:border-[#8d86f5] hover:text-[#6f68e8]'
                              }`}
                            >
                              ✓
                            </button>
                          </div>
                          <div
                            className={`mt-0.5 text-xs leading-snug font-extrabold ${
                              done
                                ? 'text-[#a8a5bb] line-through'
                                : 'text-[#3d3a55]'
                            }`}
                          >
                            {plan.title}
                          </div>
                          <div className="mt-1 flex items-center justify-between gap-1 text-[10px] text-[#a8a5bb]">
                            <span>목표 {plan.targetMinutes}분</span>
                            <span
                              className={
                                done
                                  ? 'font-bold text-[#3f9f7f]'
                                  : 'text-[#8b88a3]'
                              }
                            >
                              {done ? `+${reward}P` : `${reward}P`}
                            </span>
                          </div>
                        </article>
                      )
                    })
                  ) : (
                    <div className="px-1 py-5 text-center text-[10px] text-[#aaa7ba]">
                      계획 없음
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
