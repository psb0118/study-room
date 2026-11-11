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
  const { gone, meta, timer, members, messages, strokes, actions } = useRoom(
    code,
    user,
  )
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
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
        <div className="surface w-full px-6 py-12 text-center">
          <p className="mb-2 text-4xl">🚪</p>
          <h1 className="mb-2 text-xl font-extrabold text-[#202538]">
            방이 종료되었습니다
          </h1>
          <p className="mb-6 text-sm text-[#72778d]">
            모든 참가자가 나가서 방이 자동으로 삭제됐어요.
          </p>
          <button type="button" onClick={onLeave} className="btn btn-primary">
            로비로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <div className="mx-auto max-w-7xl px-4 py-5">
        <header className="mb-4 flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-extrabold tracking-[-0.03em] text-[#202538]">
            {meta?.name ?? '스터디 룸'}
          </h1>
          <button
            type="button"
            onClick={copyCode}
            className="rounded-lg border border-[#e7e9f2] bg-white px-3 py-1.5 font-mono text-sm tracking-[0.2em] text-[#5f6579] uppercase transition hover:border-[#d9deee] hover:bg-[#fafbfe]"
            title="방 코드 복사"
          >
            {code}{' '}
            <span className="ml-1 text-xs tracking-normal text-[#9498a7]">
              {copied ? '복사됨!' : '복사'}
            </span>
          </button>
          <span className="text-xs text-[#9498a7]">
            참가자 {members.length}명
          </span>
          <button
            type="button"
            onClick={onLeave}
            className="btn ml-auto"
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
            <Members
              members={members}
              hostUid={meta?.hostUid ?? ''}
              currentUid={user.uid}
            />
            <div className="flex min-h-[380px] flex-col">
              <Chat
                messages={messages}
                members={members}
                currentUid={user.uid}
                onSend={actions.send}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
