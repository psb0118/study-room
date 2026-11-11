import { useMemo, useState } from 'react'
import type { PlannerApi } from '../hooks/usePlanner'
import {
  dailyTotals,
  formatDuration,
  recentDays,
  recordsInPeriod,
  subjectMeta,
  subjectTotals,
  totalDuration,
  withinPeriod,
  type Period,
} from '../lib/planner'
import {
  EmptyState,
  PageHeader,
  PeriodTabs,
  StatCard,
  WeekBars,
  panelClass,
} from './ui'

export function Stats({ planner }: { planner: PlannerApi }) {
  const [period, setPeriod] = useState<Period>('week')

  const records = useMemo(
    () => recordsInPeriod(planner.records, period),
    [planner.records, period],
  )
  const total = totalDuration(records)
  const dayCount = Object.values(dailyTotals(records)).filter((ms) => ms > 0)
    .length
  const totals = subjectTotals(records)
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1])
  const top = entries[0]
  const targetMs = planner.plans
    .filter((p) => withinPeriod(p.plannedDate, period))
    .reduce((sum, p) => sum + p.targetMinutes * 60_000, 0)
  const progress = targetMs
    ? Math.min(100, Math.round((total / targetMs) * 100))
    : 0
  const week = recentDays(7, dailyTotals(planner.records))
  const max = top?.[1] ?? 1

  return (
    <div>
      <PageHeader
        eyebrow="INSIGHTS"
        title="공부 통계"
        description="저장된 공부 기록만을 기준으로 계산해 계획·기록·통계가 어긋나지 않습니다."
      />

      <section className={`${panelClass} mb-4 p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold text-[#3d3a55]">기간 선택</h2>
            <p className="mt-0.5 text-xs text-[#a8a5bb]">원본 공부 기록 기준</p>
          </div>
          <PeriodTabs value={period} onChange={setPeriod} />
        </div>
      </section>

      <section className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="총 공부 시간" value={formatDuration(total)} />
        <StatCard label="공부한 날" value={`${dayCount}일`} />
        <StatCard
          label="가장 많이 공부한 과목"
          value={top ? subjectMeta(top[0], planner.subjects).name : '—'}
        />
        <StatCard
          label="목표 달성률"
          value={targetMs ? `${progress}%` : '—'}
          hint={
            targetMs
              ? `${formatDuration(total)} / ${formatDuration(targetMs)}`
              : '계획 목표 없음'
          }
          accent
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className={`${panelClass} p-5 lg:col-span-2`}>
          <div className="mb-4">
            <h2 className="text-sm font-extrabold text-[#3d3a55]">
              최근 7일 공부 시간
            </h2>
            <p className="mt-0.5 text-xs text-[#a8a5bb]">
              기간 선택과 무관하게 최근 7일을 보여줍니다.
            </p>
          </div>
          <WeekBars days={week} />
        </section>

        <section className={`${panelClass} p-5`}>
          <div className="mb-4">
            <h2 className="text-sm font-extrabold text-[#3d3a55]">
              과목별 공부 시간
            </h2>
            <p className="mt-0.5 text-xs text-[#a8a5bb]">선택한 기간</p>
          </div>
          {entries.length > 0 ? (
            <div className="space-y-3.5">
              {entries.map(([id, ms]) => {
                const subject = subjectMeta(id, planner.subjects)
                return (
                  <div key={id}>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                      <span className="min-w-0 flex-1 truncate text-[#5f5c78]">
                        {subject.name}
                      </span>
                      <span className="shrink-0 text-[#a8a5bb]">
                        {formatDuration(ms)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f1eef9]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round((ms / max) * 100)}%`,
                          backgroundColor: subject.color,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon="◌"
              title="표시할 기록이 없어요"
              description="공부 기록이 쌓이면 과목별 시간이 나타납니다."
            />
          )}
        </section>
      </div>
    </div>
  )
}
