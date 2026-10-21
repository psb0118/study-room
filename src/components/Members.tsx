import type { Member } from '../types'
import { Avatar } from './Avatar'

interface MembersProps {
  members: Member[]
  hostUid: string
  currentUid: string
}

export function Members({ members, hostUid, currentUid }: MembersProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300">참가자</h2>
        <span className="text-xs text-slate-500">{members.length}명</span>
      </div>
      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m.uid} className="flex items-center gap-3">
            <Avatar name={m.name} photo={m.photo} size={30} />
            <span className="truncate text-sm text-slate-200">{m.name}</span>
            {m.uid === hostUid && (
              <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 ring-1 ring-amber-400/30">
                방장
              </span>
            )}
            {m.uid === currentUid && <span className="text-[10px] text-slate-500">(나)</span>}
          </li>
        ))}
        {members.length === 0 && <li className="text-sm text-slate-500">아직 아무도 없어요</li>}
      </ul>
    </section>
  )
}
