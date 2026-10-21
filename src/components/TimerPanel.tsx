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
  const editor = timer.updatedBy ? members.find((m) => m.uid === timer.updatedBy) : null

  const chip =
    phase === 'focus'
      ? 'bg-rose-500/15 text-rose-300 ring-rose-400/30'
      : phase === 'break'
        ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30'
        : 'bg-white/5 text-slate-300 ring-white/10'

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${chip}`}>
            {PHASE_LABEL[phase]}
          </div>
          <div className="font-mono text-5xl font-bold tracking-tight tabular-nums text-white sm:text-6xl">
            {formatMMSS(remain)}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={timer.running ? actions.pause : actions.start}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${
              timer.running
                ? 'bg-amber-500 hover:bg-amber-400'
                : 'bg-indigo-500 hover:bg-indigo-400'
            }`}
          >
            {timer.running ? '일시정지' : '시작'}
          </button>
          <button
            type="button"
            onClick={actions.advance}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            건너뛰기
          </button>
          <button
            type="button"
            onClick={actions.reset}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            초기화
          </button>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            phase === 'break' ? 'bg-emerald-400' : 'bg-indigo-400'
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
          <span className="ml-auto text-xs text-slate-500">{editor.name}님이 마지막으로 조작</span>
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
      <span className="text-xs text-slate-400">{label}</span>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="h-7 w-7 rounded-md border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
        aria-label={`${label} 줄이기`}
      >
        −
      </button>
      <span className="w-14 text-center text-sm font-semibold tabular-nums text-white">
        {value}
        {suffix}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="h-7 w-7 rounded-md border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
        aria-label={`${label} 늘리기`}
      >
        +
      </button>
    </div>
  )
}
