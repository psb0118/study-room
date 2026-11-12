import type {
  StudyPlan,
  StudyRecord,
  Subject,
  UserProfile,
} from '../types'
import { isDateKey, isTime, ROOM_SUBJECT_ID } from './planner'

export interface ExportBundle {
  app: '하루결'
  version: 1
  exportedAt: string
  exportedBy: {
    uid: string
    name: string
    role: UserProfile['role']
  }
  profile: UserProfile
  subjects: Subject[]
  plans: StudyPlan[]
  records: StudyRecord[]
}

interface BuildExportInput {
  exportedBy: UserProfile
  target: UserProfile
  subjects?: Subject[]
  plans?: StudyPlan[]
  records?: StudyRecord[]
}

/** JSON 내보내기에서 복원할 수 있는 학습 데이터. 프로필은 덮어쓰지 않는다. */
export interface ImportBundle {
  subjects: Subject[]
  plans: StudyPlan[]
  records: StudyRecord[]
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('가져올 데이터 형식이 올바르지 않아요.')
  }
  return value as Record<string, unknown>
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function count(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function itemId(value: unknown, label: string): string {
  const id = text(value).trim()
  if (!id || id.includes('/')) {
    throw new Error(`${label}의 ID가 올바르지 않아요.`)
  }
  return id
}

function parseSubject(value: unknown): Subject {
  const raw = asRecord(value)
  const name = text(raw.name).trim()
  if (!name) throw new Error('과목 이름이 비어 있어요.')
  return {
    id: itemId(raw.id, '과목'),
    name,
    color: text(raw.color, '#7c74f0'),
    archived: raw.archived === true,
    createdAt: count(raw.createdAt),
    updatedAt: count(raw.updatedAt),
  }
}

function parsePlan(value: unknown, subjectIds: Set<string>): StudyPlan {
  const raw = asRecord(value)
  const plannedDate = text(raw.plannedDate)
  if (!isDateKey(plannedDate)) throw new Error('계획 날짜가 올바르지 않아요.')

  const startTime = text(raw.startTime)
  const endTime = text(raw.endTime)
  if (startTime && !isTime(startTime)) {
    throw new Error('계획 시작 시간이 올바르지 않아요.')
  }
  if (endTime && !isTime(endTime)) {
    throw new Error('계획 종료 시간이 올바르지 않아요.')
  }

  const subjectId = text(raw.subjectId)
  if (!subjectIds.has(subjectId)) {
    throw new Error('계획에 연결된 과목을 찾을 수 없어요.')
  }

  const targetMinutes = Math.round(count(raw.targetMinutes, 30))
  if (targetMinutes < 1 || targetMinutes > 1440) {
    throw new Error('계획 목표 시간이 올바르지 않아요.')
  }

  const priority =
    raw.priority === 'low' || raw.priority === 'high' ? raw.priority : 'medium'
  const status =
    raw.status === 'in_progress' || raw.status === 'completed'
      ? raw.status
      : 'planned'

  return {
    id: itemId(raw.id, '계획'),
    subjectId,
    title: text(raw.title).trim() || '제목 없음',
    description: text(raw.description),
    plannedDate,
    startTime,
    endTime,
    targetMinutes,
    priority,
    status,
    completedAt: count(raw.completedAt),
    memo: text(raw.memo),
    createdAt: count(raw.createdAt),
    updatedAt: count(raw.updatedAt),
  }
}

function parseRecord(value: unknown): StudyRecord {
  const raw = asRecord(value)
  const dateKey = text(raw.dateKey)
  if (!isDateKey(dateKey)) throw new Error('기록 날짜가 올바르지 않아요.')

  const startedAt = count(raw.startedAt)
  const endedAt = count(raw.endedAt, startedAt)
  const durationMs = Math.max(0, count(raw.durationMs))
  if (durationMs > 86_400_000) {
    throw new Error('공부 기록 시간이 너무 커요.')
  }

  return {
    id: itemId(raw.id, '기록'),
    subjectId: text(raw.subjectId, ROOM_SUBJECT_ID),
    planId: text(raw.planId),
    dateKey,
    source: raw.source === 'room' ? 'room' : 'manual',
    startedAt,
    endedAt,
    durationMs,
    memo: text(raw.memo),
    createdAt: count(raw.createdAt, startedAt),
    ...(typeof raw.lastMinuteKey === 'number'
      ? { lastMinuteKey: raw.lastMinuteKey }
      : {}),
  }
}

/** 내보낸 JSON을 검증하고 학습 데이터만 복원 가능한 형태로 만든다. */
export function parseImportBundle(rawText: string): ImportBundle {
  let value: unknown
  try {
    value = JSON.parse(rawText)
  } catch {
    throw new Error('JSON 파일을 읽지 못했어요. 올바른 파일인지 확인해 주세요.')
  }

  const root = asRecord(value)
  if (root.app !== '하루결' || root.version !== 1) {
    throw new Error('하루결 JSON 백업 파일이 아니에요.')
  }
  if (!Array.isArray(root.subjects) || !Array.isArray(root.plans)) {
    throw new Error('백업 파일에 과목·계획 데이터가 없어요.')
  }

  const subjects = root.subjects.map(parseSubject)
  const subjectIds = new Set(subjects.map((subject) => subject.id))
  const plans = root.plans.map((plan) => parsePlan(plan, subjectIds))
  const records = Array.isArray(root.records)
    ? root.records.map(parseRecord)
    : []

  return { subjects, plans, records }
}

/**
 * 현재 화면에 불러온 학습 데이터를 그대로 JSON으로 묶는다.
 * 네트워크를 다시 호출하지 않아 오프라인에서도 내보낼 수 있다.
 */
export function buildExportBundle(
  input: BuildExportInput,
  now = new Date(),
): ExportBundle {
  return {
    app: '하루결',
    version: 1,
    exportedAt: now.toISOString(),
    exportedBy: {
      uid: input.exportedBy.uid,
      name: input.exportedBy.name,
      role: input.exportedBy.role,
    },
    profile: { ...input.target },
    subjects: (input.subjects ?? []).map((subject) => ({ ...subject })),
    plans: (input.plans ?? []).map((plan) => ({ ...plan })),
    records: (input.records ?? []).map((record) => ({ ...record })),
  }
}

/** 파일 이름에 쓸 수 없는 문자를 제거하고 날짜를 붙인다. */
export function exportFileName(
  profile: Pick<UserProfile, 'name' | 'nickname'>,
  now = new Date(),
): string {
  const rawName = profile.nickname.trim() || profile.name.trim() || '하루결'
  const safeName =
    rawName.replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 40) || '하루결'
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
  return `haru-gyeol-${safeName}-${date}.json`
}
