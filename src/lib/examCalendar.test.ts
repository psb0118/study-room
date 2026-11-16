import { describe, expect, it } from 'vitest'
import {
  createMonthGrid,
  monthLabel,
  monthOf,
  shiftMonth,
} from './examCalendar'

describe('exam calendar', () => {
  it('moves across year boundaries', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(monthOf('2026-11-11')).toBe('2026-11')
    expect(monthLabel('2026-11')).toBe('2026년 11월')
  })

  it('builds a Monday-first grid and marks today', () => {
    const days = createMonthGrid('2026-11', '2026-11-11')
    expect(days).toHaveLength(42)
    expect(days[0].dateKey).toBe('2026-10-26')
    expect(days.filter((day) => day.inMonth)).toHaveLength(30)
    expect(days.find((day) => day.isToday)?.dateKey).toBe('2026-11-11')
  })
})
