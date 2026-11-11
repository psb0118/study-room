import { describe, expect, it } from 'vitest'
import type { PlanInput, StudyPlan, StudyRecord, Subject } from '../types'
import {
  calcStreak,
  dailyTotals,
  emptyPlanInput,
  filterPlans,
  formatDuration,
  startOfWeek,
  subjectTotals,
  validatePlan,
  withinPeriod,
} from './planner'

const subject = (id: string, archived = false): Subject => ({
  id,
  name: id,
  color: '#6373e5',
  archived,
  createdAt: 0,
  updatedAt: 0,
})

const plan = (
  id: string,
  overrides: Partial<StudyPlan> = {},
): StudyPlan => ({
  id,
  subjectId: 's1',
  title: id,
  description: '',
  plannedDate: '2026-11-11',
  startTime: '',
  endTime: '',
  targetMinutes: 60,
  priority: 'medium',
  status: 'planned',
  memo: '',
  createdAt: 0,
  updatedAt: 0,
  ...overrides,
})

const record = (
  dateKey: string,
  durationMs: number,
  subjectId = 's1',
): StudyRecord => ({
  id: `${dateKey}-${subjectId}`,
  subjectId,
  planId: '',
  dateKey,
  source: 'manual',
  startedAt: 0,
  endedAt: 0,
  durationMs,
  memo: '',
  createdAt: 0,
})

const validInput = (overrides: Partial<PlanInput> = {}): PlanInput => ({
  ...emptyPlanInput([subject('s1')], '2026-11-11'),
  title: '영어 단어 100개',
  ...overrides,
})

describe('planner dates', () => {
  it('주간 시작은 월요일', () => {
    expect(startOfWeek('2026-11-11')).toBe('2026-11-09')
    expect(startOfWeek('2026-11-09')).toBe('2026-11-09')
    expect(startOfWeek('2026-11-15')).toBe('2026-11-09')
  })

  it('기간 필터', () => {
    expect(withinPeriod('2026-11-11', 'today', '2026-11-11')).toBe(true)
    expect(withinPeriod('2026-11-10', 'today', '2026-11-11')).toBe(false)
    expect(withinPeriod('2026-11-09', 'week', '2026-11-11')).toBe(true)
    expect(withinPeriod('2026-11-08', 'week', '2026-11-11')).toBe(false)
    expect(withinPeriod('2026-11-01', 'month', '2026-11-11')).toBe(true)
    expect(withinPeriod('2026-10-31', 'month', '2026-11-11')).toBe(false)
    expect(withinPeriod('2020-01-01', 'all', '2026-11-11')).toBe(true)
  })
})

describe('planner stats', () => {
  it('연속일과 최장 연속일', () => {
    const days = {
      '2026-11-08': 60_000,
      '2026-11-09': 60_000,
      '2026-11-10': 60_000,
      '2026-11-11': 60_000,
    }
    expect(calcStreak(days, '2026-11-11')).toEqual({ streak: 4, longest: 4 })
  })

  it('오늘 기록이 없어도 어제까지의 연속일을 유지', () => {
    const days = { '2026-11-09': 60_000, '2026-11-10': 60_000 }
    expect(calcStreak(days, '2026-11-11')).toEqual({ streak: 2, longest: 2 })
  })

  it('건너뛴 날은 연속일이 끊긴다', () => {
    const days = { '2026-11-08': 60_000, '2026-11-10': 60_000, '2026-11-11': 60_000 }
    expect(calcStreak(days, '2026-11-11')).toEqual({ streak: 2, longest: 2 })
  })

  it('날짜별/과목별 합계', () => {
    const records = [
      record('2026-11-11', 60_000, 's1'),
      record('2026-11-11', 30_000, 's2'),
      record('2026-11-10', 90_000, 's1'),
    ]
    expect(dailyTotals(records)).toEqual({
      '2026-11-11': 90_000,
      '2026-11-10': 90_000,
    })
    expect(subjectTotals(records)).toEqual({ s1: 150_000, s2: 30_000 })
  })

  it('시간 표시', () => {
    expect(formatDuration(0)).toBe('0분')
    expect(formatDuration(30 * 60_000)).toBe('30분')
    expect(formatDuration(90 * 60_000)).toBe('1시간 30분')
  })
})

describe('plan filters', () => {
  it('기간·과목·상태로 거른다', () => {
    const plans = [
      plan('a'),
      plan('b', { subjectId: 's2' }),
      plan('c', { status: 'completed' }),
      plan('d', { plannedDate: '2026-10-01' }),
    ]
    expect(
      filterPlans(plans, { period: 'week', subjectId: 's1', status: 'all' }).map(
        (p) => p.id,
      ),
    ).toEqual(['a', 'c'])
    expect(
      filterPlans(plans, { period: 'all', subjectId: 'all', status: 'completed' }).map(
        (p) => p.id,
      ),
    ).toEqual(['c'])
  })
})

describe('plan validation', () => {
  it('정상 입력은 오류가 없다', () => {
    expect(validatePlan(validInput(), [subject('s1')])).toEqual({})
  })

  it('필수값과 시간 범위를 검사한다', () => {
    const errors = validatePlan(
      validInput({
        subjectId: 'nope',
        title: ' ',
        plannedDate: '2026-13-40',
        targetMinutes: 0,
        startTime: '10:00',
        endTime: '09:00',
      }),
      [subject('s1')],
    )
    expect(errors.subjectId).toBeTruthy()
    expect(errors.title).toBeTruthy()
    expect(errors.plannedDate).toBeTruthy()
    expect(errors.targetMinutes).toBeTruthy()
    expect(errors.endTime).toBeTruthy()
  })

  it('보관된 과목은 수정 시에만 허용한다', () => {
    const input = validInput({ subjectId: 'old' })
    expect(validatePlan(input, [subject('old', true)]).subjectId).toBeTruthy()
    expect(validatePlan(input, [subject('old', true)], true)).toEqual({})
  })
})
