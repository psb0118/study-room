import { startOfWeek } from './planner'
import { dateKey } from './streak'

const MAX_WEEK_KEYS = 520

/**
 * 계정을 만든 주부터 이번 주까지의 주간 리그 키를 만든다.
 * 주간 리그는 주차별 하위 컬렉션이라 과거 항목도 계정 삭제 시 함께 지워야 한다.
 */
export function weekKeysSince(createdAt: number, now = new Date()): string[] {
  const end = startOfWeek(dateKey(now))
  const rawStart =
    Number.isFinite(createdAt) && createdAt > 0 ? new Date(createdAt) : now
  let cursor = startOfWeek(dateKey(rawStart))
  if (cursor > end) cursor = end

  const keys: string[] = []
  for (let guard = 0; cursor <= end && guard < MAX_WEEK_KEYS; guard += 1) {
    keys.push(cursor)
    const next = new Date(`${cursor}T12:00:00`)
    next.setDate(next.getDate() + 7)
    cursor = dateKey(next)
  }
  return keys
}
