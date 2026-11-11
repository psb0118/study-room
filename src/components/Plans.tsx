import { useState, type FormEvent } from 'react'
import type { PlannerApi } from '../hooks/usePlanner'
import {
  PERIOD_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
  emptyPlanInput,
  filterPlans,
  validatePlan,
  type PlanErrors,
  type PlanFilters,
  type Period,
} from '../lib/planner'
import type {
  PlanInput,
  PlanStatus,
  Priority,
  StudyPlan,
  Subject,
} from '../types'
import type { View } from './AppShell'
import {
  EmptyState,
  Field,
  Modal,
  PageHeader,
  StatusBadge,
  ghostButton,
  inputClass,
  panelClass,
  primaryButton,
} from './ui'

interface PlansProps {
  planner: PlannerApi
  onNavigate: (view: View) => void
}

export function Plans({ planner, onNavigate }: PlansProps) {
  const [filters, setFilters] = useState<PlanFilters>({
    period: 'all',
    subjectId: 'all',
    status: 'all',
  })
  const [modal, setModal] = useState<'new' | StudyPlan | null>(null)

  const activeSubjects = planner.subjects.filter((s) => !s.archived)
  const visible = filterPlans(planner.plans, filters)

  const openNew = () => {
    if (activeSubjects.length === 0) {
      onNavigate('subjects')
      return
    }
    setModal('new')
  }

  return (
    <div>
      <PageHeader
        eyebrow="PLAN MANAGEMENT"
        title="공부 계획"
        description="날짜와 상태를 정리하고, 오늘 해야 할 일을 선명하게 만드세요."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate('subjects')}
              className={ghostButton}
            >
              과목 관리
            </button>
            <button type="button" onClick={openNew} className={primaryButton}>
              ＋ 계획 추가
            </button>
          </div>
        }
      />

      {planner.subjects.length === 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#f3d8a8] bg-[#fff8e8] px-4 py-3 text-sm text-[#8a6e3b]">
          <span>계획을 만들려면 먼저 과목이 필요해요.</span>
          <button
            type="button"
            onClick={() => onNavigate('subjects')}
            className="text-xs font-semibold underline underline-offset-2"
          >
            과목 추가하기 →
          </button>
        </div>
      )}

      <section
        className={`${panelClass} mb-4 flex flex-wrap items-end gap-3 p-4`}
      >
        <Field label="기간" className="min-w-[120px] flex-1 sm:flex-none">
          <select
            value={filters.period}
            onChange={(e) =>
              setFilters({ ...filters, period: e.target.value as Period })
            }
            className={inputClass}
          >
            {(['all', 'today', 'week', 'month'] as const).map((period) => (
              <option key={period} value={period}>
                {PERIOD_LABEL[period]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="과목" className="min-w-[130px] flex-1 sm:flex-none">
          <select
            value={filters.subjectId}
            onChange={(e) =>
              setFilters({ ...filters, subjectId: e.target.value })
            }
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
        <Field label="상태" className="min-w-[120px] flex-1 sm:flex-none">
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({
                ...filters,
                status: e.target.value as PlanFilters['status'],
              })
            }
            className={inputClass}
          >
            <option value="all">모든 상태</option>
            <option value="planned">예정</option>
            <option value="in_progress">진행 중</option>
            <option value="completed">완료</option>
          </select>
        </Field>
        <button
          type="button"
          onClick={() =>
            setFilters({ period: 'all', subjectId: 'all', status: 'all' })
          }
          className={ghostButton}
        >
          초기화
        </button>
        <span className="ml-auto text-xs text-[#9498a7]">
          {visible.length}개의 계획
        </span>
      </section>

      <section className="space-y-2.5">
        {visible.length > 0 ? (
          visible.map((plan) => {
            const subject = planner.subjects.find((s) => s.id === plan.subjectId)
            return (
              <article
                key={plan.id}
                className={`${panelClass} flex flex-wrap items-start gap-3 p-4`}
              >
                <span
                  className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: subject?.color ?? '#64748b' }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-extrabold text-[#202538]">
                      {plan.title}
                    </h2>
                    <StatusBadge status={plan.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#9498a7]">
                    <span>{subject?.name ?? '과목 없음'}</span>
                    <span>
                      {new Intl.DateTimeFormat('ko-KR', {
                        month: 'numeric',
                        day: 'numeric',
                        weekday: 'short',
                      }).format(new Date(`${plan.plannedDate}T12:00:00`))}
                    </span>
                    <span>
                      {plan.startTime
                        ? `${plan.startTime}${plan.endTime ? `–${plan.endTime}` : ''}`
                        : '시간 미정'}
                    </span>
                    <span>목표 {plan.targetMinutes}분</span>
                    <span>우선순위 {PRIORITY_LABEL[plan.priority]}</span>
                  </div>
                  {plan.description && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#72778d]">
                      {plan.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <select
                    value={plan.status}
                    onChange={(e) =>
                      void planner.setPlanStatus(
                        plan.id,
                        e.target.value as PlanStatus,
                      )
                    }
                    aria-label={`${plan.title} 상태`}
                    className="rounded-md border border-[#dfe2ec] bg-white px-2 py-1.5 text-xs font-medium text-[#52586e] outline-none focus:border-[#7d8af0]"
                  >
                    <option value="planned">예정</option>
                    <option value="in_progress">진행 중</option>
                    <option value="completed">완료</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setModal(plan)}
                    aria-label="계획 수정"
                    className="grid h-8 w-8 place-items-center rounded-md bg-[#f5f6fa] text-[#676d80] transition hover:bg-[#eef0ff] hover:text-[#5969df]"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `“${plan.title}” 계획을 삭제할까요? 되돌릴 수 없어요.`,
                        )
                      ) {
                        void planner.deletePlan(plan.id)
                      }
                    }}
                    aria-label="계획 삭제"
                    className="grid h-8 w-8 place-items-center rounded-md bg-[#f5f6fa] text-[#c84f61] transition hover:bg-[#fff0f2]"
                  >
                    ⌫
                  </button>
                </div>
              </article>
            )
          })
        ) : (
          <div className={panelClass}>
            <EmptyState
              icon="□"
              title="조건에 맞는 계획이 없어요"
              description="필터를 바꾸거나 새로운 계획을 추가해 보세요."
              action={
                <button type="button" onClick={openNew} className={primaryButton}>
                  계획 추가
                </button>
              }
            />
          </div>
        )}
      </section>

      {modal !== null && (
        <PlanModal
          plan={modal === 'new' ? null : modal}
          planner={planner}
          subjects={planner.subjects}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

function PlanModal({
  plan,
  planner,
  subjects,
  onClose,
}: {
  plan: StudyPlan | null
  planner: PlannerApi
  subjects: Subject[]
  onClose: () => void
}) {
  const [form, setForm] = useState<PlanInput>(() =>
    plan
      ? {
          subjectId: plan.subjectId,
          title: plan.title,
          description: plan.description,
          plannedDate: plan.plannedDate,
          startTime: plan.startTime,
          endTime: plan.endTime,
          targetMinutes: plan.targetMinutes,
          priority: plan.priority,
          status: plan.status,
          memo: plan.memo,
        }
      : emptyPlanInput(subjects),
  )
  const [errors, setErrors] = useState<PlanErrors>({})
  const [busy, setBusy] = useState(false)

  function set<K extends keyof PlanInput>(key: K, value: PlanInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const selectable = subjects.filter(
    (s) => !s.archived || s.id === plan?.subjectId,
  )

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const found = validatePlan(form, subjects, Boolean(plan))
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setBusy(true)
    const ok = await planner.savePlan({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      memo: form.memo.trim(),
      ...(plan ? { id: plan.id } : {}),
    })
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <Modal
      title={plan ? '공부 계획 수정' : '새 공부 계획'}
      subtitle="과목과 날짜, 목표 시간을 확인한 뒤 저장됩니다."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={ghostButton}>
            취소
          </button>
          <button
            type="submit"
            form="plan-form"
            disabled={busy}
            className={primaryButton}
          >
            {busy ? '저장 중…' : plan ? '변경 저장' : '계획 추가'}
          </button>
        </>
      }
    >
      <form
        id="plan-form"
        onSubmit={submit}
        className="grid gap-4 sm:grid-cols-2"
      >
        <Field label="과목 *" error={errors.subjectId}>
          <select
            value={form.subjectId}
            onChange={(e) => set('subjectId', e.target.value)}
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
        <Field label="우선순위">
          <select
            value={form.priority}
            onChange={(e) => set('priority', e.target.value as Priority)}
            className={inputClass}
          >
            {(
              Object.entries(PRIORITY_LABEL) as [Priority, string][]
            ).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="제목 *" error={errors.title} className="sm:col-span-2">
          <input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            maxLength={100}
            placeholder="예: 수학 문제집 3단원 풀기"
            className={inputClass}
          />
        </Field>
        <Field label="상세 내용" className="sm:col-span-2">
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="공부할 범위나 목표를 적어주세요."
            className={inputClass}
          />
        </Field>
        <Field label="날짜 *" error={errors.plannedDate}>
          <input
            type="date"
            value={form.plannedDate}
            onChange={(e) => set('plannedDate', e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="목표 공부 시간 (분) *" error={errors.targetMinutes}>
          <input
            type="number"
            min={1}
            max={1440}
            value={form.targetMinutes}
            onChange={(e) => set('targetMinutes', Number(e.target.value))}
            className={inputClass}
          />
        </Field>
        <Field label="시작 시간" error={errors.startTime}>
          <input
            type="time"
            value={form.startTime}
            onChange={(e) => set('startTime', e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="종료 시간" error={errors.endTime}>
          <input
            type="time"
            value={form.endTime}
            onChange={(e) => set('endTime', e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="상태">
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value as PlanStatus)}
            className={inputClass}
          >
            {(
              Object.entries(STATUS_LABEL) as [PlanStatus, string][]
            ).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="메모" className="sm:col-span-2">
          <textarea
            value={form.memo}
            onChange={(e) => set('memo', e.target.value)}
            maxLength={1000}
            rows={2}
            placeholder="추가로 기억할 내용을 적어주세요."
            className={inputClass}
          />
        </Field>
        {planner.error && (
          <p className="rounded-lg bg-[#fff0f2] px-3 py-2 text-xs text-[#c84f61] sm:col-span-2">
            {planner.error}
          </p>
        )}
      </form>
    </Modal>
  )
}
