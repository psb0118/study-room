import type { TimerState } from '../types'

export const DEFAULT_FOCUS_MIN = 25
export const DEFAULT_BREAK_MIN = 5

export function initialTimer(): TimerState {
  return {
    phase: 'idle',
    running: false,
    endsAt: 0,
    pauseRemaining: DEFAULT_FOCUS_MIN * 60_000,
    focusMin: DEFAULT_FOCUS_MIN,
    breakMin: DEFAULT_BREAK_MIN,
    updatedBy: null,
  }
}

export function remainingMs(t: TimerState, now: number): number {
  if (t.phase === 'idle') return Math.max(0, t.pauseRemaining)
  if (t.running) return Math.max(0, t.endsAt - now)
  return Math.max(0, t.pauseRemaining)
}

export function totalMs(t: TimerState): number {
  return (t.phase === 'break' ? t.breakMin : t.focusMin) * 60_000
}

/** 0(시작) ~ 1(종료) 진행률 */
export function progress(t: TimerState, now: number): number {
  const total = totalMs(t)
  if (total <= 0) return 0
  return Math.min(1, Math.max(0, 1 - remainingMs(t, now) / total))
}

export function startTimer(t: TimerState, now: number, uid: string): TimerState {
  if (t.phase === 'idle') {
    return {
      ...t,
      phase: 'focus',
      running: true,
      endsAt: now + t.focusMin * 60_000,
      pauseRemaining: 0,
      updatedBy: uid,
    }
  }
  if (!t.running) {
    return { ...t, running: true, endsAt: now + t.pauseRemaining, pauseRemaining: 0, updatedBy: uid }
  }
  return t
}

export function pauseTimer(t: TimerState, now: number, uid: string): TimerState {
  if (!t.running) return t
  return {
    ...t,
    running: false,
    pauseRemaining: remainingMs(t, now),
    endsAt: 0,
    updatedBy: uid,
  }
}

export function nextPhase(t: TimerState, now: number, uid: string): TimerState {
  const target = t.phase === 'focus' ? 'break' : 'focus'
  const dur = (target === 'focus' ? t.focusMin : t.breakMin) * 60_000
  const base = t.phase === 'idle' ? now : Math.max(now, t.endsAt)
  return {
    ...t,
    phase: target,
    running: true,
    endsAt: base + dur,
    pauseRemaining: 0,
    updatedBy: uid,
  }
}

export function resetTimer(t: TimerState, uid: string): TimerState {
  return {
    ...t,
    phase: 'idle',
    running: false,
    endsAt: 0,
    pauseRemaining: t.focusMin * 60_000,
    updatedBy: uid,
  }
}

export function setDurations(
  t: TimerState,
  focusMin: number,
  breakMin: number,
  uid: string,
): TimerState {
  const focus = clamp(focusMin, 1, 120)
  const brk = clamp(breakMin, 1, 60)
  const next: TimerState = { ...t, focusMin: focus, breakMin: brk, updatedBy: uid }
  if (t.phase === 'idle') next.pauseRemaining = focus * 60_000
  if (t.phase === 'focus' && !t.running) next.pauseRemaining = Math.min(t.pauseRemaining, focus * 60_000)
  if (t.phase === 'break' && !t.running) next.pauseRemaining = Math.min(t.pauseRemaining, brk * 60_000)
  return next
}

export function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, Math.round(n)))
}

export function formatMMSS(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export const PHASE_LABEL: Record<TimerState['phase'], string> = {
  idle: '대기',
  focus: '집중',
  break: '휴식',
}
