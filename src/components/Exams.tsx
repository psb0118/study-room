import { useState, type FormEvent } from 'react'
import { useExams } from '../hooks/useExams'
import {
  createMonthGrid,
  monthLabel,
  monthOf,
  shiftMonth,
} from '../lib/examCalendar'
import { isDateKey, isTime, subjectMeta, todayKey } from '../lib/planner'
import { daysBetween } from '../lib/streak'
import type { Exam, ExamInput, Subject } from '../types'
import {
  Field,
  Modal,
  PageHeader,
  ghostButton,
  inputClass,
  panelClass,
  primaryButton,
} from './ui'

function ddayLabel(examDate: string, today = todayKey()): string {
  const diff = daysBetween(today, examDate)
  if (diff === 0) return 'D-DAY'
  return diff > 0 ? `D-${diff}` : `D+${-diff}`
}

function examTimeLabel(exam: Exam): string {
  return exam.startTime ? exam.startTime : '시간 미정'
}

export function Exams({
  uid,
  subjects,
  readOnly = false,
}: {
  uid: string
  subjects: Subject[]
  readOnly?: boolean
}) {
  const { exams, loading, error, saveExam, deleteExam } = useExams(uid)
  const [modal, setModal] = useState<'new' | Exam | null>(null)
  const today = todayKey()
  const [month, setMonth] = useState(monthOf(today))
  const activeSubjects = subjects.filter((subject) => !subject.archived)
  const upcoming = exams.filter((exam) => exam.examDate >= today)
  const past = exams
    .filter((exam) => exam.examDate < today)
    .sort((a, b) => b.examDate.localeCompare(a.examDate))
  const next = upcoming[0]
  const monthDays = createMonthGrid(month, today)
  const examsByDate = new Map<string, Exam[]>()
  for (const exam of exams) {
    const list = examsByDate.get(exam.examDate) ?? []
    list.push(exam)
    examsByDate.set(exam.examDate, list)
  }
  const hasExamsThisMonth = monthDays.some(
    (day) => day.inMonth && examsByDate.has(day.dateKey),
  )

  return (
    <div>
      <PageHeader
        eyebrow="EXAM COUNTDOWN"
        title="시험 D-Day"
        description="시험 일정을 등록하고 남은 날짜를 계획과 함께 관리해 보세요."
        action={
          readOnly ? undefined : (
            <button
              type="button"
              onClick={() => setModal('new')}
              disabled={activeSubjects.length === 0}
              title={
                activeSubjects.length === 0
                  ? '과목을 먼저 추가해 주세요.'
                  : undefined
              }
              className={primaryButton}
            >
              ＋ 시험 추가
            </button>
          )
        }
      />

      {error && (
        <div className="mb-4 rounded-xl border border-[#f6d6dd] bg-[#ffeff3] px-4 py-3 text-sm text-[#d96a7c]">
          {error}
        </div>
      )}

      {next && (
        <section className="mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#6f68e8] to-[#9a92ff] px-6 py-5 text-white shadow-[0_14px_35px_rgba(111,104,232,0.25)]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold tracking-[0.12em] text-white/70 uppercase">
                NEXT EXAM
              </p>
              <h2 className="mt-1 truncate text-2xl font-extrabold tracking-[-0.04em]">
                {next.title}
              </h2>
              <p className="mt-1 text-sm text-white/75">
                {subjectMeta(next.subjectId, subjects).name} ·{' '}
                {next.examDate} {examTimeLabel(next)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 px-5 py-3 text-center backdrop-blur">
              <div className="text-3xl font-extrabold tracking-[-0.04em]">
                {ddayLabel(next.examDate, today)}
              </div>
              <div className="mt-0.5 text-[11px] font-bold text-white/70">
                {next.examDate === today ? '오늘이 시험일이에요' : '남은 기간'}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className={`${panelClass} mt-4 p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-extrabold text-[#3d3a55]">
              시험 캘린더
            </h2>
            <p className="mt-0.5 text-xs text-[#a8a5bb]">
              {monthLabel(month)} · 시험일을 한눈에 확인하세요.
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMonth(shiftMonth(month, -1))}
              aria-label="이전 달"
              className="grid h-8 w-8 place-items-center rounded-lg border border-[#e6e1f5] bg-white text-[#77738f] transition hover:bg-[#faf9ff]"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setMonth(monthOf(today))}
              className="rounded-lg border border-[#e6e1f5] bg-white px-2.5 py-1.5 text-[11px] font-extrabold text-[#77738f] transition hover:bg-[#faf9ff]"
            >
              이번 달
            </button>
            <button
              type="button"
              onClick={() => setMonth(shiftMonth(month, 1))}
              aria-label="다음 달"
              className="grid h-8 w-8 place-items-center rounded-lg border border-[#e6e1f5] bg-white text-[#77738f] transition hover:bg-[#faf9ff]"
            >
              ›
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-[#a8a5bb]">
          {['월', '화', '수', '목', '금', '토', '일'].map((weekday) => (
            <div key={weekday} className="py-1">
              {weekday}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day) => {
            const dayExams = examsByDate.get(day.dateKey) ?? []
            return (
              <div
                key={day.dateKey}
                className={`min-h-12 rounded-lg border p-1 text-center ${
                  day.isToday
                    ? 'border-[#c8c2ff] bg-[#f1eeff]'
                    : day.inMonth
                      ? 'border-transparent bg-[#fcfbff]'
                      : 'border-transparent bg-white text-[#d4d0e2]'
                }`}
              >
                <div
                  className={`text-[10px] font-extrabold ${
                    day.isToday ? 'text-[#6f68e8]' : ''
                  }`}
                >
                  {day.day}
                </div>
                <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                  {dayExams.slice(0, 3).map((exam) => (
                    <span
                      key={exam.id}
                      title={`${exam.title} (${exam.examDate})`}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor: subjectMeta(exam.subjectId, subjects)
                          .color,
                      }}
                    />
                  ))}
                  {dayExams.length > 3 && (
                    <span className="text-[8px] font-bold text-[#a8a5bb]">
                      +{dayExams.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {!hasExamsThisMonth && (
          <p className="mt-3 text-center text-[11px] text-[#a8a5bb]">
            이 달에 등록된 시험이 없어요.
          </p>
        )}
      </section>

      {loading ? (
        <p className={`${panelClass} mt-4 p-5 text-sm text-[#8b88a3]`}>
          시험 일정을 불러오는 중…
        </p>
      ) : (
        <>
          <section className={`${panelClass} mt-4 p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-extrabold text-[#3d3a55]">
                예정된 시험
              </h2>
              <span className="text-xs text-[#a8a5bb]">
                {upcoming.length}개
              </span>
            </div>
            {upcoming.length > 0 ? (
              <ul className="mt-3 divide-y divide-[#f1eef9]">
                {upcoming.map((exam) => (
                  <ExamRow
                    key={exam.id}
                    exam={exam}
                    subjects={subjects}
                    today={today}
                    readOnly={readOnly}
                    onEdit={() => setModal(exam)}
                    onDelete={() => {
                      if (
                        window.confirm(
                          `“${exam.title}” 시험 일정을 삭제할까요?`,
                        )
                      ) {
                        void deleteExam(exam.id)
                      }
                    }}
                  />
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-xl border border-dashed border-[#d6d1ff] bg-[#faf9ff] px-4 py-5 text-sm text-[#8b88a3]">
                {readOnly
                  ? '이 학생은 예정된 시험이 없어요.'
                  : activeSubjects.length === 0
                    ? '과목을 먼저 추가하면 시험 일정을 등록할 수 있어요.'
                    : '아직 등록된 시험이 없어요. 시험 날짜를 등록해 보세요.'}
              </p>
            )}
          </section>

          {past.length > 0 && (
            <section className={`${panelClass} mt-4 p-5`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-extrabold text-[#3d3a55]">
                  지난 시험
                </h2>
                <span className="text-xs text-[#a8a5bb]">
                  {past.length}개
                </span>
              </div>
              <ul className="mt-3 divide-y divide-[#f1eef9]">
                {past.map((exam) => (
                  <ExamRow
                    key={exam.id}
                    exam={exam}
                    subjects={subjects}
                    today={today}
                    readOnly={readOnly}
                    onEdit={() => setModal(exam)}
                    onDelete={() => {
                      if (
                        window.confirm(
                          `“${exam.title}” 시험 일정을 삭제할까요?`,
                        )
                      ) {
                        void deleteExam(exam.id)
                      }
                    }}
                  />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {!readOnly && modal !== null && (
        <ExamModal
          exam={modal === 'new' ? null : modal}
          subjects={subjects}
          error={error}
          onClose={() => setModal(null)}
          onSave={async (input) =>
            saveExam({
              ...input,
              ...(modal === 'new' ? {} : { id: modal.id }),
            })
          }
        />
      )}
    </div>
  )
}

function ExamRow({
  exam,
  subjects,
  today,
  readOnly,
  onEdit,
  onDelete,
}: {
  exam: Exam
  subjects: Subject[]
  today: string
  readOnly: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const subject = subjectMeta(exam.subjectId, subjects)
  return (
    <li className="flex flex-wrap items-center gap-3 py-3 first:pt-3 last:pb-0">
      <div className="w-14 shrink-0 text-center">
        <div
          className={`text-sm font-extrabold ${
            exam.examDate >= today ? 'text-[#6f68e8]' : 'text-[#a8a5bb]'
          }`}
        >
          {ddayLabel(exam.examDate, today)}
        </div>
        <div className="mt-0.5 text-[10px] text-[#a8a5bb]">
          {exam.examDate.slice(5).replace('-', '/')}
        </div>
      </div>
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: subject.color }}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-extrabold text-[#3d3a55]">
          {exam.title}
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[#a8a5bb]">
          <span>{subject.name}</span>
          <span>{examTimeLabel(exam)}</span>
          {exam.memo && <span className="max-w-full truncate">{exam.memo}</span>}
        </div>
      </div>
      {!readOnly && (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`${exam.title} 수정`}
            className="grid h-8 w-8 place-items-center rounded-md bg-[#f7f4ff] text-[#77748f] transition hover:bg-[#f1eeff] hover:text-[#7c74f0]"
          >
            ✎
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`${exam.title} 삭제`}
            className="grid h-8 w-8 place-items-center rounded-md bg-[#f7f4ff] text-[#d96a7c] transition hover:bg-[#ffeff3]"
          >
            ⌫
          </button>
        </div>
      )}
    </li>
  )
}

function ExamModal({
  exam,
  subjects,
  error,
  onClose,
  onSave,
}: {
  exam: Exam | null
  subjects: Subject[]
  error: string | null
  onClose: () => void
  onSave: (input: ExamInput) => Promise<boolean>
}) {
  const selectable = subjects.filter(
    (subject) => !subject.archived || subject.id === exam?.subjectId,
  )
  const [form, setForm] = useState<ExamInput>(() => ({
    title: exam?.title ?? '',
    subjectId: exam?.subjectId ?? selectable[0]?.id ?? '',
    examDate: exam?.examDate ?? todayKey(),
    startTime: exam?.startTime ?? '',
    memo: exam?.memo ?? '',
  }))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const set = <K extends keyof ExamInput>(key: K, value: ExamInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const found: Record<string, string> = {}
    const title = form.title.trim()
    if (!title) found.title = '시험명을 입력해 주세요.'
    if (!selectable.some((subject) => subject.id === form.subjectId)) {
      found.subjectId = '과목을 선택해 주세요.'
    }
    if (!isDateKey(form.examDate)) {
      found.examDate = '올바른 시험 날짜를 선택해 주세요.'
    }
    if (form.startTime && !isTime(form.startTime)) {
      found.startTime = '올바른 시험 시간을 입력해 주세요.'
    }
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setBusy(true)
    const ok = await onSave({ ...form, title })
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <Modal
      title={exam ? '시험 일정 수정' : '새 시험 일정'}
      subtitle="시험 날짜와 과목을 등록하면 D-Day를 계산해 드려요."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={ghostButton}>
            취소
          </button>
          <button
            type="submit"
            form="exam-form"
            disabled={busy}
            className={primaryButton}
          >
            {busy ? '저장 중…' : exam ? '변경 저장' : '시험 추가'}
          </button>
        </>
      }
    >
      {error && (
        <p className="mb-4 rounded-xl bg-[#ffeff3] px-3.5 py-2.5 text-sm leading-relaxed text-[#d96a7c]">
          {error}
        </p>
      )}
      <form id="exam-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="시험명 *" error={errors.title} className="sm:col-span-2">
          <input
            value={form.title}
            onChange={(event) => set('title', event.target.value)}
            maxLength={100}
            placeholder="예: 2학기 중간고사"
            className={inputClass}
          />
        </Field>
        <Field label="과목 *" error={errors.subjectId}>
          <select
            value={form.subjectId}
            onChange={(event) => set('subjectId', event.target.value)}
            className={inputClass}
          >
            <option value="">과목을 선택하세요</option>
            {selectable.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
                {subject.archived ? ' (보관됨)' : ''}
              </option>
            ))}
          </select>
        </Field>
        <Field label="시험 날짜 *" error={errors.examDate}>
          <input
            type="date"
            value={form.examDate}
            onChange={(event) => set('examDate', event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="시험 시작 시간" error={errors.startTime}>
          <input
            type="time"
            value={form.startTime}
            onChange={(event) => set('startTime', event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="메모" className="sm:col-span-2">
          <textarea
            value={form.memo}
            onChange={(event) => set('memo', event.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="시험 범위나 준비할 내용을 적어주세요."
            className={inputClass}
          />
        </Field>
      </form>
    </Modal>
  )
}
