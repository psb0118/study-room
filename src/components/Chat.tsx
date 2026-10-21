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
    const t = text.trim()
    if (!t) return
    onSend(t)
    setText('')
  }

  return (
    <section className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-slate-900/60 p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-300">채팅</h2>
      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((m) => {
          const mine = m.uid === currentUid
          const member = members.find((x) => x.uid === m.uid)
          return (
            <div key={m.id} className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
              <Avatar name={m.name} photo={m.photo} size={26} />
              <div className={`max-w-[75%] ${mine ? 'text-right' : ''}`}>
                <div className="mb-0.5 flex items-baseline gap-2 text-[11px] text-slate-500"
                  style={mine ? { justifyContent: 'flex-end' } : undefined}
                >
                  <span className={mine ? 'text-indigo-300' : 'text-slate-400'}>
                    {mine ? '나' : m.name}
                  </span>
                  {!member && <span className="text-slate-600">(나감)</span>}
                  <span>{new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div
                  className={`inline-block rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap ${
                    mine
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white/10 text-slate-100'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            </div>
          )
        })}
        {messages.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500">대화를 시작해 보세요.</p>
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
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400/60"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim()}
          className="rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-40"
        >
          전송
        </button>
      </div>
    </section>
  )
}
