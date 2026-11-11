import type {
  PlanInput,
  PlanStatus,
  Priority,
  StudyPlan,
  StudyRecord,
  Subject,
} from '../types'
import { addDays, dateKey, daysBetween } from './streak'

export const SUBJECT_COLORS = [
  '#6373e5',
  '#22a177',
  '#d47731',
  '#9b66d1',
  '#d35d82',
  '#1594a6',
] as const

/** 스터디 룸에서 집중한 시간을 귀속시키는 특수 과목 id */
export const ROOM_SUBJECT_ID = '__room__'

export const STATUS_LABEL: Record<PlanStatus, string> = {
  planned: '예정',
  in_progress: '진행 중',
  completed: '완료',
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
}

export type Period = 'today' | 'week' | 'month' | 'all'

export const PERIOD_LABEL: Record<Period, string> = {
  today: '오늘',
  week: '이번 주',
  month: '이번 달',
  all: '전체',
}

export interface PlanFilters {
  period: Period
  subjectId: string
  status: 'all' | PlanStatus
}

export interface DayTotal {
  key: string
  label: string
  ms: number
}

function dateFromKey(key: string): Date {
  return new Date(`${key}T12:00:00`)
}

export function todayKey(): string {
  return dateKey(new Date())
}

/** 월요일 시작 주간의 첫 날 */
export function startOfWeek(key = todayKey()): string {
  const d = dateFromKey(key)
  const offset = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - offset)
  return dateKey(d)
}

export function withinPeriod(
  key: string,
  period: Period,
  today = todayKey(),
): boolean {
  if (period === 'all') return true
  if (period === 'today') return key === today
  if (period === 'week') {
    const start = startOfWeek(today)
    return key >= start && key <= addDays(start, 6)
  }
  return key.slice(0, 7) === today.slice(0, 7)
}

export function sortPlans(plans: StudyPlan[]): StudyPlan[] {
  return [...plans].sort((a, b) =>
    `${a.plannedDate}|${a.startTime}|${a.createdAt}`.localeCompare(
      `${b.plannedDate}|${b.startTime}|${b.createdAt}`,
    ),
  )
}

export function filterPlans(
  plans: StudyPlan[],
  filters: PlanFilters,
): StudyPlan[] {
  return sortPlans(
    plans.filter(
      (p) =>
        withinPeriod(p.plannedDate, filters.period) &&
        (filters.subjectId === 'all' || p.subjectId === filters.subjectId) &&
        (filters.status === 'all' || p.status === filters.status),
    ),
  )
}

export function recordDateKey(record: StudyRecord): string {
  return record.dateKey || dateKey(new Date(record.startedAt))
}

export function recordsInPeriod(
  records: StudyRecord[],
  period: Period,
  today = todayKey(),
): StudyRecord[] {
  return records.filter((r) => withinPeriod(recordDateKey(r), period, today))
}

export function dailyTotals(records: StudyRecord[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const r of records) {
    const key = recordDateKey(r)
    out[key] = (out[key] ?? 0) + Math.max(0, r.durationMs)
  }
  return out
}

export function totalDuration(records: StudyRecord[]): number {
  return records.reduce((sum, r) => sum + Math.max(0, r.durationMs), 0)
}

/**
 * 기록이 있는 날짜를 기준으로 현재 연속일과 최장 연속일을 계산한다.
 * 오늘 아직 공부하지 않았어도 어제까지의 연속 기록은 유지해서 보여준다.
 */
export function calcStreak(
  days: Record<string, number>,
  today = todayKey(),
): { streak: number; longest: number } {
  const studied = Object.keys(days)
    .filter((key) => (days[key] ?? 0) > 0 && key <= today)
    .sort()
  let longest = 0
  let run = 0
  let prev = ''
  for (const key of studied) {
    run = prev !== '' && daysBetween(prev, key) === 1 ? run + 1 : 1
    if (run > longest) longest = run
    prev = key
  }

  let streak = 0
  let cursor = (days[today] ?? 0) > 0 ? today : addDays(today, -1)
  while ((days[cursor] ?? 0) > 0) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return { streak, longest }
}

