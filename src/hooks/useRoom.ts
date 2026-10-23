import { useEffect, useMemo, useRef, useState } from 'react'
import type { User } from 'firebase/auth'
import {
  get,
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  set,
  update,
} from 'firebase/database'
import { db } from '../firebase'
import { initialTimer, nextPhase, pauseTimer, resetTimer, setDurations, startTimer } from '../lib/pomodoro'
import { recordFocus } from '../lib/stats'
import type { ChatMsg, Member, Stroke, TimerState } from '../types'

interface RoomMeta {
  code: string
  name: string
  hostUid: string
  createdAt: number
}

export interface RoomActions {
  start: () => void
  pause: () => void
  advance: () => void
  reset: () => void
  setDurations: (focusMin: number, breakMin: number) => void
  send: (text: string) => void
  addStroke: (pts: number[], color: string, w: number) => { id: string; saved: Promise<string | null> }
  undoStroke: () => void
  eraseAt: (x: number, y: number, tol: number) => void
  clearBoard: () => void
}

const HEARTBEAT_MS = 60_000
const MAX_MESSAGES = 250

function scheduleRoomCleanup(code: string): void {
  window.setTimeout(
    async () => {
      try {
        const snap = await get(ref(db, `rooms/${code}/members`))
        if (!snap.exists() || snap.size === 0) {
          await remove(ref(db, `rooms/${code}`))
        }
      } catch {
        // 방 확인 실패 시 그대로 둔다
      }
    },
    15_000,
  )
}

function toMemberList(value: unknown): Member[] {
  if (!value || typeof value !== 'object') return []
  return Object.values(value as Record<string, Member>).sort(
    (a, b) => a.joinedAt - b.joinedAt || a.uid.localeCompare(b.uid),
  )
}

