import { describe, expect, it } from 'vitest'
import type { StudyPlan } from '../types'
import {
  completedPoints,
  completedPointsSince,
  levelInfo,
  pointsForPlan,
} from './points'

const plan = (overrides: Partial<StudyPlan> = {}): StudyPlan => ({
  id: 'p1',
  subjectId: 's1',
  title: '테스트 계획',
  description: '',
  plannedDate: '2026-11-11',
  startTime: '',
  endTime: '',
  targetMinutes: 30,
  priority: 'medium',
  status: 'completed',
  completedAt: 0,
  memo: '',
  createdAt: 0,
  updatedAt: 0,
  ...overrides,
})

describe('points', () => {
  it('목표 시간에 따라 포인트를 계산한다', () => {
    expect(pointsForPlan(10)).toBe(15)
    expect(pointsForPlan(30)).toBe(25)
    expect(pointsForPlan(60)).toBe(40)
    expect(pointsForPlan(180)).toBe(40)
    expect(pointsForPlan(0)).toBe(10)
  })

  it('완료한 계획만 합산한다', () => {
    expect(
      completedPoints([
        plan({ targetMinutes: 30 }),
        plan({ id: 'p2', targetMinutes: 60, status: 'planned' }),
        plan({ id: 'p3', targetMinutes: 10 }),
      ]),
    ).toBe(40)
  })

  it('주간 포인트는 이번 주 완료 시각만 합산한다', () => {
    const since = Date.UTC(2026, 10, 9)
    expect(
      completedPointsSince(
        [
          plan({ completedAt: since + 1, targetMinutes: 30 }),
          plan({ id: 'p2', completedAt: since - 1, targetMinutes: 60 }),
          plan({ id: 'p3', status: 'planned', completedAt: since + 1 }),
        ],
        since,
      ),
    ).toBe(25)
  })

  it('100포인트마다 레벨이 오른다', () => {
    expect(levelInfo(0)).toMatchObject({
      level: 1,
      title: '새싹',
      current: 0,
      remaining: 100,
    })
    expect(levelInfo(99).level).toBe(1)
    expect(levelInfo(100)).toMatchObject({
      level: 2,
      title: '새싹',
      current: 0,
    })
    expect(levelInfo(250)).toMatchObject({
      level: 3,
      title: '탐험가',
      current: 50,
      progress: 50,
    })
    expect(levelInfo(900).title).toBe('전설')
  })
})
