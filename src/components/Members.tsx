import type { Member } from '../types'
import { Avatar } from './Avatar'

interface MembersProps {
  members: Member[]
  hostUid: string
  currentUid: string
}

export function Members({ members, hostUid, currentUid }: MembersProps) {
  return (
    <section className="surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-[#3d3a55]">참가자</h2>
        <span className="text-xs text-[#a8a5bb]">{members.length}명</span>
      </div>
      <ul className="space-y-2">
        {members.map((member) => (
          <li key={member.uid} className="flex items-center gap-3">
            <Avatar name={member.name} photo={member.photo} size={30} />
            <span className="truncate text-sm font-medium text-[#3d3a55]">
              {member.name}
            </span>
            {member.uid === hostUid && (
              <span className="rounded-md bg-[#fff9ec] px-1.5 py-0.5 text-[10px] font-extrabold text-[#8f7b58]">
                방장
              </span>
            )}
            {member.uid === currentUid && (
              <span className="text-[10px] text-[#a8a5bb]">(나)</span>
            )}
          </li>
        ))}
        {members.length === 0 && (
          <li className="text-sm text-[#a8a5bb]">아직 아무도 없어요</li>
        )}
      </ul>
    </section>
  )
}
