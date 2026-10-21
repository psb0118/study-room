import { describe, expect, it } from 'vitest'
import {
  formatMMSS,
  initialTimer,
  nextPhase,
  pauseTimer,
  progress,
  remainingMs,
  resetTimer,
  setDurations,
  startTimer,
} from './pomodoro'

const T0 = 1_700_000_000_000

describe('pomodoro', () => {
  it('기본값: 대기 + 25분', () => {
    const t = initialTimer()
    expect(t.phase).toBe('idle')
    expect(remainingMs(t, T0)).toBe(25 * 60_000)
    expect(progress(t, T0)).toBe(0)
  })

  it('시작하면 focus가 되고 endsAt이 설정된다', () => {
    const t = startTimer(initialTimer(), T0, 'u1')
    expect(t.phase).toBe('focus')
    expect(t.running).toBe(true)
    expect(remainingMs(t, T0)).toBe(25 * 60_000)
    expect(remainingMs(t, T0 + 60_000)).toBe(24 * 60_000)
    expect(progress(t, T0 + 60_000)).toBeCloseTo(1 / 25, 5)
  })

  it('일시정지하면 남은 시간이 유지된다', () => {
    const started = startTimer(initialTimer(), T0, 'u1')
    const paused = pauseTimer(started, T0 + 10 * 60_000, 'u1')
    expect(paused.running).toBe(false)
    expect(remainingMs(paused, T0 + 999_999_999)).toBe(15 * 60_000)
    const resumed = startTimer(paused, T0 + 20 * 60_000, 'u1')
    expect(resumed.running).toBe(true)
    expect(resumed.endsAt).toBe(T0 + 35 * 60_000)
  })

  it('다음 단계는 focus→break→focus 순서로 진행된다', () => {
    let t = startTimer(initialTimer(), T0, 'u1')
    t = nextPhase(t, T0 + 25 * 60_000, 'u1')
    expect(t.phase).toBe('break')
    expect(t.breakMin).toBe(5)
    expect(remainingMs(t, T0 + 25 * 60_000)).toBe(5 * 60_000)
    t = nextPhase(t, T0 + 30 * 60_000, 'u1')
    expect(t.phase).toBe('focus')
    expect(t.endsAt).toBe(T0 + 55 * 60_000)
  })

  it('지나간 시간은 빚지지 않는다 (endsAt이 과거여도 now 기준)', () => {
    let t = startTimer(initialTimer(), T0, 'u1')
    const late = T0 + 40 * 60_000
    t = nextPhase(t, late, 'u1')
    expect(t.endsAt).toBe(late + 5 * 60_000)
  })

  it('초기화는 대기 상태 + 집중 시간으로 복귀한다', () => {
    let t = startTimer(initialTimer(), T0, 'u1')
    t = nextPhase(t, T0 + 25 * 60_000, 'u1')
    t = resetTimer(t, 'u1')
    expect(t.phase).toBe('idle')
    expect(t.running).toBe(false)
    expect(remainingMs(t, T0)).toBe(25 * 60_000)
  })

  it('시간 설정은 범위로 클램프된다', () => {
    let t = setDurations(initialTimer(), 0, 999, 'u1')
    expect(t.focusMin).toBe(1)
    expect(t.breakMin).toBe(60)
    t = setDurations(t, 90, 30, 'u1')
    expect(t.focusMin).toBe(90)
    expect(remainingMs(t, T0)).toBe(90 * 60_000)
    t = setDurations(t, Number.NaN, 10, 'u1')
    expect(t.focusMin).toBe(1)
  })

  it('형식: mm:ss', () => {
    expect(formatMMSS(0)).toBe('00:00')
    expect(formatMMSS(61_000)).toBe('01:01')
    expect(formatMMSS(25 * 60_000)).toBe('25:00')
  })
})
