import { addDays } from './streak'

export interface ExamCalendarDay {
  dateKey: string
  day: number
  inMonth: boolean
  isToday: boolean
}

function monthParts(monthKey: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  if (month < 1 || month > 12) return null
  return { year, month }
}

export function monthOf(dateKey: string): string {
  return dateKey.slice(0, 7)
}

export function shiftMonth(monthKey: string, delta: number): string {
  const parts = monthParts(monthKey)
  if (!parts) return monthKey
  const date = new Date(Date.UTC(parts.year, parts.month - 1 + delta, 1, 12))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(monthKey: string): string {
  const parts = monthParts(monthKey)
  if (!parts) return monthKey
  return `${parts.year}년 ${parts.month}월`
}

/** 월요일 시작 달력. 앞뒤 달의 날짜를 채워 5~6주를 만든다. */
export function createMonthGrid(
  monthKey: string,
  today = '',
): ExamCalendarDay[] {
  const parts = monthParts(monthKey)
  if (!parts) return []
  const first = new Date(Date.UTC(parts.year, parts.month - 1, 1, 12))
  const daysInMonth = new Date(
    Date.UTC(parts.year, parts.month, 0, 12),
  ).getUTCDate()
  const mondayOffset = (first.getUTCDay() + 6) % 7
  const cellCount = Math.ceil((mondayOffset + daysInMonth) / 7) * 7
  const start = addDays(`${monthKey}-01`, -mondayOffset)

  return Array.from({ length: cellCount }, (_, index) => {
    const dateKey = addDays(start, index)
    return {
      dateKey,
      day: Number(dateKey.slice(8, 10)),
      inMonth: dateKey.slice(0, 7) === monthKey,
      isToday: dateKey === today,
    }
  })
}
