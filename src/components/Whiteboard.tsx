import { useEffect, useRef, useState } from 'react'
import type { Stroke } from '../types'

const PALETTE = ['#4f46e5', '#e11d48', '#d97706', '#059669', '#334155']
const WIDTHS = [2, 4, 8]
const ERASE_TOL = 10

interface WhiteboardProps {
  strokes: Stroke[]
  actions: {
    addStroke: (pts: number[], color: string, w: number) => { id: string; saved: Promise<string | null> }
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
  const prevServerLen = useRef(0)
  const [tool, setTool] = useState<'pen' | 'erase'>('pen')
  const [color, setColor] = useState(PALETTE[0])
  const [width, setWidth] = useState(4)
  const [big, setBig] = useState(false)
  const [hint, setHint] = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)
  // 저장 확인 전/실패한 획 — 서버 롤백으로 사라지지 않도록 로컬에서 유지
  const [unsaved, setUnsaved] = useState<Stroke[]>([])
  const [confirmed, setConfirmed] = useState<string[]>([])

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
    const all = [...strokes, ...unsaved]
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

  // 저장 확인된 획은 서버 목록으로 전환 (실패한 건 로컬 유지)
  useEffect(() => {
    setUnsaved((prev) =>
      prev.filter((s) => !(confirmed.includes(s.id) && strokes.some((t) => t.id === s.id))),
    )
  }, [strokes, confirmed])

  // 힌트 문구: 그린 뒤에는 지울 때까지 숨김
  useEffect(() => {
    const n = strokes.length
    if (n > 0 || unsaved.length > 0) setHint(false)
    else if (prevServerLen.current > 0) setHint(true)
    prevServerLen.current = n
  }, [strokes.length, unsaved.length])

  useEffect(() => {
    drawAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes, unsaved])

  useEffect(() => {
    if (!big) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBig(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [big])

  const norm = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    return [r4(Math.min(1, Math.max(0, x))), r4(Math.min(1, Math.max(0, y)))]
  }

  const eraseLocal = (x: number, y: number, tol: number, vw: number, vh: number) => {
    setUnsaved((prev) =>
      prev.filter((s) => {
        const r = s.w / 2 + tol
        for (let i = 0; i + 1 < s.pts.length; i += 2) {
          const dx = s.pts[i] * vw - x
          const dy = s.pts[i + 1] * vh - y
          if (dx * dx + dy * dy <= r * r) return false
        }
        return true
      }),
    )
  }

  const doErase = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const now = Date.now()
    if (now - eraseAt.current < 70) return
    eraseAt.current = now
    eraseLocal(x, y, ERASE_TOL, rect.width, rect.height)
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
    if (!cur || cur.pts.length < 4) {
      drawAll()
      return
    }
    const { id, saved } = actions.addStroke(cur.pts, cur.color, cur.w)
    const stroke: Stroke = { id, uid: '', color: cur.color, w: cur.w, pts: cur.pts }
    setUnsaved((prev) => [...prev, stroke])
    setHint(false)
    setSaveError(null)
    void saved.then((err) => {
      if (err === null) {
        setConfirmed((prev) => (prev.includes(id) ? prev : [...prev, id]))
      } else {
        setSaveError(err)
      }
    })
    drawAll()
  }

  const undo = () => {
    if (unsaved.length > 0) {
      const last = unsaved[unsaved.length - 1]
      setUnsaved((prev) => prev.slice(0, -1))
      setConfirmed((prev) => prev.filter((x) => x !== last.id))
      return
    }
    actions.undoStroke()
  }

  const clearAll = () => {
    if (!window.confirm('화이트보드를 모두 지울까요?')) return
    actions.clearBoard()
    setUnsaved([])
    setConfirmed([])
    setSaveError(null)
    setHint(true)
    drawAll()
  }

  return (
    <section
      className={
        big
          ? 'fixed inset-0 z-50 flex flex-col bg-[#f6f7fb]/95 p-3 backdrop-blur'
          : 'surface flex min-h-0 flex-col p-4'
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-sm font-extrabold text-[#202538]">
          화이트보드
        </h2>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTool('pen')}
            className={`rounded-md px-2.5 py-1.5 text-xs font-bold transition ${
              tool === 'pen'
                ? 'bg-[#5969df] text-white'
                : 'bg-[#f5f6fa] text-[#62687d] hover:bg-[#eef0ff]'
            }`}
          >
            ✏️ 펜
          </button>
          <button
            type="button"
            onClick={() => setTool('erase')}
            className={`rounded-md px-2.5 py-1.5 text-xs font-bold transition ${
              tool === 'erase'
                ? 'bg-[#d97706] text-white'
                : 'bg-[#f5f6fa] text-[#62687d] hover:bg-[#fff1e3]'
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
              className={`h-6 w-6 rounded-full ring-2 transition ${
                color === c && tool === 'pen'
                  ? 'ring-[#5969df]'
                  : 'ring-transparent'
              }`}
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
                width === w
                  ? 'bg-[#eef0ff]'
                  : 'bg-[#f5f6fa] hover:bg-[#eceef5]'
              }`}
            >
              <span
                className="block rounded-full bg-[#52586e]"
                style={{ width: w + 2, height: w + 2 }}
              />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={undo}
            className="rounded-md bg-[#f5f6fa] px-2.5 py-1.5 text-xs font-bold text-[#62687d] transition hover:bg-[#eef0ff] hover:text-[#5969df]"
          >
            되돌리기
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-md bg-[#f5f6fa] px-2.5 py-1.5 text-xs font-bold text-[#62687d] transition hover:bg-[#fff0f2] hover:text-[#c84f61]"
          >
            전체 지우기
          </button>
          <button
            type="button"
            onClick={() => setBig((v) => !v)}
            className="rounded-md bg-[#f5f6fa] px-2.5 py-1.5 text-xs font-bold text-[#62687d] transition hover:bg-[#eef0ff] hover:text-[#5969df]"
            title={big ? '작게 보기 (Esc)' : '캔버스 크게 보기'}
          >
            {big ? '작게 ⤡' : '크게 ⛶'}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="mb-2 rounded-md bg-[#fff0f2] px-3 py-2 text-xs font-medium text-[#c84f61] ring-1 ring-[#f3ced3]">
          {saveError === 'permission_denied'
            ? '그림 저장이 실시간 DB 규칙에 거부됐습니다 — Firebase 콘솔 RTDB "규칙" 탭에서 numChildren가 있는 최신 규칙을 게시했는지 확인하세요.'
            : `그림 저장 실패 (${saveError})`}
        </div>
      )}

      <div
        className={`relative min-h-[460px] flex-1 touch-none overflow-hidden rounded-xl border border-[#e7e9f2] bg-white ${
          big ? 'min-h-0' : ''
        }`}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none"
          style={{ cursor: tool === 'pen' ? 'crosshair' : 'cell' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
        {hint && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-[#b0b4c3]">
            여기에 함께 그려보세요
          </div>
        )}
        {big && (
          <button
            type="button"
            onClick={() => setBig(false)}
            className="absolute top-2 right-2 rounded-md border border-[#e7e9f2] bg-white/90 px-2.5 py-1.5 text-xs font-bold text-[#52586e] transition hover:bg-white"
          >
            닫기 (Esc)
          </button>
        )}
      </div>
    </section>
  )
}
