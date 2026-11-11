export type Phase = 'idle' | 'focus' | 'break'

export interface TimerState {
  phase: Phase
  running: boolean
  /** 진행 중일 때의 종료 시각 (epoch ms) */
  endsAt: number
  /** 일시정지/대기 상태에서 남은 시간 (ms) */
  pauseRemaining: number
  focusMin: number
  breakMin: number
  updatedBy: string | null
}

export interface Member {
  uid: string
  name: string
  photo?: string
  joinedAt: number
}

export interface ChatMsg {
  id: string
  uid: string
  name: string
  photo?: string
  text: string
  ts: number
}

export interface Stroke {
  id: string
  uid: string
  color: string
  w: number
  /** 캔버스 크기에 대한 정규화 좌표 [x1, y1, x2, y2, ...] (0~1) */
  pts: number[]
}

export interface RoomData {
  code: string
  name: string
  hostUid: string
  createdAt: number
  timer: TimerState
}

export interface UserStats {
  uid: string
  name: string
  totalFocusMs: number
  streak: number
  longest: number
  lastStudyDate: string | null
  days: Record<string, number>
  lastMinuteKey: number
}

/* ── 공부 플래너 ───────────────────────────────────────────── */

export interface Subject {
  id: string
  name: string
  color: string
  archived: boolean
  createdAt: number
  updatedAt: number
}

export type PlanStatus = 'planned' | 'in_progress' | 'completed'

export type Priority = 'low' | 'medium' | 'high'

export interface StudyPlan {
  id: string
  subjectId: string
  title: string
  description: string
  /** YYYY-MM-DD (로컬 날짜) */
  plannedDate: string
  /** HH:mm, 미정이면 빈 문자열 */
  startTime: string
  endTime: string
  targetMinutes: number
  priority: Priority
  status: PlanStatus
  memo: string
  createdAt: number
  updatedAt: number
}

export interface PlanInput {
  subjectId: string
  title: string
  description: string
  plannedDate: string
  startTime: string
  endTime: string
  targetMinutes: number
  priority: Priority
  status: PlanStatus
  memo: string
}

export interface StudyRecord {
  id: string
  /** 실제 과목 id 또는 스터디 룸 기록을 뜻하는 특수 id */
  subjectId: string
  planId: string
  /** YYYY-MM-DD (로컬 날짜) — 통계 집계 기준 */
  dateKey: string
  source: 'room' | 'manual'
  startedAt: number
  endedAt: number
  durationMs: number
  memo: string
  createdAt: number
  /** 스터디 룸 기록의 분 단위 중복 집계 방지용 */
  lastMinuteKey?: number
}
