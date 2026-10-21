import { describe, expect, it } from 'vitest'
import { addDays, dateKey, daysBetween, updateStreak } from './streak'

describe('streak', () => {
  it('dateKey 형식', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(dateKey(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('addDays는 월말/연말을 넘어간다', () => {
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01')
  })

  it('daysBetween', () => {
    expect(daysBetween('2026-10-01', '2026-10-02')).toBe(1)
    expect(daysBetween('2026-10-01', '2026-10-11')).toBe(10)
    expect(daysBetween('2026-10-11', '2026-10-01')).toBe(-10)
  })

  it('첫 기록은 스트릭 1', () => {
    const s = updateStreak({ streak: 0, longest: 0, lastStudyDate: null }, '2026-10-21')
    expect(s).toEqual({ streak: 1, longest: 1, lastStudyDate: '2026-10-21' })
  })

  it('같은 날 다시 기록해도 유지', () => {
    const s = updateStreak({ streak: 3, longest: 5, lastStudyDate: '2026-10-21' }, '2026-10-21')
    expect(s.streak).toBe(3)
    expect(s.longest).toBe(5)
  })

  it('다음 날 연속 기록은 증가', () => {
    const s = updateStreak({ streak: 3, longest: 3, lastStudyDate: '2026-10-20' }, '2026-10-21')
    expect(s.streak).toBe(4)
    expect(s.longest).toBe(4)
  })

  it('건너뛴 날은 초기화', () => {
    const s = updateStreak({ streak: 10, longest: 10, lastStudyDate: '2026-10-15' }, '2026-10-21')
    expect(s.streak).toBe(1)
    expect(s.longest).toBe(10)
  })

  it('longest는 최댓값 유지', () => {
    const s = updateStreak({ streak: 1, longest: 30, lastStudyDate: '2026-10-20' }, '2026-10-21')
    expect(s.streak).toBe(2)
    expect(s.longest).toBe(30)
  })
})
