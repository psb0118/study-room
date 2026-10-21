import { useEffect, useMemo, useState } from 'react'
import type { User } from 'firebase/auth'
import { onSnapshot } from 'firebase/firestore'
import { userDocRef } from '../lib/stats'
import { addDays, dateKey } from '../lib/streak'
import type { UserStats } from '../types'

interface DashboardProps {
  user: User
  onBack: () => void
}

function fmtDuration(ms: number): string {
  const total = Math.floor(ms / 60_000)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h > 0) return `${h}시간 ${m}분`
  return `${m}분`
}

export function Dashboard({ user, onBack }: DashboardProps) {
  const [stats, setStats] = useState<UserStats | null>(null)

  useEffect(() => {
    return onSnapshot(userDocRef(user.uid), (snap) => {
      setStats(snap.exists() ? (snap.data() as UserStats) : null)
    })
  }, [user.uid])

  const [today] = useState(() => dateKey(new Date()))

  const week = useMemo(() => {
    const out: { key: string; label: string; ms: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const key = addDays(today, -i)
      const [, , d] = key.split('-')
      out.push({ key, label: d, ms: stats?.days?.[key] ?? 0 })
    }
    return out
  }, [stats, today])

  const max = Math.max(60_000, ...week.map((d) => d.ms))
  const todayMs = stats?.days?.[today] ?? 0

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">내 학습 기록</h1>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
        >
          ← 로비
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card label="오늘" value={fmtDuration(todayMs)} />
        <Card label="연속 학습" value={`${stats?.streak ?? 0}일`} accent />
        <Card label="최장 연속" value={`${stats?.longest ?? 0}일`} />
        <Card label="누적" value={fmtDuration(stats?.totalFocusMs ?? 0)} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-300">최근 7일</h2>
        <div className="flex h-48 items-end gap-3">
          {week.map((d) => (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-2">
              <div className="text-[10px] text-slate-400">{d.ms > 0 ? fmtDuration(d.ms) : ''}</div>
              <div
                className={`w-full rounded-t-md transition-all ${d.ms > 0 ? 'bg-indigo-500' : 'bg-white/10'}`}
                style={{ height: `${Math.max(4, (d.ms / max) * 100)}%` }}
              />
              <div className="text-xs text-slate-400">{d.label}</div>
            </div>
          ))}
        </div>
        {Object.keys(stats?.days ?? {}).length === 0 && (
          <p className="mt-4 text-center text-sm text-slate-500">
            아직 기록이 없어요. 방에 들어가 집중 타이머를 돌리면 자동으로 기록됩니다.
          </p>
        )}
      </div>
    </div>
  )
}

function Card({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-lg font-bold ${accent ? 'text-amber-300' : 'text-white'}`}>{value}</div>
    </div>
  )
}
