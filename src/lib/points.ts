import type { StudyPlan } from '../types'

export const POINTS_PER_LEVEL = 100

/**
 * 계획 하나를 완료했을 때 받는 포인트.
 * 기본 10P에 목표 시간 10분당 5P를 더하고, 최대 30P 보너스를 준다.
 * 10분 → 15P, 30분 → 25P, 60분 이상 → 40P
 */
export function pointsForPlan(targetMinutes: number): number {
  const minutes = Math.max(0, Math.floor(Number(targetMinutes) || 0))
  return 10 + Math.min(30, Math.floor(minutes / 10) * 5)
}

export function completedPoints(plans: StudyPlan[]): number {
  return plans.reduce(
    (sum, plan) =>
      plan.status === 'completed'
        ? sum + pointsForPlan(plan.targetMinutes)
        : sum,
    0,
  )
}

/** 특정 시각 이후 완료된 계획만 합산한다. 주간 리그에 사용한다. */
export function completedPointsSince(
  plans: StudyPlan[],
  since: number,
): number {
  return plans.reduce((sum, plan) => {
    if (plan.status !== 'completed') return sum
    const completedAt = plan.completedAt || plan.updatedAt
    return completedAt >= since
      ? sum + pointsForPlan(plan.targetMinutes)
      : sum
  }, 0)
}

export interface LevelInfo {
  points: number
  level: number
  title: string
  /** 현재 레벨 구간에서 모은 포인트 (0~99) */
  current: number
  next: number
  progress: number
  remaining: number
}

export function levelTitle(level: number): string {
  if (level >= 9) return '전설'
  if (level >= 7) return '집중 마스터'
  if (level >= 5) return '성실왕'
  if (level >= 3) return '탐험가'
  return '새싹'
}

export function levelInfo(points: number): LevelInfo {
  const safe = Math.max(0, Math.floor(Number(points) || 0))
  const level = Math.floor(safe / POINTS_PER_LEVEL) + 1
  const current = safe % POINTS_PER_LEVEL
  return {
    points: safe,
    level,
    title: levelTitle(level),
    current,
    next: POINTS_PER_LEVEL,
    progress: Math.round((current / POINTS_PER_LEVEL) * 100),
    remaining: POINTS_PER_LEVEL - current,
  }
}
