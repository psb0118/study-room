import { useEffect, useState } from 'react'
import type { Member, TimerState } from '../types'
import { formatMMSS, PHASE_LABEL, progress, remainingMs } from '../lib/pomodoro'

interface TimerPanelProps {
  timer: TimerState
  members: Member[]
  actions: {
    start: () => void
    pause: () => void
    advance: () => void
    reset: () => void
    setDurations: (focusMin: number, breakMin: number) => void
  }
}

export function TimerPanel({ timer, members, actions }: TimerPanelProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [])

  const remain = remainingMs(timer, now)
  const prog = progress(timer, now)
  const phase = timer.phase
  const active = timer.running || (phase !== 'idle' && remain > 0)
  const editor = timer.updatedBy
    ? members.find((m) => m.uid === timer.updatedBy)
    : null

  const chip =
    phase === 'focus'
      ? 'bg-[#ffeff3] text-[#d96a7c] ring-[#f6d6dd]'
      : phase === 'break'
        ? 'bg-[#e8f8f0] text-[#4faa83] ring-[#d5f1e5]'
        : 'bg-[#f4f1fb] text-[#77748f] ring-[#ece8f7]'

  return (
    <section className="surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${chip}`}
          >
            {PHASE_LABEL[phase]}
          </div>
          <div className="font-mono text-5xl font-extrabold tracking-tight tabular-nums text-[#3d3a55] sm:text-6xl">
            {formatMMSS(remain)}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={timer.running ? actions.pause : actions.start}
            className={timer.running ? 'btn btn-warn' : 'btn btn-primary'}
          >
            {timer.running ? '일시정지' : '시작'}
          </button>
          <button type="button" onClick={actions.advance} className="btn">
            건너뛰기
          </button>
          <button type="button" onClick={actions.reset} className="btn">
            초기화
          </button>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f1eef9]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            phase === 'break' ? 'bg-[#6fc7a6]' : 'bg-[#8d86f5]'
          }`}
          style={{ width: `${prog * 100}%` }}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-6">
        <Stepper
          label="집중"
          value={timer.focusMin}
          onChange={(v) => actions.setDurations(v, timer.breakMin)}
          min={1}
          max={120}
          suffix="분"
        />
        <Stepper
          label="휴식"
          value={timer.breakMin}
          onChange={(v) => actions.setDurations(timer.focusMin, v)}
          min={1}
          max={60}
          suffix="분"
        />
        {editor && active && (
          <span className="ml-auto text-xs text-[#a8a5bb]">
            {editor.name}님이 마지막으로 조작
          </span>
        )}
      </div>
    </section>
  )
}

function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  suffix,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  suffix: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-[#a8a5bb]">{label}</span>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="h-7 w-7 rounded-md border border-[#ece8f7] bg-white text-[#5f5c78] transition hover:border-[#d4cfe6] hover:bg-[#fbf9ff]"
        aria-label={`${label} 줄이기`}
      >
        −
      </button>
      <span className="w-14 text-center text-sm font-extrabold tabular-nums text-[#3d3a55]">
        {value}
        {suffix}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="h-7 w-7 rounded-md border border-[#ece8f7] bg-white text-[#5f5c78] transition hover:border-[#d4cfe6] hover:bg-[#fbf9ff]"
        aria-label={`${label} 늘리기`}
      >
        +
      </button>
    </div>
  )
}
