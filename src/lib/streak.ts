/** 로컬 날짜 기준 YYYY-MM-DD */
export function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(y, m - 1, d + n)
  return dateKey(dt)
}

export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  const a = Date.UTC(fy, fm - 1, fd)
  const b = Date.UTC(ty, tm - 1, td)
  return Math.round((b - a) / 86_400_000)
}

export interface StreakState {
  streak: number
  longest: number
  lastStudyDate: string | null
}

/** 오늘 학습 기록이 추가될 때 스트릭을 갱신한다. */
export function updateStreak(prev: StreakState, today: string): StreakState {
  const { lastStudyDate } = prev
  if (lastStudyDate === today) {
    return { ...prev }
  }
  let streak = 1
  if (lastStudyDate && daysBetween(lastStudyDate, today) === 1) {
    streak = prev.streak + 1
  }
  const longest = Math.max(prev.longest, streak)
  return { streak, longest, lastStudyDate: today }
}
