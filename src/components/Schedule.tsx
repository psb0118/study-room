import { useState } from 'react'
import type { PlannerApi } from '../hooks/usePlanner'
import {
  formatDateKey,
  sortPlans,
  startOfWeek,
  subjectMeta,
  todayKey,
} from '../lib/planner'
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
          <h2 className="text-sm font-extrabold text-[#202538]">
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
                      ? 'border-[#b9c1fa] bg-[#f7f8ff]'
                      : 'border-[#e9ebf3] bg-[#fbfcff]'
                  }`}
                >
                  <div className="mb-2 flex items-baseline justify-between px-1">
                    <strong
                      className={`text-xs ${
                        isToday ? 'text-[#5969df]' : 'text-[#5f6579]'
                      }`}
                    >
                      {formatDateKey(key, { weekday: 'short' })}
                    </strong>
                    <span className="text-[10px] text-[#9498a7]">
                      {new Date(`${key}T12:00:00`).getDate()}일
                    </span>
                  </div>

                  {plans.length > 0 ? (
                    plans.map((plan) => {
                      const subject = subjectMeta(plan.subjectId, planner.subjects)
                      return (
                        <article
                          key={plan.id}
                          className="mb-2 rounded-lg border-l-[3px] bg-white p-2.5 shadow-[0_3px_8px_rgba(36,41,74,0.04)]"
                          style={{ borderLeftColor: subject.color }}
                        >
                          <div className="truncate text-[10px] font-bold text-[#9095a7]">
                            {plan.startTime
                              ? `${plan.startTime}${plan.endTime ? ` – ${plan.endTime}` : ''}`
                              : '시간 미정'}{' '}
                            · {subject.name}
                          </div>
                          <div className="mt-0.5 text-xs leading-snug font-extrabold text-[#202538]">
                            {plan.title}
                          </div>
                          <div className="mt-1 text-[10px] text-[#9498a7]">
                            목표 {plan.targetMinutes}분
                          </div>
                        </article>
                      )
                    })
                  ) : (
                    <div className="px-1 py-5 text-center text-[10px] text-[#a2a6b4]">
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
