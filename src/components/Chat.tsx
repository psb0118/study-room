import { useEffect, useRef, useState } from 'react'
import type { ChatMsg, Member } from '../types'
import { Avatar } from './Avatar'

interface ChatProps {
  messages: ChatMsg[]
  members: Member[]
  currentUid: string
  onSend: (text: string) => void
}

export function Chat({ messages, members, currentUid, onSend }: ChatProps) {
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (nearBottom) el.scrollTop = el.scrollHeight
  }, [messages])

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
  }

  return (
    <section className="surface flex min-h-0 flex-col p-5">
      <h2 className="mb-3 text-sm font-extrabold text-[#202538]">채팅</h2>
      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1"
      >
        {messages.map((message) => {
          const mine = message.uid === currentUid
          const member = members.find((x) => x.uid === message.uid)
          return (
            <div
              key={message.id}
              className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}
            >
              <Avatar name={message.name} photo={message.photo} size={26} />
              <div className={`max-w-[75%] ${mine ? 'text-right' : ''}`}>
                <div
                  className="mb-0.5 flex items-baseline gap-2 text-[11px] text-[#b0b4c3]"
                  style={
                    mine ? { justifyContent: 'flex-end' } : undefined
                  }
                >
                  <span
                    className={
                      mine
                        ? 'font-bold text-[#5969df]'
                        : 'font-semibold text-[#72778d]'
                    }
                  >
                    {mine ? '나' : message.name}
                  </span>
                  {!member && <span className="text-[#c9ccd8]">(나감)</span>}
                  <span>
                    {new Date(message.ts).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div
                  className={`inline-block rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap ${
                    mine
                      ? 'bg-[#5969df] text-white'
                      : 'bg-[#f0f2f7] text-[#202538]'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            </div>
          )
        })}
        {messages.length === 0 && (
          <p className="py-6 text-center text-sm text-[#9498a7]">
            대화를 시작해 보세요.
          </p>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) submit()
          }}
          maxLength={500}
          placeholder="메시지 입력"
          className="input-base min-w-0 flex-1"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim()}
          className="btn btn-primary px-4"
        >
          전송
        </button>
      </div>
    </section>
  )
}
