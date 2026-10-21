import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { onSnapshot } from 'firebase/firestore'
import { get, ref, set } from 'firebase/database'
import { db } from '../firebase'
import { initialTimer } from '../lib/pomodoro'
import { userDocRef } from '../lib/stats'
import { dateKey } from '../lib/streak'
import type { UserStats } from '../types'
import { Avatar } from './Avatar'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function genCode(): string {
  let out = ''
  for (let i = 0; i < 6; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return out
}

function fmtDuration(ms: number): string {
  const total = Math.floor(ms / 60_000)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h > 0) return `${h}시간 ${m}분`
  return `${m}분`
}

interface LobbyProps {
  user: User
  onEnter: (code: string) => void
  onOpenDashboard: () => void
  onLogout: () => void
}

export function Lobby({ user, onEnter, onOpenDashboard, onLogout }: LobbyProps) {
  const [roomName, setRoomName] = useState(`${user.displayName ?? '우리'}의 스터디 룸`)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [today] = useState(() => dateKey(new Date()))

  useEffect(() => {
    return onSnapshot(userDocRef(user.uid), (snap) => {
      setStats(snap.exists() ? (snap.data() as UserStats) : null)
    })
  }, [user.uid])

  const createRoom = async () => {
    setBusy(true)
    setError(null)
    try {
      for (let i = 0; i < 10; i++) {
        const c = genCode()
        const snap = await get(ref(db, `rooms/${c}/meta`))
        if (snap.exists()) continue
        await set(ref(db, `rooms/${c}/meta`), {
          code: c,
          name: roomName.trim() || '스터디 룸',
          hostUid: user.uid,
          createdAt: Date.now(),
        })
        await set(ref(db, `rooms/${c}/timer`), initialTimer())
        onEnter(c)
        return
      }
      setError('방 코드를 만들 수 없습니다. 다시 시도해 주세요.')
    } catch (e) {
      setError(e instanceof Error ? e.message : '방 생성에 실패했습니다')
    } finally {
      setBusy(false)
    }
  }

  const joinRoom = async () => {
    const c = code.trim().toUpperCase()
    if (c.length !== 6) {
      setError('방 코드는 6자리입니다.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const snap = await get(ref(db, `rooms/${c}/meta`))
      if (!snap.exists()) {
        setError('존재하지 않는 방입니다.')
        return
      }
      onEnter(c)
    } catch (e) {
      setError(e instanceof Error ? e.message : '참가에 실패했습니다')
    } finally {
      setBusy(false)
    }
  }

  const todayMs = stats?.days?.[today] ?? 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={user.displayName ?? '익명'} photo={user.photoURL ?? undefined} size={40} />
          <div>
            <div className="font-semibold text-white">{user.displayName ?? '익명'}</div>
            <button type="button" onClick={onLogout} className="text-xs text-slate-400 hover:text-slate-200">
              로그아웃
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenDashboard}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
        >
          내 기록
        </button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label="오늘 학습" value={fmtDuration(todayMs)} />
        <StatCard label="연속 학습" value={`${stats?.streak ?? 0}일`} accent />
        <StatCard label="누적 학습" value={fmtDuration(stats?.totalFocusMs ?? 0)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="mb-1 text-lg font-semibold text-white">새 방 만들기</h2>
          <p className="mb-4 text-sm text-slate-400">방 코드를 친구에게 공유하면 같이 들어올 수 있어요.</p>
          <label className="mb-2 block text-xs font-medium text-slate-400">방 이름</label>
          <input
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            maxLength={30}
            className="mb-4 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2.5 text-white outline-none focus:border-indigo-400/60"
          />
          <button
            type="button"
            onClick={createRoom}
            disabled={busy}
            className="w-full rounded-lg bg-indigo-500 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-50"
          >
            방 만들기
          </button>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="mb-1 text-lg font-semibold text-white">코드로 참가</h2>
          <p className="mb-4 text-sm text-slate-400">받은 6자리 코드를 입력하세요.</p>
          <label className="mb-2 block text-xs font-medium text-slate-400">방 코드</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6))}
            placeholder="예: K7QM2X"
            className="mb-4 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2.5 font-mono text-lg tracking-[0.3em] text-white uppercase outline-none focus:border-indigo-400/60"
          />
          <button
            type="button"
            onClick={joinRoom}
            disabled={busy || code.length !== 6}
            className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
          >
            참가하기
          </button>
        </section>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-center text-sm text-red-300">{error}</p>
      )}
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-lg font-bold ${accent ? 'text-amber-300' : 'text-white'}`}>{value}</div>
    </div>
  )
}
