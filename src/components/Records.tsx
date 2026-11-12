import { useState, type FormEvent } from 'react'
import type { PlannerApi } from '../hooks/usePlanner'
import {
  formatDateKey,
  formatDuration,
  isDateKey,
  recordDateKey,
  recordsInPeriod,
  subjectMeta,
  todayKey,
  type Period,
} from '../lib/planner'
import type { View } from './AppShell'
import {
  EmptyState,
  Field,
  Modal,
  PageHeader,
  PeriodTabs,
  ghostButton,
  inputClass,
  panelClass,
  primaryButton,
} from './ui'

interface RecordsProps {
  planner: PlannerApi
  onNavigate: (view: View) => void
}

export function Records({ planner, onNavigate }: RecordsProps) {
  const [period, setPeriod] = useState<Period>('week')
  const [subjectId, setSubjectId] = useState('all')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(false)

  const normalizedQuery = query.trim().toLowerCase()
  const records = recordsInPeriod(planner.records, period)
    .filter(
      (record) =>
        (subjectId === 'all' || record.subjectId === subjectId) &&
        (!normalizedQuery ||
          [
            record.memo,
            record.dateKey,
            subjectMeta(record.subjectId, planner.subjects).name,
            planner.plans.find((plan) => plan.id === record.planId)?.title ?? '',
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery)),
    )
    .sort((a, b) => b.startedAt - a.startedAt)

  const openModal = () => {
    if (!planner.subjects.some((s) => !s.archived)) {
      onNavigate('subjects')
      return
    }
    setModal(true)
  }

  return (
    <div>
      <PageHeader
        eyebrow="STUDY HISTORY"
        title="공부 기록"
        description="스터디 룸 집중과 직접 기록이 이곳에 쌓이고, 통계의 원본이 됩니다."
        action={
          <button type="button" onClick={openModal} className={primaryButton}>
            ＋ 직접 기록
          </button>
        }
      />

      <section className={`${panelClass} mb-4 flex flex-wrap items-end gap-3 p-4`}>
        <PeriodTabs value={period} onChange={setPeriod} />
        <Field label="과목" className="min-w-[130px] flex-1 sm:flex-none">
          <select
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            className={inputClass}
          >
            <option value="all">모든 과목</option>
            {planner.subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
                {subject.archived ? ' (보관됨)' : ''}
              </option>
            ))}
          </select>
        </Field>
        <Field label="검색" className="min-w-[180px] flex-1 sm:flex-none">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="메모·과목 검색"
            className={inputClass}
          />
        </Field>
        <button
          type="button"
          onClick={() => {
            setSubjectId('all')
            setQuery('')
          }}
          className={ghostButton}
        >
          초기화
        </button>
        <span className="ml-auto text-xs text-[#a8a5bb]">{records.length}개의 기록</span>
      </section>

      {records.length > 0 ? (
        <section className="space-y-2.5">
          {records.map((record) => {
            const subject = subjectMeta(record.subjectId, planner.subjects)
            const plan = planner.plans.find((p) => p.id === record.planId)
            return (
              <article
                key={record.id}
                className={`${panelClass} flex flex-wrap items-center gap-3 p-4`}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: subject.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-extrabold text-[#3d3a55]">
                      {subject.name}
                    </span>
                    <span className="text-[11px] text-[#a8a5bb]">
                      {formatDateKey(recordDateKey(record))}
                    </span>
                    <span className="rounded bg-[#f4f1fb] px-1.5 py-0.5 text-[10px] font-semibold text-[#77748f]">
                      {record.source === 'room' ? '스터디 룸' : '직접 기록'}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#a8a5bb]">
                    <span>
                      {new Intl.DateTimeFormat('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      }).format(new Date(record.startedAt))}{' '}
                      시작
                    </span>
                    <span>{plan ? plan.title : '개별 공부 기록'}</span>
                    {record.memo && (
                      <span className="max-w-full truncate">{record.memo}</span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-extrabold text-[#7c74f0]">
                  {formatDuration(record.durationMs)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        '이 공부 기록을 삭제할까요? 통계도 다시 계산됩니다.',
                      )
                    ) {
                      void planner.deleteRecord(record.id)
                    }
                  }}
                  aria-label="기록 삭제"
                  className="grid h-8 w-8 place-items-center rounded-md bg-[#f7f4ff] text-[#d96a7c] transition hover:bg-[#ffeff3]"
                >
                  ⌫
                </button>
              </article>
            )
          })}
        </section>
      ) : (
        <div className={panelClass}>
          <EmptyState
            icon="▤"
            title="아직 공부 기록이 없어요"
            description="스터디 룸에서 집중하거나 직접 기록을 추가해 보세요."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('rooms')}
                  className={ghostButton}
                >
                  스터디 룸 가기
                </button>
                <button
                  type="button"
                  onClick={openModal}
                  className={primaryButton}
                >
                  직접 기록 추가
                </button>
              </div>
            }
          />
        </div>
      )}

      {modal && (
        <RecordModal planner={planner} onClose={() => setModal(false)} />
      )}
    </div>
  )
}

function RecordModal({
  planner,
  onClose,
}: {
  planner: PlannerApi
  onClose: () => void
}) {
  const activeSubjects = planner.subjects.filter((s) => !s.archived)
  const [subjectId, setSubjectId] = useState(activeSubjects[0]?.id ?? '')
  const [date, setDate] = useState(todayKey())
  const [minutes, setMinutes] = useState(30)
  const [planId, setPlanId] = useState('')
  const [memo, setMemo] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const plans = planner.plans.filter((p) => p.subjectId === subjectId)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const found: Record<string, string> = {}
    if (!activeSubjects.some((s) => s.id === subjectId)) {
      found.subjectId = '과목을 선택해 주세요.'
    }
    if (!isDateKey(date)) {
      found.date = '올바른 날짜를 선택해 주세요.'
    }
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
      found.minutes = '1~1440분 사이로 입력해 주세요.'
    }
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setBusy(true)
    const ok = await planner.addManualRecord({
      subjectId,
      planId,
      date,
      minutes,
      memo,
    })
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <Modal
      title="직접 공부 기록"
      subtitle="통계는 이 기록을 원본으로 계산합니다."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={ghostButton}>
            취소
          </button>
          <button
            type="submit"
            form="record-form"
            disabled={busy}
            className={primaryButton}
          >
            {busy ? '저장 중…' : '기록 추가'}
          </button>
        </>
      }
    >
      <form
        id="record-form"
        onSubmit={submit}
        className="grid gap-4 sm:grid-cols-2"
      >
        <Field label="과목 *" error={errors.subjectId}>
          <select
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value)
              setPlanId('')
            }}
            className={inputClass}
          >
            <option value="">과목을 선택하세요</option>
            {activeSubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="날짜 *" error={errors.date}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="공부 시간 (분) *" error={errors.minutes}>
          <input
            type="number"
            min={1}
            max={1440}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className={inputClass}
          />
        </Field>
        <Field label="연결할 계획 (선택)">
          <select
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            className={inputClass}
          >
            <option value="">계획 없이 기록</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="메모" className="sm:col-span-2">
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="공부한 내용을 적어주세요."
            className={inputClass}
          />
        </Field>
        {planner.error && (
          <p className="rounded-lg bg-[#ffeff3] px-3 py-2 text-xs text-[#d96a7c] sm:col-span-2">
            {planner.error}
          </p>
        )}
      </form>
    </Modal>
  )
}
