import type { PlanInput, Priority } from '../types'
import { isTime } from './planner'

export const PLAN_TEMPLATE_LIMIT = 20
const STORAGE_KEY = 'study-room:plan-templates:v1'

export interface PlanTemplate {
  id: string
  title: string
  subjectId: string
  description: string
  targetMinutes: number
  priority: Priority
  startTime: string
  endTime: string
  memo: string
  createdAt: number
}

export type PlanTemplateInput = Omit<PlanTemplate, 'id' | 'createdAt'>

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
  } catch {
    // randomUUID를 지원하지 않는 환경은 아래 fallback을 사용한다.
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** localStorage에 저장된 알 수 없는 값을 안전한 템플릿 목록으로 바꾼다. */
export function normalizePlanTemplates(value: unknown): PlanTemplate[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const out: PlanTemplate[] = []
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue
    const item = raw as Record<string, unknown>
    const id = String(item.id ?? '').trim()
    const title = String(item.title ?? '').trim()
    const subjectId = String(item.subjectId ?? '').trim()
    const targetMinutes = Number(item.targetMinutes)
    const priority = item.priority
    const startTime = String(item.startTime ?? '')
    const endTime = String(item.endTime ?? '')
    if (
      !id ||
      seen.has(id) ||
      !title ||
      title.length > 100 ||
      !subjectId ||
      !Number.isInteger(targetMinutes) ||
      targetMinutes < 1 ||
      targetMinutes > 1440 ||
      (priority !== 'low' && priority !== 'medium' && priority !== 'high') ||
      (startTime !== '' && !isTime(startTime)) ||
      (endTime !== '' && !isTime(endTime)) ||
      (startTime !== '' && endTime !== '' && endTime <= startTime)
    ) {
      continue
    }
    seen.add(id)
    out.push({
      id,
      title,
      subjectId,
      description: String(item.description ?? '').slice(0, 1000),
      targetMinutes,
      priority,
      startTime,
      endTime,
      memo: String(item.memo ?? '').slice(0, 1000),
      createdAt: Number(item.createdAt) || Date.now(),
    })
    if (out.length >= PLAN_TEMPLATE_LIMIT) break
  }
  return out
}

export function loadPlanTemplates(): PlanTemplate[] {
  const store = storage()
  if (!store) return []
  try {
    return normalizePlanTemplates(JSON.parse(store.getItem(STORAGE_KEY) ?? '[]'))
  } catch {
    return []
  }
}

function persist(templates: PlanTemplate[]): PlanTemplate[] {
  const next = templates.slice(0, PLAN_TEMPLATE_LIMIT)
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 저장 공간이 가득 차거나 차단된 경우에도 현재 화면은 계속 동작한다.
  }
  return next
}

export function savePlanTemplate(input: PlanTemplateInput): PlanTemplate[] {
  const template: PlanTemplate = {
    ...input,
    id: newId(),
    createdAt: Date.now(),
  }
  const existing = loadPlanTemplates().filter(
    (item) =>
      !(item.title === template.title && item.subjectId === template.subjectId),
  )
  return persist([template, ...existing])
}

export function deletePlanTemplate(id: string): PlanTemplate[] {
  return persist(loadPlanTemplates().filter((template) => template.id !== id))
}

/** 현재 계획 입력값에서 날짜·상태를 뺀 재사용 가능한 템플릿을 만든다. */
export function templateFromPlanInput(
  form: PlanInput,
): PlanTemplateInput | null {
  const title = form.title.trim()
  if (
    !title ||
    !form.subjectId.trim() ||
    !Number.isInteger(form.targetMinutes) ||
    form.targetMinutes < 1 ||
    form.targetMinutes > 1440 ||
    (form.priority !== 'low' &&
      form.priority !== 'medium' &&
      form.priority !== 'high') ||
    (form.startTime !== '' && !isTime(form.startTime)) ||
    (form.endTime !== '' && !isTime(form.endTime)) ||
    (form.startTime !== '' &&
      form.endTime !== '' &&
      form.endTime <= form.startTime)
  ) {
    return null
  }
  return {
    title,
    subjectId: form.subjectId,
    description: form.description.trim(),
    targetMinutes: form.targetMinutes,
    priority: form.priority,
    startTime: form.startTime,
    endTime: form.endTime,
    memo: form.memo.trim(),
  }
}
