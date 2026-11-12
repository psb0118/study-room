import { describe, expect, it } from 'vitest'
import {
  normalizePlanReminderOffset,
  PLAN_REMINDER_OFFSET_LABELS,
} from './planReminder'

describe('plan reminders', () => {
  it('accepts supported offsets and falls back to the start time', () => {
    expect(normalizePlanReminderOffset(0)).toBe(0)
    expect(normalizePlanReminderOffset(5)).toBe(5)
    expect(normalizePlanReminderOffset(30)).toBe(30)
    expect(normalizePlanReminderOffset(7)).toBe(0)
    expect(normalizePlanReminderOffset('10')).toBe(10)
    expect(normalizePlanReminderOffset(undefined)).toBe(0)
  })

  it('has a label for every offset', () => {
    expect(PLAN_REMINDER_OFFSET_LABELS[0]).toBe('시작 시각')
    expect(PLAN_REMINDER_OFFSET_LABELS[10]).toBe('10분 전')
    expect(PLAN_REMINDER_OFFSET_LABELS[30]).toBe('30분 전')
  })
})
