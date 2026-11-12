import { useState, type FormEvent } from 'react'
import type { PlannerApi } from '../hooks/usePlanner'
import {
  PERIOD_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
  emptyPlanInput,
  filterPlans,
  isDateKey,
  repeatDates,
  todayKey,
  validatePlan,
  type PlanErrors,
  type PlanFilters,
  type Period,
} from '../lib/planner'
import { addDays } from '../lib/streak'
import { pointsForPlan } from '../lib/points'
import type {
  PlanInput,
  PlanStatus,
  Priority,
  Role,
  StudyPlan,
  Subject,
} from '../types'
import type { View } from './AppShell'
import { FocusTimer } from './FocusTimer'
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

const QUICK_TEMPLATES = [
  { title: '수학 30분', subjectName: '수학', minutes: 30 },
  { title: '영어 20분', subjectName: '영어', minutes: 20 },
  { title: '국어 30분', subjectName: '국어', minutes: 30 },
] as const

const REPEAT_DAYS = [
  { label: '월', value: 1 },
  { label: '화', value: 2 },
  { label: '수', value: 3 },
  { label: '목', value: 4 },
  { label: '금', value: 5 },
  { label: '토', value: 6 },
  { label: '일', value: 0 },
] as const

interface PlansProps {
  planner: PlannerApi
  onNavigate: (view: View) => void
  role?: Role
}

