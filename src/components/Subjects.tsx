import { useState, type FormEvent } from 'react'
import type { PlannerApi } from '../hooks/usePlanner'
import { SUBJECT_COLORS, formatDuration, subjectTotals } from '../lib/planner'
import type { Subject } from '../types'
import {
  EmptyState,
  Field,
  Modal,
  PageHeader,
  ghostButton,
  inputClass,
  panelClass,
  primaryButton,
} from './ui'

interface SubjectsProps {
  planner: PlannerApi
}

export function Subjects({ planner }: SubjectsProps) {
  const [modal, setModal] = useState<'new' | Subject | null>(null)
  const totals = subjectTotals(planner.records)

  return (
    <div>
      <PageHeader
        eyebrow="SUBJECTS"
        title="과목 관리"
        description="색상으로 구분해 계획과 공부 기록을 더 쉽게 살펴보세요."
        action={
          <button
            type="button"
            onClick={() => setModal('new')}
            className={primaryButton}
          >
            ＋ 과목 추가
          </button>
        }
      />

      {planner.subjects.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {planner.subjects.map((subject) => (
            <article key={subject.id} className={`${panelClass} p-5`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <h2 className="truncate font-extrabold text-[#202538]">
                    {subject.name}
                  </h2>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setModal(subject)}
                    aria-label={`${subject.name} 수정`}
                    className="grid h-8 w-8 place-items-center rounded-md bg-[#f5f6fa] text-[#676d80] transition hover:bg-[#eef0ff] hover:text-[#5969df]"
                  >
                    ✎
                  </button>
                  {subject.archived ? (
                    <button
                      type="button"
                      onClick={() =>
                        void planner.setSubjectArchived(subject.id, false)
                      }
                      aria-label="과목 복원"
                      className="grid h-8 w-8 place-items-center rounded-md bg-[#f5f6fa] text-[#278b66] transition hover:bg-[#e9f8f1]"
                    >
                      ↶
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            '과목을 보관할까요? 기존 계획과 공부 기록은 그대로 유지됩니다.',
                          )
                        ) {
                          void planner.setSubjectArchived(subject.id, true)
                        }
                      }}
                      aria-label="과목 보관"
                      className="grid h-8 w-8 place-items-center rounded-md bg-[#f5f6fa] text-[#c84f61] transition hover:bg-[#fff0f2]"
                    >
                      ⌫
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-[#9498a7]">
                {subject.archived
                  ? '보관됨 · 기존 기록은 유지됩니다'
                  : '활성 과목 · 새 계획에 선택 가능'}
              </p>
              <div className="mt-4 text-xl font-extrabold text-[#202538]">
                {formatDuration(totals[subject.id] ?? 0)}
              </div>
              <div className="text-xs text-[#9498a7]">누적 공부 시간</div>
            </article>
          ))}
        </section>
      ) : (
        <div className={panelClass}>
          <EmptyState
            icon="●"
            title="아직 과목이 없어요"
            description="과목을 만들면 계획과 기록을 더 깔끔하게 정리할 수 있어요."
            action={
              <button
                type="button"
                onClick={() => setModal('new')}
                className={primaryButton}
              >
                과목 추가
              </button>
            }
          />
        </div>
      )}

      {modal !== null && (
        <SubjectModal
          subject={modal === 'new' ? null : modal}
          planner={planner}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

function SubjectModal({
  subject,
  planner,
  onClose,
}: {
  subject: Subject | null
  planner: PlannerApi
  onClose: () => void
}) {
  const [name, setName] = useState(subject?.name ?? '')
  const [color, setColor] = useState(subject?.color ?? SUBJECT_COLORS[0])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('과목명을 입력해 주세요.')
      return
    }
    if (trimmed.length > 50) {
      setError('과목명은 50자 이하여야 해요.')
      return
    }
    setError('')
    setBusy(true)
    const ok = await planner.saveSubject({
      ...(subject ? { id: subject.id } : {}),
      name: trimmed,
      color,
    })
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <Modal
      title={subject ? '과목 수정' : '새 과목'}
      subtitle="과목을 보관해도 기존 계획과 기록은 유지됩니다."
      onClose={onClose}
      small
      footer={
        <>
          <button type="button" onClick={onClose} className={ghostButton}>
            취소
          </button>
          <button
            type="submit"
            form="subject-form"
            disabled={busy}
            className={primaryButton}
          >
            {busy ? '저장 중…' : subject ? '변경 저장' : '과목 추가'}
          </button>
        </>
      }
    >
      <form id="subject-form" onSubmit={submit} className="grid gap-4">
        <Field label="과목명 *" error={error}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            placeholder="예: 한국사"
            className={inputClass}
          />
        </Field>
        <Field label="색상">
          <div className="flex flex-wrap items-center gap-2">
            {SUBJECT_COLORS.map((candidate) => (
              <button
                key={candidate}
                type="button"
                onClick={() => setColor(candidate)}
                aria-label={`색상 ${candidate}`}
                className={`h-7 w-7 rounded-full ring-2 transition ${
                  color === candidate ? 'ring-white' : 'ring-transparent'
                }`}
                style={{ backgroundColor: candidate }}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label="직접 색상 선택"
              className="h-8 w-10 cursor-pointer rounded border border-[#dfe2ec] bg-white"
            />
          </div>
        </Field>
        {planner.error && (
          <p className="rounded-lg bg-[#fff0f2] px-3 py-2 text-xs text-[#c84f61]">
            {planner.error}
          </p>
        )}
      </form>
    </Modal>
  )
}
