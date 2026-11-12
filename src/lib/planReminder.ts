import type { PlanReminderOffset } from '../types'

export const PLAN_REMINDER_OFFSETS: readonly PlanReminderOffset[] = [
  0, 5, 10, 15, 30,
]

export const PLAN_REMINDER_OFFSET_LABELS: Record<PlanReminderOffset, string> = {
  0: '시작 시각',
  5: '5분 전',
  10: '10분 전',
  15: '15분 전',
  30: '30분 전',
}

export function normalizePlanReminderOffset(
  value: unknown,
): PlanReminderOffset {
  const minutes = Number(value)
  return PLAN_REMINDER_OFFSETS.includes(minutes as PlanReminderOffset)
    ? (minutes as PlanReminderOffset)
    : 0
}