export function Plans({ planner, onNavigate, role = 'student' }: PlansProps) {
  const [filters, setFilters] = useState<PlanFilters>({
    period: 'all',
    subjectId: 'all',
    status: 'all',
  })
  const [modal, setModal] = useState<'new' | StudyPlan | null>(null)
  const [focusPlan, setFocusPlan] = useState<StudyPlan | null>(null)
  const [rescheduleBusy, setRescheduleBusy] = useState(false)
  const [query, setQuery] = useState('')
  const isParent = role === 'parent'
  const today = todayKey()
  const overdue = planner.plans.filter(
    (plan) => plan.plannedDate < today && plan.status !== 'completed',
  )

  const activeSubjects = planner.subjects.filter((s) => !s.archived)
  const normalizedQuery = query.trim().toLowerCase()
  const visible = filterPlans(planner.plans, filters).filter((plan) =>
    normalizedQuery
      ? [plan.title, plan.description, plan.memo].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        )
      : true,
  )

  const addTemplate = async (template: (typeof QUICK_TEMPLATES)[number]) => {
    const subject =
      activeSubjects.find((item) => item.name === template.subjectName) ??
      activeSubjects[0]
    if (!subject) return
    await planner.savePlan({
      ...emptyPlanInput([subject]),
      title: template.title,
      targetMinutes: template.minutes,
    })
  }

  const openNew = () => {
    if (activeSubjects.length === 0) {
      if (!isParent) onNavigate('subjects')
      return
    }
    setModal('new')
  }

  const moveToToday = async (plan: StudyPlan) => {
    setRescheduleBusy(true)
    await planner.savePlan({
      id: plan.id,
      subjectId: plan.subjectId,
      title: plan.title,
      description: plan.description,
      plannedDate: today,
      startTime: plan.startTime,
      endTime: plan.endTime,
      targetMinutes: plan.targetMinutes,
      priority: plan.priority,
      status: plan.status,
      completedAt: plan.completedAt,
      memo: plan.memo,
    })
    setRescheduleBusy(false)
  }

  const moveAllToToday = async () => {
    if (overdue.length === 0) return
    setRescheduleBusy(true)
    for (const plan of overdue) {
      await planner.savePlan({
        id: plan.id,
        subjectId: plan.subjectId,
        title: plan.title,
        description: plan.description,
        plannedDate: today,
        startTime: plan.startTime,
        endTime: plan.endTime,
        targetMinutes: plan.targetMinutes,
        priority: plan.priority,
        status: plan.status,
        completedAt: plan.completedAt,
        memo: plan.memo,
      })
    }
    setRescheduleBusy(false)
  }

  return (
    <div>
      <PageHeader
        eyebrow={isParent ? 'PARENT PLAN MANAGEMENT' : 'PLAN MANAGEMENT'}
        title={isParent ? '자녀 공부 일정' : '공부 계획'}
        description={
          isParent
            ? '일정을 추가·삭제하고, 완료된 일정의 체크를 취소할 수 있어요.'
            : '날짜와 상태를 정리하고, 오늘 해야 할 일을 선명하게 만드세요.'
        }
        action={
          <div className="flex flex-wrap gap-2">
            {!isParent && (
              <button
                type="button"
                onClick={() => onNavigate('subjects')}
                className={ghostButton}
              >
                과목 관리
              </button>
            )}
            <button
              type="button"
              onClick={openNew}
              disabled={isParent && activeSubjects.length === 0}
              title={
                isParent && activeSubjects.length === 0
                  ? '자녀가 과목을 먼저 추가해야 해요.'
                  : undefined
              }
              className={primaryButton}
            >
              ＋ 계획 추가
            </button>
          </div>
        }
      />

      {planner.subjects.length === 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#f2e0bd] bg-[#fff9ec] px-4 py-3 text-sm text-[#8f7b58]">
          <span>
            {isParent
              ? '자녀가 과목을 추가하면 일정을 만들 수 있어요.'
              : '계획을 만들려면 먼저 과목이 필요해요.'}
          </span>
          {!isParent && (
            <button
              type="button"
              onClick={() => onNavigate('subjects')}
              className="text-xs font-semibold underline underline-offset-2"
            >
              과목 추가하기 →
            </button>
          )}
        </div>
      )}

      {activeSubjects.length > 0 && (
        <section
          className={`${panelClass} mb-4 flex flex-wrap items-center gap-2 p-4`}
        >
          <span className="mr-1 text-xs font-extrabold text-[#5f5c78]">
            빠른 루틴
          </span>
          {QUICK_TEMPLATES.map((template) => (
            <button
              key={template.title}
              type="button"
              onClick={() => void addTemplate(template)}
              className="rounded-lg border border-[#f1eef9] bg-white px-2.5 py-1.5 text-xs font-bold text-[#706d8a] transition hover:border-[#d8d3e8] hover:bg-[#fbf9ff] hover:text-[#6f68e8]"
            >
              + {template.title}
            </button>
          ))}
        </section>
      )}

      {overdue.length > 0 && (
        <section className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f2e0bd] bg-[#fff9ec] px-4 py-3 text-sm text-[#8f7b58]">
          <span>
            <strong className="font-extrabold">{overdue.length}개</strong>의
            밀린 계획이 있어요. 오늘로 옮겨 다시 시작해 보세요.
          </span>
          <button
            type="button"
            onClick={() => void moveAllToToday()}
            disabled={rescheduleBusy}
            className={ghostButton}
          >
            {rescheduleBusy ? '이동 중…' : '모두 오늘로'}
          </button>
        </section>
      )}

      <section
        className={`${panelClass} mb-4 flex flex-wrap items-end gap-3 p-4`}
      >
        <Field label="검색" className="min-w-[180px] flex-1 sm:flex-none">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="제목·내용·메모 검색"
            className={inputClass}
          />
        </Field>
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
          onClick={() => {
            setQuery('')
            setFilters({ period: 'all', subjectId: 'all', status: 'all' })
          }}
          className={ghostButton}
        >
          초기화
        </button>
        <span className="ml-auto text-xs text-[#a8a5bb]">
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
                  style={{ backgroundColor: subject?.color ?? '#8b88a3' }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-extrabold text-[#3d3a55]">
                      {plan.title}
                    </h2>
                    <StatusBadge status={plan.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#a8a5bb]">
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
                    <span
                      className={
                        plan.status === 'completed'
                          ? 'font-bold text-[#3f9f7f]'
                          : ''
                      }
                    >
                      {plan.status === 'completed'
                        ? `+${pointsForPlan(plan.targetMinutes)}P 획득`
                        : `완료 시 ${pointsForPlan(plan.targetMinutes)}P`}
                    </span>
                  </div>
                  {plan.description && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#8b88a3]">
                      {plan.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                  {!isParent && (
                    <button
                      type="button"
                      onClick={() => setFocusPlan(plan)}
                      className="rounded-md border border-[#e6e1ff] bg-[#f7f4ff] px-2 py-1 text-[11px] font-extrabold text-[#6a63c9] transition hover:border-[#b9b4ff] hover:bg-[#f1eeff]"
                    >
                      집중
                    </button>
                  )}
                  {plan.plannedDate < today && plan.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => void moveToToday(plan)}
                      disabled={rescheduleBusy}
                      className="rounded-md border border-[#f2e0bd] bg-[#fff9ec] px-2 py-1 text-[11px] font-extrabold text-[#9a7b4f] transition hover:border-[#e6c58f] hover:bg-[#fff4df]"
                    >
                      오늘로
                    </button>
                  )}
                  <select
                    value={plan.status}
                    onChange={(e) =>
                      void planner.setPlanStatus(
                        plan.id,
                        e.target.value as PlanStatus,
                      )
                    }
                    aria-label={`${plan.title} 상태`}
                    className="rounded-md border border-[#e4e0f0] bg-white px-2 py-1.5 text-xs font-medium text-[#5f5c78] outline-none focus:border-[#7d8af0]"
                  >
                    <option value="planned">예정</option>
                    <option value="in_progress">진행 중</option>
                    <option value="completed">완료</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setModal(plan)}
                    aria-label="계획 수정"
                    className="grid h-8 w-8 place-items-center rounded-md bg-[#f7f4ff] text-[#77748f] transition hover:bg-[#f1eeff] hover:text-[#7c74f0]"
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
                    className="grid h-8 w-8 place-items-center rounded-md bg-[#f7f4ff] text-[#d96a7c] transition hover:bg-[#ffeff3]"
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
      {focusPlan && (
        <FocusTimer
          key={focusPlan.id}
          plan={focusPlan}
          planner={planner}
          onClose={() => setFocusPlan(null)}
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
          completedAt: plan.completedAt,
          memo: plan.memo,
        }
      : emptyPlanInput(subjects),
  )
  const [errors, setErrors] = useState<PlanErrors>({})
  const [busy, setBusy] = useState(false)
  const initialDate = plan?.plannedDate ?? todayKey()
  const [repeat, setRepeat] = useState(false)
  const [repeatDays, setRepeatDays] = useState<number[]>(() => [
    new Date(`${initialDate}T12:00:00`).getDay(),
  ])
  const [repeatUntil, setRepeatUntil] = useState(() =>
    addDays(initialDate, 27),
  )
  const [repeatError, setRepeatError] = useState('')

  function set<K extends keyof PlanInput>(key: K, value: PlanInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key === 'plannedDate' && typeof value === 'string') {
      setRepeatUntil((prev) => (prev < value ? addDays(value, 27) : prev))
      setRepeatDays((prev) =>
        prev.length > 0 ? prev : [new Date(`${value}T12:00:00`).getDay()],
      )
      setRepeatError('')
    }
  }

  const selectable = subjects.filter(
    (s) => !s.archived || s.id === plan?.subjectId,
  )
  const repeatCount =
    repeat && isDateKey(repeatUntil)
      ? repeatDates(form.plannedDate, repeatUntil, repeatDays).length
      : 0

  const toggleRepeatDay = (day: number) => {
    setRepeatDays((prev) =>
      prev.includes(day)
        ? prev.filter((value) => value !== day)
        : [...prev, day].sort((a, b) => a - b),
    )
    setRepeatError('')
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const found = validatePlan(form, subjects, Boolean(plan))
    setErrors(found)
    if (Object.keys(found).length > 0) return

    if (!plan && repeat) {
      if (!isDateKey(repeatUntil)) {
        setRepeatError('반복 종료일을 선택해 주세요.')
        return
      }
      if (repeatDays.length === 0) {
        setRepeatError('반복할 요일을 하나 이상 선택해 주세요.')
        return
      }
      const dates = repeatDates(form.plannedDate, repeatUntil, repeatDays)
      if (dates.length === 0) {
        setRepeatError('선택한 기간에 반복할 날짜가 없어요.')
        return
      }
      setRepeatError('')
      setBusy(true)
      const ok = await planner.savePlans(
        dates.map((date) => ({ ...form, plannedDate: date })),
      )
      setBusy(false)
      if (ok) onClose()
      return
    }

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
        <div className="rounded-xl border border-[#e6e1ff] bg-[#f7f4ff] px-3 py-2.5 text-xs leading-relaxed text-[#6a63c9] sm:col-span-2">
          이 계획을 완료하면{' '}
          <strong>{pointsForPlan(form.targetMinutes)}P</strong>를 받아요.
          목표 시간이 길수록 보너스 포인트가 커져요.
        </div>
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
        {!plan && (
          <div className="rounded-xl border border-[#e6e1ff] bg-[#faf9ff] p-4 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-extrabold text-[#3d3a55]">
              <input
                type="checkbox"
                checked={repeat}
                onChange={(event) => {
                  setRepeat(event.target.checked)
                  setRepeatError('')
                }}
                className="h-4 w-4 accent-[#7c74f0]"
              />
              반복 계획 만들기
            </label>
            {repeat && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <span className="mb-2 block text-xs font-bold text-[#5f5c78]">
                    반복 요일
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {REPEAT_DAYS.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleRepeatDay(day.value)}
                        aria-pressed={repeatDays.includes(day.value)}
                        className={`grid h-9 w-9 place-items-center rounded-lg text-xs font-extrabold transition ${
                          repeatDays.includes(day.value)
                            ? 'bg-[#f1eeff] text-[#6a63c9] ring-1 ring-[#d6d1ff]'
                            : 'bg-white text-[#8b88a3] ring-1 ring-[#ece8f7] hover:text-[#6f68e8]'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Field label="반복 종료일">
                  <input
                    type="date"
                    min={form.plannedDate}
                    value={repeatUntil}
                    onChange={(event) => {
                      setRepeatUntil(event.target.value)
                      setRepeatError('')
                    }}
                    className={inputClass}
                  />
                </Field>
                <div className="flex items-end pb-1 text-xs text-[#8b88a3]">
                  {repeatCount > 0
                    ? `${repeatCount}개의 계획이 생성돼요. (최대 31개)`
                    : '선택한 기간에 만들 계획이 없어요.'}
                </div>
                {repeatError && (
                  <p className="text-xs font-semibold text-[#d96a7c] sm:col-span-2">
                    {repeatError}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        {planner.error && (
          <p className="rounded-lg bg-[#ffeff3] px-3 py-2 text-xs text-[#d96a7c] sm:col-span-2">
            {planner.error}
          </p>
        )}
      </form>
    </Modal>
  )
}
