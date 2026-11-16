import { useState } from 'react'
import {
  MAX_REFLECTION_LENGTH,
  useReflections,
} from '../hooks/useReflections'
import { formatDateKey, todayKey } from '../lib/planner'
import type { StudyReflection } from '../types'
import {
  EmptyState,
  Field,
  PageHeader,
  ghostButton,
  inputClass,
  panelClass,
  primaryButton,
} from './ui'

export function Journal({
  uid,
  readOnly = false,
}: {
  uid: string
  readOnly?: boolean
}) {
  const { reflections, loading, error, saveReflection, deleteReflection } =
    useReflections(uid)
  const today = todayKey()
  const [date, setDate] = useState(today)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const selected = reflections.find((item) => item.dateKey === date)
  const editorKey = `${date}:${loading ? 'loading' : selected ? selected.updatedAt || selected.createdAt : 'empty'}`

  const save = async (content: string) => {
    if (readOnly) return
    setBusy(true)
    setNotice(null)
    const ok = await saveReflection(date, content)
    setBusy(false)
    if (!ok) return
    setNotice(content.trim() ? '회고를 저장했어요.' : '빈 회고는 삭제했어요.')
  }

  const remove = async (target: string) => {
    if (readOnly) return
    if (!window.confirm(`${formatDateKey(target)} 회고를 삭제할까요?`)) return
    setBusy(true)
    const ok = await deleteReflection(target)
    setBusy(false)
    if (ok) setNotice('회고를 삭제했어요.')
  }

  return (
    <div>
      <PageHeader
        eyebrow="DAILY REFLECTION"
        title="하루 회고"
        description="오늘 공부한 내용과 내일의 다짐을 한 줄씩 남겨 보세요."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,.85fr)]">
        <section className={`${panelClass} p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-[#3d3a55]">
                {date === today ? '오늘의 회고' : '회고 작성'}
              </h2>
              <p className="mt-0.5 text-xs text-[#a8a5bb]">
                하루를 돌아보고 내일 이어갈 행동을 적어 보세요.
              </p>
            </div>
            {readOnly && (
              <span className="rounded-full bg-[#f1eeff] px-2.5 py-1 text-[10px] font-extrabold text-[#6a63c9]">
                읽기 전용
              </span>
            )}
          </div>

          <div className="mt-4">
            <Field label="날짜">
              <input
                type="date"
                value={date}
                max={today}
                onChange={(event) => {
                  if (!event.target.value) return
                  setDate(event.target.value)
                  setNotice(null)
                }}
                className={inputClass}
              />
            </Field>
          </div>

          <JournalEditor
            key={editorKey}
            initialContent={selected?.content ?? ''}
            selected={selected}
            readOnly={readOnly}
            busy={busy}
            onSave={save}
          />

          {notice && (
            <p className="mt-3 rounded-xl bg-[#eafaf1] px-3.5 py-2.5 text-sm text-[#3d9b6a]">
              {notice}
            </p>
          )}
          {error && (
            <p className="mt-3 rounded-xl bg-[#ffeff3] px-3.5 py-2.5 text-sm text-[#d96a7c]">
              {error}
            </p>
          )}
        </section>

        <section className={`${panelClass} p-5`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold text-[#3d3a55]">
              최근 회고
            </h2>
            <span className="text-xs text-[#a8a5bb]">
              {reflections.length}개
            </span>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-[#8b88a3]">불러오는 중…</p>
          ) : reflections.length === 0 ? (
            <EmptyState
              icon="✎"
              title="아직 회고가 없어요"
              description={
                readOnly
                  ? '이 학생은 아직 회고를 작성하지 않았어요.'
                  : '오늘의 회고를 저장하면 이곳에 쌓입니다.'
              }
            />
          ) : (
            <ul className="mt-3 divide-y divide-[#f1eef9]">
              {reflections.slice(0, 14).map((item) => (
                <li key={item.dateKey} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDate(item.dateKey)
                        setNotice(null)
                      }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div
                        className={`text-xs font-extrabold ${
                          item.dateKey === date
                            ? 'text-[#6f68e8]'
                            : 'text-[#5f5c78]'
                        }`}
                      >
                        {formatDateKey(item.dateKey)}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[#a8a5bb]">
                        {item.content}
                      </p>
                    </button>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => void remove(item.dateKey)}
                        disabled={busy}
                        aria-label={`${formatDateKey(item.dateKey)} 회고 삭제`}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[#f7f4ff] text-[#d96a7c] transition hover:bg-[#ffeff3] disabled:opacity-50"
                      >
                        ⌫
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function JournalEditor({
  initialContent,
  selected,
  readOnly,
  busy,
  onSave,
}: {
  initialContent: string
  selected: StudyReflection | undefined
  readOnly: boolean
  busy: boolean
  onSave: (content: string) => Promise<void>
}) {
  const [content, setContent] = useState(initialContent)
  return (
    <>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-bold text-[#5f5c78]">
          회고 내용
        </span>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={MAX_REFLECTION_LENGTH}
          rows={8}
          disabled={readOnly}
          placeholder={
            readOnly
              ? '읽기 전용 미리보기에서는 회고를 수정할 수 없어요.'
              : '오늘 잘한 점, 아쉬웠던 점, 내일의 목표를 적어 보세요.'
          }
          className={`${inputClass} min-h-44 resize-y`}
        />
      </label>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#a8a5bb]">
        <span>
          {content.length}/{MAX_REFLECTION_LENGTH}자
        </span>
        {selected && (selected.updatedAt || selected.createdAt) > 0 && (
          <span>
            마지막 저장{' '}
            {new Intl.DateTimeFormat('ko-KR', {
              month: 'numeric',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date(selected.updatedAt || selected.createdAt))}
          </span>
        )}
      </div>

      {!readOnly && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void onSave(content)}
            disabled={busy}
            className={primaryButton}
          >
            {busy ? '저장 중…' : '회고 저장'}
          </button>
          {selected && (
            <button
              type="button"
              onClick={() => setContent('')}
              disabled={busy}
              className={ghostButton}
            >
              내용 비우기
            </button>
          )}
        </div>
      )}
    </>
  )
}
