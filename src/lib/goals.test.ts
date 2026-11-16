import { describe, expect, it } from 'vitest'
import {
  normalizeWeeklyGoals,
  suggestWeeklyGoals,
  weeklyGoalRows,
  weeklyGoalSummary,
} from './goals'
import type { StudyRecord, Subject } from '../types'

const subject: Subject = {
  id: 'math',
  name: '수학',
  color: '#7c74f0',
  archived: false,
  createdAt: 1,
  updatedAt: 2,
}

const record: StudyRecord = {
  id: 'record',
  subjectId: 'math',
  planId: '',
  dateKey: '2026-11-11',
  source: 'manual',
  startedAt: 1,
  endedAt: 2,
  durationMs: 30 * 60_000,
  memo: '',
  createdAt: 2,
}

function makeRecord(dateKey: string, durationMs: number): StudyRecord {
  return { ...record, id: `record-${dateKey}`, dateKey, durationMs }
}

describe('weekly goals', () => {
  it('keeps positive minute values and ignores invalid entries', () => {
    expect(
      normalizeWeeklyGoals({
        math: 120.4,
        english: -1,
        science: 'nope',
        empty: 0,
      }),
    ).toEqual({ math: 120 })
  })

  it('calculates weekly progress from records', () => {
    const rows = weeklyGoalRows(
      [subject],
      { math: 60 },
      [record],
      '2026-11-11',
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].studiedMs).toBe(30 * 60_000)
    expect(rows[0].progress).toBe(50)
  })

  it('summarizes overall goal pace for the week', () => {
    const summary = weeklyGoalSummary(
      [subject],
      { math: 180 },
      [
        record,
        {
          ...record,
          id: 'record-2',
          dateKey: '2026-11-10',
          durationMs: 90 * 60_000,
        },
      ],
      '2026-11-11',
    )

    expect(summary).toEqual({
      targetMinutes: 180,
      targetMs: 180 * 60_000,
      studiedMs: 120 * 60_000,
      progress: 67,
      remainingMs: 60 * 60_000,
      expectedProgress: 43,
      paceDelta: 24,
    })
  })

  it('returns no summary when there are no active goals', () => {
    expect(weeklyGoalSummary([subject], {}, [record], '2026-11-11')).toBeNull()
  })

  it('suggests goals from the previous four full weeks', () => {
    const records = [
      makeRecord('2026-10-13', 60 * 60_000),
      makeRecord('2026-10-20', 120 * 60_000),
      makeRecord('2026-10-27', 60 * 60_000),
      makeRecord('2026-11-03', 120 * 60_000),
      // 현재 주 기록은 제안 평균에 넣지 않는다.
      makeRecord('2026-11-11', 600 * 60_000),
    ]
    expect(suggestWeeklyGoals([subject], records, '2026-11-11')).toEqual({
      math: 90,
    })
    expect(suggestWeeklyGoals([subject], [], '2026-11-11')).toEqual({})
  })
})
