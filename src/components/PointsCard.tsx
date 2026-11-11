import { levelInfo, levelTitle } from '../lib/points'

export function PointsCard({
  points,
  label = '내 포인트',
}: {
  points: number
  label?: string
}) {
  const info = levelInfo(points)

  return (
    <section className="relative overflow-hidden rounded-[18px] border border-[#e6e1ff] bg-gradient-to-br from-[#f1eeff] via-white to-[#e8f8f0] p-5 shadow-[0_12px_35px_rgba(111,104,232,0.08)]">
      <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-[#fff1e8]/80" />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold tracking-[0.08em] text-[#7c74f0] uppercase">
              {label}
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <strong className="text-2xl font-extrabold tracking-[-0.05em] text-[#3d3a55]">
                Lv.{info.level}
              </strong>
              <span className="rounded-full bg-white/80 px-2 py-1 text-[11px] font-extrabold text-[#6a63c9]">
                {info.title}
              </span>
            </div>
          </div>
          <div className="text-right">
            <strong className="text-2xl font-extrabold text-[#3d3a55]">
              {info.points}P
            </strong>
            <p className="mt-1 text-[11px] text-[#8b88a3]">
              다음 레벨까지 {info.remaining}P
            </p>
          </div>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#8d86f5] via-[#b9b4ff] to-[#8fd8bd] transition-all"
            style={{ width: `${info.progress}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between gap-2 text-[11px] text-[#8b88a3]">
          <span>
            {info.current} / {info.next}P
          </span>
          <span>
            다음 Lv.{info.level + 1} · {levelTitle(info.level + 1)}
          </span>
        </div>
      </div>
    </section>
  )
}
