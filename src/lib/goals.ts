import type { StudyRecord, Subject } from '../types'
import { recordsInPeriod, subjectTotals, todayKey } from './planner'

export const MAX_WEEKLY_GOAL_MINUTES = 7 * 24 * 60

/** 과목별 주간 목표(분)를 저장 가능한 형태로 정리한다. */
export function normalizeWeeklyGoals(value: unknown): Record<string, number> {
  const out: Record<string, number> = {}
  if (!value || typeof value !== 'object' || Array.isArray(value)) return out
  for (const [subjectId, raw] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (!subjectId) continue
    const minutes = Math.round(Number(raw))
    if (!Number.isFinite(minutes) || minutes <= 0) continue
    out[subjectId] = Math.min(MAX_WEEKLY_GOAL_MINUTES, minutes)
  }
  return out
}

export interface WeeklyGoalRow {
  subjectId: string
  name: string
  color: string
  targetMinutes: number
  studiedMs: number
  progress: number
}

/** 이번 주 과목별 목표와 실제 기록을 비교한다. */
export function weeklyGoalRows(
  subjects: Subject[],
  goals: Record<string, number>,
  records: StudyRecord[],
  today = todayKey(),
): WeeklyGoalRow[] {
  const totals = subjectTotals(recordsInPeriod(records, 'week', today))
  return subjects
    .filter((subject) => !subject.archived && (goals[subject.id] ?? 0) > 0)
    .map((subject) => {
      const targetMinutes = goals[subject.id] ?? 0
      const studiedMs = totals[subject.id] ?? 0
      return {
        subjectId: subject.id,
        name: subject.name,
        color: subject.color,
        targetMinutes,
        studiedMs,
        progress: targetMinutes
          ? Math.min(
              100,
              Math.round((studiedMs / (targetMinutes * 60_000)) * 100),
            )
          : 0,
      }
    })
}
