import { useState } from 'react'
import type { User } from 'firebase/auth'
import { get, ref, set } from 'firebase/database'
import { db } from '../firebase'
import { initialTimer } from '../lib/pomodoro'
import {
  Field,
  PageHeader,
  inputClass,
  panelClass,
  primaryButton,
} from './ui'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function genCode(): string {
  let out = ''
  for (let i = 0; i < 6; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return out
}

interface LobbyProps {
  user: User
  onEnter: (code: string) => void
}

export function Lobby({ user, onEnter }: LobbyProps) {
  const [roomName, setRoomName] = useState(
    `${user.displayName ?? '우리'}의 스터디 룸`,
  )
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createRoom = async () => {
    setBusy(true)
    setError(null)
    try {
      for (let i = 0; i < 10; i++) {
        const candidate = genCode()
        const snap = await get(ref(db, `rooms/${candidate}/meta`))
        if (snap.exists()) continue
        await set(ref(db, `rooms/${candidate}/meta`), {
          code: candidate,
          name: roomName.trim() || '스터디 룸',
          hostUid: user.uid,
          createdAt: Date.now(),
        })
        await set(ref(db, `rooms/${candidate}/timer`), initialTimer())
        onEnter(candidate)
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
    const candidate = code.trim().toUpperCase()
    if (candidate.length !== 6) {
      setError('방 코드는 6자리입니다.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const snap = await get(ref(db, `rooms/${candidate}/meta`))
      if (!snap.exists()) {
        setError('존재하지 않는 방입니다.')
        return
      }
      onEnter(candidate)
    } catch (e) {
      setError(e instanceof Error ? e.message : '참가에 실패했습니다')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="LIVE STUDY ROOM"
        title="함께 집중하는 스터디 룸"
        description="6자리 코드로 친구를 초대하고, 공유 포모도로·화이트보드·채팅으로 함께 공부하세요."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <section className={`${panelClass} p-6`}>
          <h2 className="mb-1 text-lg font-extrabold tracking-[-0.03em] text-[#202538]">
            새 방 만들기
          </h2>
          <p className="mb-4 text-sm text-[#72778d]">
            방 코드를 공유하면 친구가 바로 들어올 수 있어요.
          </p>
          <Field label="방 이름">
            <input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              maxLength={30}
              className={`${inputClass} mb-4`}
            />
          </Field>
          <button
            type="button"
            onClick={createRoom}
            disabled={busy}
            className={`${primaryButton} w-full`}
          >
            방 만들기
          </button>
        </section>

        <section className={`${panelClass} p-6`}>
          <h2 className="mb-1 text-lg font-extrabold tracking-[-0.03em] text-[#202538]">
            코드로 참가
          </h2>
          <p className="mb-4 text-sm text-[#72778d]">
            받은 6자리 코드를 입력하세요.
          </p>
          <Field label="방 코드">
            <input
              value={code}
              onChange={(e) =>
                setCode(
                  e.target.value
                    .replace(/[^a-zA-Z0-9]/g, '')
                    .toUpperCase()
                    .slice(0, 6),
                )
              }
              placeholder="예: K7QM2X"
              className={`${inputClass} mb-4 font-mono text-lg tracking-[0.3em] uppercase`}
            />
          </Field>
          <button
            type="button"
            onClick={joinRoom}
            disabled={busy || code.length !== 6}
            className={`${primaryButton} w-full`}
          >
            참가하기
          </button>
        </section>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-[#fff0f2] px-3 py-2 text-center text-sm text-[#c84f61]">
          {error}
        </p>
      )}

      <section className={`${panelClass} mt-4 p-5`}>
        <h2 className="mb-3 text-sm font-extrabold text-[#202538]">
          스터디 룸에서는 이렇게 공부해요
        </h2>
        <ul className="grid gap-2 text-sm text-[#5f6280] sm:grid-cols-3">
          <li className="rounded-lg bg-[#f7f8ff] px-3 py-2.5">
            ◷ 방 전체가 같은 포모도로 타이머를 공유해요
          </li>
          <li className="rounded-lg bg-[#f7f8ff] px-3 py-2.5">
            ✏️ 화이트보드에 함께 그리고 채팅으로 소통해요
          </li>
          <li className="rounded-lg bg-[#f7f8ff] px-3 py-2.5">
            ▤ 집중 시간은 자동으로 공부 기록에 쌓여요
          </li>
        </ul>
      </section>
    </div>
  )
}
