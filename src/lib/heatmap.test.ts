import { describe, expect, it } from 'vitest'
import type { StudyRecord } from '../types'
import { studyHeatmap, studyHeatmapLevel } from './heatmap'

const record = (dateKey: string, durationMs: number): StudyRecord => ({
  id: dateKey,
  subjectId: 'math',
  planId: '',
  dateKey,
  source: 'manual',
  startedAt: 1,
  endedAt: 2,
  durationMs,
  memo: '',
  createdAt: 2,
})

describe('study heatmap', () => {
  it('maps daily study time to five levels', () => {
    expect(studyHeatmapLevel(0)).toBe(0)
    expect(studyHeatmapLevel(10 * 60_000)).toBe(1)
    expect(studyHeatmapLevel(30 * 60_000)).toBe(2)
    expect(studyHeatmapLevel(60 * 60_000)).toBe(3)
    expect(studyHeatmapLevel(120 * 60_000)).toBe(4)
  })

  it('aligns weeks from Monday and marks future days', () => {
    const weeks = studyHeatmap(
      [record('2026-11-11', 45 * 60_000)],
      2,
      '2026-11-11',
    )

    expect(weeks).toHaveLength(2)
    expect(weeks[0].days.map((day) => day.key)).toEqual([
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
    ])
    expect(weeks[1].days[2]).toMatchObject({
      key: '2026-11-11',
      ms: 45 * 60_000,
      level: 2,
      future: false,
    })
    expect(weeks[1].days[3].future).toBe(true)
  })

  it('keeps an empty grid when there are no records', () => {
    const weeks = studyHeatmap([], 12, '2026-11-11')
    expect(weeks).toHaveLength(12)
    expect(weeks.flatMap((week) => week.days).every((day) => day.ms === 0)).toBe(
      true,
    )
  })
})
