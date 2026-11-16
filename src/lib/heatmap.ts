import type { StudyRecord } from '../types'
import { dailyTotals, startOfWeek, todayKey } from './planner'
import { addDays } from './streak'

export type StudyHeatmapLevel = 0 | 1 | 2 | 3 | 4

export interface StudyHeatmapDay {
  key: string
  ms: number
  level: StudyHeatmapLevel
  future: boolean
}

export interface StudyHeatmapWeek {
  days: StudyHeatmapDay[]
}

const MINUTE_MS = 60_000

/** 하루 공부 시간을 5단계 색상으로 나눈다. */
export function studyHeatmapLevel(ms: number): StudyHeatmapLevel {
  if (!Number.isFinite(ms) || ms <= 0) return 0
  if (ms < 30 * MINUTE_MS) return 1
  if (ms < 60 * MINUTE_MS) return 2
  if (ms < 120 * MINUTE_MS) return 3
  return 4
}

/**
 * 오늘이 포함된 주를 마지막 열로 두고, 월요일 시작 기준의
 * 최근 주간 히트맵을 만든다. 미래 날짜도 열을 맞추기 위해 포함한다.
 */
export function studyHeatmap(
  records: StudyRecord[],
  weeks = 12,
  today = todayKey(),
): StudyHeatmapWeek[] {
  const totals = dailyTotals(records)
  const weekCount = Math.max(1, Math.min(52, Math.trunc(weeks) || 1))
  const start = addDays(startOfWeek(today), -(weekCount - 1) * 7)

  return Array.from({ length: weekCount }, (_, weekIndex) => ({
    days: Array.from({ length: 7 }, (_, dayIndex) => {
      const key = addDays(start, weekIndex * 7 + dayIndex)
      const ms = Math.max(0, totals[key] ?? 0)
      return {
        key,
        ms,
        level: studyHeatmapLevel(ms),
        future: key > today,
      }
    }),
  }))
}
