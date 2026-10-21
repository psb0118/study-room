import { useEffect, useRef, useState } from 'react'
import type { Stroke } from '../types'

const PALETTE = ['#38bdf8', '#f472b6', '#facc15', '#4ade80', '#e2e8f0']
const WIDTHS = [2, 4, 8]
const ERASE_TOL = 10

interface WhiteboardProps {
  strokes: Stroke[]
  actions: {
    addStroke: (pts: number[], color: string, w: number) => void
    undoStroke: () => void
    eraseAt: (x: number, y: number, tol: number, viewW: number, viewH: number) => void
    clearBoard: () => void
  }
}

function r4(n: number): number {
  return Math.round(n * 10_000) / 10_000
}

export function Whiteboard({ strokes, actions }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef<{ pts: number[]; color: string; w: number } | null>(null)
  const eraseAt = useRef(0)
  const [tool, setTool] = useState<'pen' | 'erase'>('pen')
  const [color, setColor] = useState(PALETTE[0])
  const [width, setWidth] = useState(4)

  const drawAll = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const all = [...strokes]
    const local = drawing.current
    if (local) {
      all.push({ id: '__local__', uid: '', color: local.color, w: local.w, pts: local.pts })
    }
    for (const s of all) {
      if (s.pts.length < 4) continue
      ctx.strokeStyle = s.color
      ctx.lineWidth = s.w
      ctx.beginPath()
      ctx.moveTo(s.pts[0] * w, s.pts[1] * h)
      for (let i = 2; i + 1 < s.pts.length; i += 2) {
        ctx.lineTo(s.pts[i] * w, s.pts[i + 1] * h)
      }
      ctx.stroke()
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
      drawAll()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(drawAll, [strokes])

  const norm = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    return [r4(Math.min(1, Math.max(0, x))), r4(Math.min(1, Math.max(0, y)))]
  }

  const doErase = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const now = Date.now()
    if (now - eraseAt.current < 70) return
    eraseAt.current = now
    actions.eraseAt(x, y, ERASE_TOL, rect.width, rect.height)
  }

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    if (tool === 'erase') {
      doErase(e)
      return
    }
    const [x, y] = norm(e)
    drawing.current = { pts: [x, y], color, w: width }
    drawAll()
  }

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === 'erase') {
      if (e.buttons === 1) doErase(e)
      return
    }
    const cur = drawing.current
    if (!cur || e.buttons !== 1) return
    const [x, y] = norm(e)
    const last = cur.pts.length - 2
    const dx = cur.pts[last] - x
    const dy = cur.pts[last + 1] - y
    if (dx * dx + dy * dy < 0.000004) return
    cur.pts.push(x, y)
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) {
      const dpr = window.devicePixelRatio || 1
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.strokeStyle = cur.color
      ctx.lineWidth = cur.w
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(cur.pts[last] * w, cur.pts[last + 1] * h)
      ctx.lineTo(x * w, y * h)
      ctx.stroke()
    }
  }

  const onUp = () => {
    const cur = drawing.current
    drawing.current = null
    if (cur && cur.pts.length >= 4) {
      actions.addStroke(cur.pts, cur.color, cur.w)
    } else {
      drawAll()
    }
  }

  return (
    <section className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-slate-900/60 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-sm font-semibold text-slate-300">화이트보드</h2>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTool('pen')}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
              tool === 'pen' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            ✏️ 펜
          </button>
          <button
            type="button"
            onClick={() => setTool('erase')}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
              tool === 'erase' ? 'bg-amber-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            🧽 지우개
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setColor(c)
                setTool('pen')
              }}
              aria-label={`색상 ${c}`}
              className={`h-6 w-6 rounded-full ring-2 transition ${color === c && tool === 'pen' ? 'ring-white' : 'ring-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {WIDTHS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWidth(w)}
              aria-label={`굵기 ${w}`}
              className={`flex h-6 w-6 items-center justify-center rounded-md transition ${
                width === w ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <span className="block rounded-full bg-white" style={{ width: w + 2, height: w + 2 }} />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={actions.undoStroke}
            className="rounded-md bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
          >
            되돌리기
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('화이트보드를 모두 지울까요?')) actions.clearBoard()
            }}
            className="rounded-md bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
          >
            전체 지우기
          </button>
        </div>
      </div>

      <div className="relative min-h-[360px] flex-1 overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none"
          style={{ cursor: tool === 'pen' ? 'crosshair' : 'cell' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
        {strokes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-600">
            여기에 함께 그려보세요
          </div>
        )}
      </div>
    </section>
  )
}
