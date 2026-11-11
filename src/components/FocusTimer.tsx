import { useCallback, useEffect, useRef, useState } from 'react'
import { formatMMSS } from '../lib/pomodoro'
import { todayKey } from '../lib/planner'
import type { PlannerApi } from '../hooks/usePlanner'
import type { StudyPlan } from '../types'
import { Modal, ghostButton, primaryButton } from './ui'

interface FocusTimerProps {
  plan: StudyPlan
  planner: PlannerApi
  onClose: () => void
}

export function FocusTimer({ plan, planner, onClose }: FocusTimerProps) {
  const targetSec = Math.max(1, Math.min(60, plan.targetMinutes)) * 60
  const [remaining, setRemaining] = useState(targetSec)
  const [endAt, setEndAt] = useState<number | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')
  const savingRef = useRef(false)
  const doneRef = useRef(false)
  const finishRef = useRef<(elapsedSeconds: number, full: boolean) => void>(
    () => undefined,
  )

  const finish = useCallback(
    (elapsedSeconds: number, full: boolean) => {
      if (savingRef.current || doneRef.current) return
      savingRef.current = true
      doneRef.current = true
      setSaving(true)
      setEndAt(null)
      const minutes = Math.max(1, Math.round(elapsedSeconds / 60))
      const endedAt = Date.now()
      const started = startedAt ?? endedAt - minutes * 60_000

      void (async () => {
        const saved = await planner.addFocusRecord({
          planId: plan.id,
          subjectId: plan.subjectId,
          minutes,
          startedAt: started,
          endedAt,
          memo: `집중 타이머 · ${plan.title}`,
        })
        let completed = false
        if (saved && full) {
          completed = await planner.setPlanStatus(plan.id, 'completed')
        }
        setSaving(false)
        setDone(true)
        setMessage(
          saved
            ? completed
              ? `${minutes}분 집중을 기록하고 계획을 완료했어요.`
              : `${minutes}분 집중을 기록했어요. 계획은 아직 완료 전이에요.`
            : '집중 기록을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
        )
        savingRef.current = false
      })()
    },
    [plan, planner, startedAt],
  )

  useEffect(() => {
    finishRef.current = finish
  }, [finish])

  useEffect(() => {
    if (endAt === null) return
    const tick = () => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
      setRemaining(left)
      if (left <= 0) finishRef.current(targetSec, true)
    }
    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [endAt, targetSec])

  const running = endAt !== null
  const progress = Math.round(((targetSec - remaining) / targetSec) * 100)
  const canStop = startedAt !== null || running || remaining < targetSec
  const subject = planner.subjects.find((item) => item.id === plan.subjectId)

  const close = () => {
    if (saving) return
    if (!done && canStop) {
      if (!window.confirm('집중 기록을 저장하지 않고 닫을까요?')) return
    }
    onClose()
  }

  const toggle = () => {
    if (done) return
    if (running) {
      setRemaining(Math.max(0, Math.ceil((endAt - Date.now()) / 1000)))
      setEndAt(null)
      return
    }
    if (remaining <= 0) return
    setStartedAt((prev) => prev ?? Date.now())
    setEndAt(Date.now() + remaining * 1000)
  }

  const stop = () => {
    if (!canStop || saving || done) return
    const left = running
      ? Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
      : remaining
    finishRef.current(Math.max(1, targetSec - left), false)
  }

  return (
    <Modal
      title="집중 타이머"
      subtitle="집중한 시간은 공부 기록에 저장되고, 타이머를 끝까지 채우면 계획도 완료됩니다."
      onClose={close}
      small
      footer={
        done ? (
          <button type="button" onClick={close} className={primaryButton}>
            닫기
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={stop}
              disabled={!canStop || saving}
              className={ghostButton}
            >
              그만하기
            </button>
            <button
              type="button"
              onClick={toggle}
              disabled={saving}
              className={primaryButton}
            >
              {running ? '일시정지' : startedAt ? '계속하기' : '집중 시작'}
            </button>
          </>
        )
      }
    >
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#f1eeff] px-3 py-1 text-[11px] font-extrabold text-[#6a63c9]">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: subject?.color ?? '#8b88a3' }}
          />
          {subject?.name ?? '과목'} · {plan.title}
        </div>
        <div className="mt-5 font-mono text-[clamp(52px,15vw,76px)] leading-none font-extrabold tracking-[-0.06em] tabular-nums text-[#3d3a55]">
          {formatMMSS(remaining * 1000)}
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#f1eef9]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#8d86f5] to-[#b9b4ff] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-[#a8a5bb]">
          <span>{running ? '집중 중' : startedAt ? '일시정지' : '준비됨'}</span>
          <span>
            목표 {Math.min(60, plan.targetMinutes)}분 · {progress}%
          </span>
        </div>
        {message && (
          <p className="mt-4 rounded-xl bg-[#e8f8f0] px-3 py-2.5 text-sm text-[#3f9f7f]">
            {message}
          </p>
        )}
        {saving && (
          <p className="mt-3 text-xs text-[#8b88a3]">기록을 저장하는 중…</p>
        )}
        {!done && (
          <p className="mt-4 text-xs leading-relaxed text-[#a8a5bb]">
            타이머를 중간에 멈춰도 공부 기록은 저장돼요. 계획 완료는 직접
            체크하거나 타이머를 끝까지 채우면 됩니다.
          </p>
        )}
        {done && (
          <p className="mt-3 text-[11px] text-[#a8a5bb]">
            기록 날짜: {todayKey()}
          </p>
        )}
      </div>
    </Modal>
  )
}
