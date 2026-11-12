export const DEFAULT_TIME_ZONE = 'Asia/Seoul'
export const REMINDER_WINDOW_MINUTES = 5

export interface ZonedClock {
  dateKey: string
  minutes: number
}

export function safeTimeZone(value: unknown): string {
  const raw = String(value ?? '').trim()
  if (!raw) return DEFAULT_TIME_ZONE
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: raw }).format()
    return raw
  } catch {
    return DEFAULT_TIME_ZONE
  }
}

/** 사용자의 IANA 시간대 기준 로컬 날짜와 0시부터의 분을 구한다. */
export function zonedClock(now: Date, timeZone: string): ZonedClock {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0)

  const year = value('year')
  const month = String(value('month')).padStart(2, '0')
  const day = String(value('day')).padStart(2, '0')
  const hour = value('hour')
  const minute = value('minute')

  return {
    dateKey: `${year}-${month}-${day}`,
    minutes: hour * 60 + minute,
  }
}

export function reminderMinutes(value: unknown): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value ?? ''))
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

/**
 * 5분 주기 실행에서 현재 시각이 알림 시간 직후 5분 이내인지 확인한다.
 * 함수가 5분 넘게 지연되면 중복 발송보다 누락을 선택한다.
 */
export function isReminderWindow(
  now: Date,
  reminderTime: unknown,
  timeZone: string,
  windowMinutes = REMINDER_WINDOW_MINUTES,
): { due: boolean; dateKey: string } {
  const clock = zonedClock(now, timeZone)
  const target = reminderMinutes(reminderTime)
  if (target === null) return { due: false, dateKey: clock.dateKey }

  const diff = (clock.minutes - target + 24 * 60) % (24 * 60)
  return { due: diff < windowMinutes, dateKey: clock.dateKey }
}
