import { useLeaderboard } from '../hooks/useLeaderboard'
import { levelInfo } from '../lib/points'
import type { LeaderboardEntry, Role } from '../types'
import { Avatar } from './Avatar'
import { PointsCard } from './PointsCard'
import {
  EmptyState,
  PageHeader,
  panelClass,
} from './ui'

const PODIUM = [
  { medal: '🥇', box: 'from-[#fff6d9] to-[#fffdf5]', ring: 'ring-[#f1d58b]' },
  { medal: '🥈', box: 'from-[#f0f1f8] to-[#fdfdff]', ring: 'ring-[#cfd2e2]' },
  { medal: '🥉', box: 'from-[#fff0e5] to-[#fffdfb]', ring: 'ring-[#e9c3a4]' },
]

export function Leaderboard({
  highlightUid,
  viewerRole,
}: {
  highlightUid: string
  viewerRole: Role
}) {
  const { entries, mine, loading, error } = useLeaderboard(highlightUid)
  const mineRank = entries.findIndex((entry) => entry.uid === highlightUid)
  const podium = entries.slice(0, 3)
  const rest = entries.slice(3)

  return (
    <div>
      <PageHeader
        eyebrow="POINT LEAGUE"
        title={viewerRole === 'parent' ? '자녀의 포인트 순위' : '포인트 순위'}
        description={
          viewerRole === 'parent'
            ? '자녀가 계획을 완료하며 모은 포인트와 전체 순위를 확인해요.'
            : '계획을 완료할 때마다 포인트가 쌓여요. 친구들과 즐겁게 경쟁해 보세요.'
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PointsCard
            points={mine?.points ?? 0}
            label={viewerRole === 'parent' ? '자녀 포인트' : '내 포인트'}
          />
          {mine && mineRank < 0 && (
            <p className="mt-2 px-1 text-right text-[11px] text-[#8b88a3]">
              현재 상위 20위 밖이에요. 계획을 완료해 순위를 올려보세요!
            </p>
          )}
        </div>
        <div className={`${panelClass} flex flex-col justify-center p-5`}>
          <p className="text-[11px] font-extrabold tracking-[0.08em] text-[#7c74f0] uppercase">
            HOW TO EARN
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#5f5c78]">
            공부 계획을 완료하면 <strong>10P</strong>와 목표 시간에 따른
            보너스 포인트를 받아요. 30분 계획은 <strong>25P</strong>, 60분
            계획은 <strong>40P</strong>예요.
          </p>
          <p className="mt-2 text-xs text-[#8b88a3]">
            100P마다 레벨이 오르고, 레벨에 따라 새싹·탐험가·성실왕·집중
            마스터·전설 칭호를 받아요.
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-[#f6d6dd] bg-[#ffeff3] px-4 py-3 text-sm text-[#d96a7c]">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-center text-sm text-[#8b88a3]">
          순위를 불러오는 중…
        </p>
      ) : entries.length === 0 ? (
        <div className={`${panelClass} mt-5`}>
          <EmptyState
            icon="🏆"
            title="아직 포인트 기록이 없어요"
            description="첫 번째 계획을 완료하고 순위표의 주인공이 되어보세요."
          />
        </div>
      ) : (
        <>
          <section className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            {podium.map((entry, index) => {
              const style = PODIUM[index]
              const info = levelInfo(entry.points)
              const highlighted = entry.uid === highlightUid
              return (
                <article
                  key={entry.uid}
                  className={`rounded-2xl border border-[#ece8f7] bg-gradient-to-b ${style.box} p-3 text-center shadow-[0_10px_26px_rgba(111,104,232,0.06)] sm:p-4 ${
                    highlighted ? 'ring-2 ring-[#b9b4ff]' : ''
                  }`}
                >
                  <div className="text-2xl">{style.medal}</div>
                  <div className="mt-2 flex justify-center">
                    <Avatar
                      name={entry.name}
                      photo={entry.photo || undefined}
                      size={38}
                    />
                  </div>
                  <div className="mt-2 truncate text-xs font-extrabold text-[#3d3a55] sm:text-sm">
                    {entry.name}
                  </div>
                  <div className="mt-0.5 text-[10px] text-[#8b88a3] sm:text-[11px]">
                    Lv.{info.level} {info.title}
                  </div>
                  <div className="mt-2 text-base font-extrabold text-[#6f68e8] sm:text-lg">
                    {entry.points}P
                  </div>
                </article>
              )
            })}
          </section>

          {rest.length > 0 && (
            <section className={`${panelClass} mt-4 overflow-hidden`}>
              {rest.map((entry, index) => (
                <RankRow
                  key={entry.uid}
                  entry={entry}
                  rank={index + 4}
                  highlighted={entry.uid === highlightUid}
                />
              ))}
            </section>
          )}

          {mine && mineRank >= 0 && (
            <p className="mt-3 text-right text-[11px] text-[#8b88a3]">
              내 기록은 상위 {mineRank + 1}위에 있어요.
            </p>
          )}
        </>
      )}
    </div>
  )
}

function RankRow({
  entry,
  rank,
  highlighted,
}: {
  entry: LeaderboardEntry
  rank: number
  highlighted: boolean
}) {
  const info = levelInfo(entry.points)
  return (
    <div
      className={`flex items-center gap-3 border-b border-[#f1eef9] px-4 py-3 last:border-b-0 ${
        highlighted ? 'bg-[#f7f4ff]' : ''
      }`}
    >
      <span className="w-7 shrink-0 text-center text-xs font-extrabold text-[#a8a5bb]">
        {rank}
      </span>
      <Avatar name={entry.name} photo={entry.photo || undefined} size={30} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-extrabold text-[#3d3a55]">
          {entry.name}
          {highlighted && (
            <span className="ml-1.5 rounded-full bg-[#f1eeff] px-1.5 py-0.5 text-[9px] text-[#6a63c9]">
              나
            </span>
          )}
        </div>
        <div className="text-[10px] text-[#8b88a3]">
          Lv.{info.level} {info.title}
        </div>
      </div>
      <strong className="shrink-0 text-sm font-extrabold text-[#6f68e8]">
        {entry.points}P
      </strong>
    </div>
  )
}
