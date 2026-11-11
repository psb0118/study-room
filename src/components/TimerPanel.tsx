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
      ? 'bg-[#fff0f2] text-[#c84f61] ring-[#f3ced3]'
      : phase === 'break'
        ? 'bg-[#e9f8f1] text-[#278b66] ring-[#cbeedc]'
        : 'bg-[#f0f2f7] text-[#697088] ring-[#e7e9f2]'

  return (
    <section className="surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${chip}`}
          >
            {PHASE_LABEL[phase]}
          </div>
          <div className="font-mono text-5xl font-extrabold tracking-tight tabular-nums text-[#202538] sm:text-6xl">
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

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#edf0f6]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            phase === 'break' ? 'bg-[#3aa981]' : 'bg-[#6675ea]'
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
          <span className="ml-auto text-xs text-[#9498a7]">
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
      <span className="text-xs font-semibold text-[#9498a7]">{label}</span>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="h-7 w-7 rounded-md border border-[#e7e9f2] bg-white text-[#52586e] transition hover:border-[#c9cee1] hover:bg-[#fafbfe]"
        aria-label={`${label} 줄이기`}
      >
        −
      </button>
      <span className="w-14 text-center text-sm font-extrabold tabular-nums text-[#202538]">
        {value}
        {suffix}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="h-7 w-7 rounded-md border border-[#e7e9f2] bg-white text-[#52586e] transition hover:border-[#c9cee1] hover:bg-[#fafbfe]"
        aria-label={`${label} 늘리기`}
      >
        +
      </button>
    </div>
  )
}