export function subjectTotals(records: StudyRecord[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const r of records) {
    out[r.subjectId] = (out[r.subjectId] ?? 0) + Math.max(0, r.durationMs)
  }
  return out
}

export function subjectMeta(
  id: string,
  subjects: Subject[],
): { name: string; color: string } {
  if (id === ROOM_SUBJECT_ID) return { name: '스터디 룸', color: '#64748b' }
  const found = subjects.find((s) => s.id === id)
  if (found) return { name: found.name, color: found.color }
  return { name: '과목 없음', color: '#64748b' }
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 60_000))
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  if (hours > 0) return `${hours}시간 ${minutes}분`
  return `${minutes}분`
}

export function recentDays(
  count: number,
  totals: Record<string, number>,
  today = todayKey(),
): DayTotal[] {
  const out: DayTotal[] = []
  const weekday = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' })
  for (let i = count - 1; i >= 0; i--) {
    const key = addDays(today, -i)
    out.push({
      key,
      label: weekday.format(dateFromKey(key)),
      ms: totals[key] ?? 0,
    })
  }
  return out
}

export function isTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(dateFromKey(value).valueOf())
}

export function formatDateKey(
  key: string,
  options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  },
): string {
  if (!isDateKey(key)) return '날짜 없음'
  return new Intl.DateTimeFormat('ko-KR', options).format(dateFromKey(key))
}

export type PlanErrors = Partial<Record<keyof PlanInput, string>>

export function validatePlan(
  input: PlanInput,
  subjects: Subject[],
  allowArchived = false,
): PlanErrors {
  const errors: PlanErrors = {}
  const selectable = allowArchived
    ? subjects
    : subjects.filter((s) => !s.archived)

  if (!selectable.some((s) => s.id === input.subjectId)) {
    errors.subjectId = '사용 가능한 과목을 선택해 주세요.'
  }

  const title = input.title.trim()
  if (!title) errors.title = '제목을 입력해 주세요.'
  else if (title.length > 100) errors.title = '제목은 100자 이하여야 해요.'

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.plannedDate) ||
    Number.isNaN(dateFromKey(input.plannedDate).valueOf())
  ) {
    errors.plannedDate = '올바른 날짜를 선택해 주세요.'
  }

  if (
    !Number.isInteger(input.targetMinutes) ||
    input.targetMinutes < 1 ||
    input.targetMinutes > 1440
  ) {
    errors.targetMinutes = '1~1440분 사이로 입력해 주세요.'
  }

  if (input.startTime && !isTime(input.startTime)) {
    errors.startTime = '올바른 시간을 입력해 주세요.'
  }
  if (input.endTime && !isTime(input.endTime)) {
    errors.endTime = '올바른 시간을 입력해 주세요.'
  }
  if (
    input.startTime &&
    input.endTime &&
    isTime(input.startTime) &&
    isTime(input.endTime) &&
    input.endTime <= input.startTime
  ) {
    errors.endTime = '종료 시간은 시작 시간보다 늦어야 해요.'
  }

  if (!(input.status in STATUS_LABEL)) {
    errors.status = '올바른 상태를 선택해 주세요.'
  }
  if (!(input.priority in PRIORITY_LABEL)) {
    errors.priority = '올바른 우선순위를 선택해 주세요.'
  }

  return errors
}

export function emptyPlanInput(
  subjects: Subject[],
  date = todayKey(),
): PlanInput {
  return {
    subjectId: subjects.find((s) => !s.archived)?.id ?? '',
    title: '',
    description: '',
    plannedDate: date,
    startTime: '',
    endTime: '',
    targetMinutes: 60,
    priority: 'medium',
    status: 'planned',
    memo: '',
  }
}
