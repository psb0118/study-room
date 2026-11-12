import { describe, expect, it } from 'vitest'
import { nextReminderAt } from './reminders'

describe('reminders', () => {
  it('schedules later today when the time has not passed', () => {
    const next = nextReminderAt(new Date('2026-11-11T10:00:00'), '19:30')
    expect(next?.toISOString()).toBe(
      new Date('2026-11-11T19:30:00').toISOString(),
    )
  })

  it('moves to tomorrow after the time and rejects invalid values', () => {
    const next = nextReminderAt(new Date('2026-11-11T20:00:00'), '19:30')
    expect(next?.toISOString()).toBe(
      new Date('2026-11-12T19:30:00').toISOString(),
    )
    expect(nextReminderAt(new Date(), '25:00')).toBeNull()
  })
})