export function useRoom(code: string, user: User) {
  const [meta, setMeta] = useState<RoomMeta | null>(null)
  const [gone, setGone] = useState(false)
  const [timer, setTimer] = useState<TimerState>(() => initialTimer())
  const [members, setMembers] = useState<Member[]>([])
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [strokes, setStrokes] = useState<Stroke[]>([])

  const latest = useRef({ meta, timer, members })
  useEffect(() => {
    latest.current = { meta, timer, members }
  })

  const memberRef = useMemo(() => ref(db, `rooms/${code}/members/${user.uid}`), [code, user.uid])

  // 참가 + 끊김 자동 정리
  useEffect(() => {
    let cancelled = false
    const join = async () => {
      const info = {
        uid: user.uid,
        name: user.displayName ?? '익명',
        photo: user.photoURL ?? '',
        joinedAt: Date.now(),
      }
      try {
        await set(memberRef, info)
        if (cancelled) return
        await onDisconnect(memberRef).remove()
      } catch {
        // 방이 이미 삭제된 경우 무시
      }
    }
    void join()
    return () => {
      cancelled = true
      void onDisconnect(memberRef).cancel()
      void remove(memberRef)
      scheduleRoomCleanup(code)
    }
  }, [memberRef, code, user.uid, user.displayName, user.photoURL])

  // 구독
  useEffect(() => {
    const metaRef = ref(db, `rooms/${code}/meta`)
    const timerRef = ref(db, `rooms/${code}/timer`)
    const membersRef = ref(db, `rooms/${code}/members`)
    const msgsRef = ref(db, `rooms/${code}/messages`)
    const strokesRef = ref(db, `rooms/${code}/board/strokes`)

    const unsubs = [
      onValue(metaRef, (snap) => {
        if (!snap.exists()) {
          setGone(true)
          setMeta(null)
          return
        }
        setMeta(snap.val() as RoomMeta)
      }),
      onValue(timerRef, (snap) => {
        setTimer(snap.exists() ? ({ ...(snap.val() as TimerState) } as TimerState) : initialTimer())
      }),
      onValue(membersRef, (snap) => {
        setMembers(toMemberList(snap.val()))
      }),
      onValue(msgsRef, (snap) => {
        const val = (snap.val() ?? {}) as Record<string, ChatMsg>
        const list = Object.entries(val)
          .map(([id, m]) => ({ ...m, id }))
          .sort((a, b) => a.ts - b.ts)
        setMessages(list.slice(-150))
        if (list.length > MAX_MESSAGES) {
          const upd: Record<string, null> = {}
          for (const m of list.slice(0, list.length - MAX_MESSAGES)) upd[m.id] = null
          void update(msgsRef, upd)
        }
      }),
      onValue(strokesRef, (snap) => {
        const val = (snap.val() ?? {}) as Record<string, Stroke>
        setStrokes(Object.entries(val).map(([id, s]) => ({ ...s, id })))
      }),
    ]
    return () => unsubs.forEach((u) => u())
  }, [code])

  // 방장 위임 (방장이 나가면 가장 오래 참여한 사람)
  useEffect(() => {
    if (!meta || members.length === 0) return
    if (members.some((m) => m.uid === meta.hostUid)) return
    const next = members[0]
    void update(ref(db, `rooms/${code}/meta`), { hostUid: next.uid })
  }, [meta, members, code])

  // 빈 방 정리
  useEffect(() => {
    if (!meta || members.length > 0) return
    scheduleRoomCleanup(code)
  }, [meta, members.length, code])

  // 타이머 자동 진행 (방장 우선, 방장 부재 시 가장 오래 참여한 사람)
  useEffect(() => {
    const id = window.setInterval(() => {
      const { meta: m, timer: t, members: mem } = latest.current
      if (!m || !t.running) return
      const now = Date.now()
      if (t.endsAt > now) return
      const hostPresent = mem.some((x) => x.uid === m.hostUid)
      const advancer = hostPresent ? m.hostUid : mem[0]?.uid
      if (advancer !== user.uid) return
      void update(ref(db, `rooms/${code}/timer`), nextPhase(t, now, user.uid))
    }, 400)
    return () => window.clearInterval(id)
  }, [code, user.uid])

  // 집중 시간 기록 (60초마다)
  useEffect(() => {
    let last = Date.now()
    const flush = () => {
      const { timer: t } = latest.current
      if (t.phase !== 'focus' || !t.running) {
        last = Date.now()
        return
      }
      const ms = Math.min(HEARTBEAT_MS, Date.now() - last)
      last = Date.now()
      if (ms >= 15_000) {
        void recordFocus(user.uid, user.displayName ?? '익명', ms)
      }
    }
    const id = window.setInterval(flush, HEARTBEAT_MS)
    return () => {
      window.clearInterval(id)
      flush()
    }
  }, [user.uid, user.displayName])

  const isHost = meta?.hostUid === user.uid

  const actions: RoomActions = useMemo(() => {
    const timerNode = () => ref(db, `rooms/${code}/timer`)
    const now = () => Date.now()
    const t = () => latest.current.timer
    return {
      start: () => void update(timerNode(), startTimer(t(), now(), user.uid)),
      pause: () => void update(timerNode(), pauseTimer(t(), now(), user.uid)),
      advance: () => void update(timerNode(), nextPhase(t(), now(), user.uid)),
      reset: () => void update(timerNode(), resetTimer(t(), user.uid)),
      setDurations: (focusMin: number, breakMin: number) =>
        void update(timerNode(), setDurations(t(), focusMin, breakMin, user.uid)),
      send: (text: string) => {
        const trimmed = text.trim()
        if (!trimmed) return
        void push(ref(db, `rooms/${code}/messages`), {
          uid: user.uid,
          name: user.displayName ?? '익명',
          photo: user.photoURL ?? '',
          text: trimmed.slice(0, 500),
          ts: Date.now(),
        })
      },
      addStroke: (pts, color, w) => {
        const node = push(ref(db, `rooms/${code}/board/strokes`))
        const id = node.key ?? `local-${Date.now()}`
        const saved = set(node, { uid: user.uid, color, w, pts })
          .then(() => null)
          .catch((err: unknown) => {
            console.error('[board] 그림 저장 실패:', err)
            if (typeof err === 'object' && err !== null && 'code' in err) {
              return String((err as { code: unknown }).code)
            }
            return err instanceof Error ? err.message : 'unknown_error'
          })
        return { id, saved }
      },
      undoStroke: () => {
        const own = strokes.filter((s) => s.uid === user.uid)
        const last = own[own.length - 1]
        if (last) void remove(ref(db, `rooms/${code}/board/strokes/${last.id}`))
      },
      eraseAt: (x, y, tol) => {
        const hit: Record<string, null> = {}
        for (const s of strokes) {
          const r = (s.w / 2 + tol) * 1.5
          for (let i = 0; i + 1 < s.pts.length; i += 2) {
            const dx = s.pts[i] - x
            const dy = s.pts[i + 1] - y
            if (dx * dx + dy * dy <= r * r) {
              hit[s.id] = null
              break
            }
          }
        }
        if (Object.keys(hit).length > 0) void update(ref(db, `rooms/${code}/board/strokes`), hit)
      },
      clearBoard: () => void remove(ref(db, `rooms/${code}/board/strokes`)),
    }
  }, [code, strokes, user.uid, user.displayName, user.photoURL])

  return { gone, meta, timer, members, messages, strokes, isHost, actions, code }
}

export type RoomApi = ReturnType<typeof useRoom>
