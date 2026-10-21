import { useState } from 'react'
import type { User } from 'firebase/auth'
import { useRoom } from '../hooks/useRoom'
import { Chat } from './Chat'
import { Members } from './Members'
import { TimerPanel } from './TimerPanel'
import { Whiteboard } from './Whiteboard'

interface RoomProps {
  code: string
  user: User
  onLeave: () => void
}

export function Room({ code, user, onLeave }: RoomProps) {
  const { gone, meta, timer, members, messages, strokes, actions } = useRoom(code, user)
  const [copied, setCopied] = useState(false)

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      window.prompt('방 코드를 복사하세요', code)
    }
  }

  if (gone) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="mb-2 text-4xl">🚪</p>
        <h1 className="mb-2 text-xl font-bold text-white">방이 종료되었습니다</h1>
        <p className="mb-6 text-sm text-slate-400">모든 참가자가 나가서 방이 자동으로 삭제됐어요.</p>
        <button
          type="button"
          onClick={onLeave}
          className="rounded-lg bg-indigo-500 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-400"
        >
          로비로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-5">
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-bold text-white">{meta?.name ?? '스터디 룸'}</h1>
        <button
          type="button"
          onClick={copyCode}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-sm tracking-[0.2em] text-slate-200 uppercase transition hover:bg-white/10"
          title="방 코드 복사"
        >
          {code} <span className="ml-1 text-xs tracking-normal text-slate-400">{copied ? '복사됨!' : '복사'}</span>
        </button>
        <span className="text-xs text-slate-500">참가자 {members.length}명</span>
        <button
          type="button"
          onClick={onLeave}
          className="ml-auto rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
        >
          나가기
        </button>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <TimerPanel timer={timer} members={members} actions={actions} />
          <Whiteboard strokes={strokes} actions={actions} />
        </div>
        <div className="flex min-h-0 flex-col gap-4">
          <Members members={members} hostUid={meta?.hostUid ?? ''} currentUid={user.uid} />
          <div className="flex min-h-[380px] flex-col">
            <Chat messages={messages} members={members} currentUid={user.uid} onSend={actions.send} />
          </div>
        </div>
      </div>
    </div>
  )
}
