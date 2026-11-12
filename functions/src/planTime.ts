import { reminderMinutes, zonedClock } from './time'

export const PLAN_REMINDER_WINDOW_MINUTES = 5
export const PLAN_REMINDER_OFFSETS = [0, 5, 10, 15, 30] as const

export interface PlanReminderSlot {
  /** 알림이 발생해야 하는 사용자 로컬 날짜 */
  dateKey: string
  /** 자정부터의 알림 목표 분 */
  minutes: number
}

export function normalizePlanReminderOffset(value: unknown): number {
  const minutes = Number(value)
  return PLAN_REMINDER_OFFSETS.includes(
    minutes as (typeof PLAN_REMINDER_OFFSETS)[number],
  )
    ? minutes
    : 0
}

function isDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  return !Number.isNaN(new Date(`${value}T12:00:00Z`).valueOf())
}

export function addDateKey(dateKey: string, days: number): string {
  if (!isDateKey(dateKey)) return dateKey
  const date = new Date(`${dateKey}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/**
 * 계획의 로컬 날짜·시작 시각에서 알림 목표 시각을 구한다.
 * 00:05 계획을 10분 전에 알리면 목표는 전날 23:55다.
 */
export function planReminderSlot(
  plannedDate: unknown,
  startTime: unknown,
  offsetMinutes: unknown,
): PlanReminderSlot | null {
  const dateKey = String(plannedDate ?? '')
  if (!isDateKey(dateKey)) return null

  const start = reminderMinutes(startTime)
  if (start === null) return null

  const offset = normalizePlanReminderOffset(offsetMinutes)
  let target = start - offset
  let targetDate = dateKey
  if (target < 0) {
    target += 24 * 60
    targetDate = addDateKey(dateKey, -1)
  }

  return { dateKey: targetDate, minutes: target }
}

export function isPlanReminderDue(
  now: Date,
  timeZone: string,
  plannedDate: unknown,
  startTime: unknown,
  offsetMinutes: unknown,
  windowMinutes = PLAN_REMINDER_WINDOW_MINUTES,
): boolean {
  const slot = planReminderSlot(plannedDate, startTime, offsetMinutes)
  if (!slot) return false

  const clock = zonedClock(now, timeZone)
  if (slot.dateKey !== clock.dateKey) return false
  return (
    clock.minutes >= slot.minutes &&
    clock.minutes < slot.minutes + windowMinutes
  )
}
