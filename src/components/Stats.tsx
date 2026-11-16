import { useMemo, useState } from 'react'
import type { PlannerApi } from '../hooks/usePlanner'
import {
  studyHeatmap,
  type StudyHeatmapLevel,
} from '../lib/heatmap'
import {
  dailyTotals,
  formatDateKey,
  formatDuration,
  recentDays,
  recordsInPeriod,
  subjectMeta,
  subjectTotals,
  todayKey,
  totalDuration,
  weeklyReport,
  withinPeriod,
  type Period,
} from '../lib/planner'
import { addDays } from '../lib/streak'
import {
  EmptyState,
  PageHeader,
  PeriodTabs,
  StatCard,
  WeekBars,
  panelClass,
} from './ui'

const HEATMAP_LEVEL_CLASSES: Record<StudyHeatmapLevel, string> = {
  0: 'bg-[#f1eef9]',
  1: 'bg-[#e4e0ff]',
  2: 'bg-[#c9c2ff]',
  3: 'bg-[#a9a2fb]',
  4: 'bg-[#7c74f0]',
}

const HEATMAP_LEGEND_LEVELS: StudyHeatmapLevel[] = [1, 2, 3, 4]

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
    .reduce((sum, p) => sum + Math.max(0, p.targetMinutes) * 60_000, 0)
  const progress = targetMs
    ? Math.min(100, Math.round((total / targetMs) * 100))
    : 0
  const week = recentDays(7, dailyTotals(planner.records))
  const max = Math.max(1, top?.[1] ?? 0)
  const today = todayKey()
  const heatmap = studyHeatmap(planner.records, 12, today)
  const hasHeatmapRecords = heatmap.some((week) =>
    week.days.some((day) => day.ms > 0),
  )
  const report = weeklyReport(planner.plans, planner.records, today)
  const previousWeekMs = totalDuration(
    recordsInPeriod(planner.records, 'week', addDays(today, -7)),
  )
  const weekDeltaMs = report.studyMs - previousWeekMs
  const weekRecords = recordsInPeriod(planner.records, 'week', today)
  const weekTop = Object.entries(subjectTotals(weekRecords)).sort(
    (a, b) => b[1] - a[1],
  )[0]
  const missedPlans = planner.plans
    .filter(
      (plan) =>
        plan.plannedDate >= report.start &&
        plan.plannedDate < today &&
        plan.status !== 'completed',
    )
    .sort((a, b) =>
      `${a.plannedDate}|${a.startTime}`.localeCompare(
        `${b.plannedDate}|${b.startTime}`,
      ),
    )
    .slice(0, 3)

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

      <section className={`${panelClass} mb-4 p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-extrabold tracking-[0.08em] text-[#7c74f0] uppercase">
              WEEKLY REVIEW
            </p>
            <h2 className="mt-1 text-base font-extrabold text-[#3d3a55]">
              이번 주 회고
            </h2>
            <p className="mt-1 text-xs text-[#a8a5bb]">
              {formatDateKey(report.start, {
                month: 'long',
                day: 'numeric',
              })}{' '}
              –{' '}
              {formatDateKey(report.end, {
                month: 'long',
                day: 'numeric',
              })}
              의 계획과 기록을 돌아봐요.
            </p>
          </div>
          <span className="rounded-full bg-[#f1eeff] px-2.5 py-1 text-[11px] font-extrabold text-[#6a63c9]">
            {report.completedPlans}/{report.totalPlans} 완료
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-[#f1eef9] bg-[#faf9ff] px-3.5 py-3">
            <div className="text-[11px] font-bold text-[#a8a5bb]">완료율</div>
            <div className="mt-1 text-xl font-extrabold text-[#6f68e8]">
              {report.totalPlans ? `${report.completionRate}%` : '—'}
            </div>
          </div>
          <div className="rounded-xl border border-[#f1eef9] bg-[#faf9ff] px-3.5 py-3">
            <div className="text-[11px] font-bold text-[#a8a5bb]">
              이번 주 공부
            </div>
            <div className="mt-1 text-xl font-extrabold text-[#3d3a55]">
              {formatDuration(report.studyMs)}
            </div>
          </div>
          <div className="rounded-xl border border-[#f1eef9] bg-[#faf9ff] px-3.5 py-3">
            <div className="text-[11px] font-bold text-[#a8a5bb]">연속 학습</div>
            <div className="mt-1 text-xl font-extrabold text-[#3f9f7f]">
              {report.streak}일
            </div>
          </div>
          <div className="rounded-xl border border-[#f1eef9] bg-[#faf9ff] px-3.5 py-3">
            <div className="text-[11px] font-bold text-[#a8a5bb]">
              지난주 대비
            </div>
            <div
              className={`mt-1 text-xl font-extrabold ${
                weekDeltaMs > 0
                  ? 'text-[#3f9f7f]'
                  : weekDeltaMs < 0
                    ? 'text-[#b26a3f]'
                    : 'text-[#3d3a55]'
              }`}
            >
              {weekDeltaMs === 0
                ? '변화 없음'
                : `${weekDeltaMs > 0 ? '+' : '-'}${formatDuration(Math.abs(weekDeltaMs))}`}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[#f1eef9] bg-white px-3.5 py-3">
            <div className="text-[11px] font-bold text-[#a8a5bb]">
              가장 많이 공부한 과목
            </div>
            <div className="mt-1 text-sm font-extrabold text-[#3d3a55]">
              {weekTop
                ? `${subjectMeta(weekTop[0], planner.subjects).name} · ${formatDuration(weekTop[1])}`
                : '아직 기록이 없어요'}
            </div>
          </div>
          <div className="rounded-xl border border-[#f1eef9] bg-white px-3.5 py-3">
            <div className="text-[11px] font-bold text-[#a8a5bb]">
              다음 주로 이어갈 계획
            </div>
            {missedPlans.length > 0 ? (
              <ul className="mt-1 space-y-0.5 text-xs font-semibold text-[#5f5c78]">
                {missedPlans.map((plan) => (
                  <li key={plan.id} className="truncate">
                    · {plan.title}{' '}
                    <span className="font-normal text-[#a8a5bb]">
                      {formatDateKey(plan.plannedDate, {
                        month: 'numeric',
                        day: 'numeric',
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-1 text-xs font-semibold text-[#3f9f7f]">
                이번 주 놓친 계획이 없어요.
              </div>
            )}
          </div>
        </div>
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

      <section className={`${panelClass} mt-4 p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold text-[#3d3a55]">
              공부 잔디
            </h2>
            <p className="mt-0.5 text-xs text-[#a8a5bb]">
              최근 12주 동안의 하루 공부 시간이에요.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#a8a5bb]">
            <span>적음</span>
            {HEATMAP_LEGEND_LEVELS.map((level) => (
              <span
                key={level}
                className={`h-3 w-3 rounded-[3px] ${HEATMAP_LEVEL_CLASSES[level]}`}
              />
            ))}
            <span>많음</span>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto pb-1">
          <div
            role="img"
            aria-label="최근 12주 공부 잔디"
            className="flex min-w-max gap-1.5"
          >
            {heatmap.map((week) => (
              <div
                key={week.days[0]?.key}
                className="grid grid-rows-7 gap-1.5"
              >
                {week.days.map((day) => (
                  <div
                    key={day.key}
                    title={`${formatDateKey(day.key)} · ${formatDuration(day.ms)}`}
                    className={`h-3.5 w-3.5 rounded-[3px] ${
                      day.future
                        ? 'border border-dashed border-[#e9e5f5] bg-white'
                        : HEATMAP_LEVEL_CLASSES[day.level]
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#a8a5bb]">
          <span>월요일 시작 · 최근 12주</span>
          {!hasHeatmapRecords && <span>공부 기록이 쌓이면 잔디가 채워져요.</span>}
        </div>
      </section>
    </div>
  )
}
