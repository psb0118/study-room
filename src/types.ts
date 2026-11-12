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

/** 공부 계획 시작 전 알림 시점(분) */
export type PlanReminderOffset = 0 | 5 | 10 | 15 | 30

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
  /** 완료로 바뀐 시각 (주간 리그 집계 기준) */
  completedAt: number
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
  /** 기존 계획 수정 시 완료 시각을 보존하기 위한 값 */
  completedAt?: number
  memo: string
}

/* ── 계정 · 가족 · 포인트 ───────────────────────────────── */

export type Role = 'student' | 'parent' | 'admin'

export type ProfileRole = Role | ''

export type AccountStatus = 'active' | 'suspended'

export interface UserProfile {
  uid: string
  name: string
  /** 순위표에 표시할 이름. 비어 있으면 name을 쓴다. */
  nickname: string
  email: string
  photo: string
  role: ProfileRole
  /** 학생이 부모에게 알려주는 6자리 연결 코드 */
  familyCode: string
  /** 부모 계정이 마지막으로 선택한 자녀의 uid */
  childUid: string
  /** 부모 계정에 연결된 모든 자녀 uid */
  childUids: string[]
  /** 자녀 uid별 표시 이름 */
  childNames: Record<string, string>
  /** 관리자 화면에서 관리하는 계정 이용 상태 */
  accountStatus: AccountStatus
  /** 이용 정지 시 관리자가 입력한 사유. 재개하면 비운다. */
  statusReason: string
  statusUpdatedAt: number
  statusUpdatedBy: string
  /** 과목 id별 주간 목표 분량 */
  weeklyGoals: Record<string, number>
  /** 학습 알림 사용 여부 */
  reminderEnabled: boolean
  reminderTime: string
  /** IANA 시간대. 예: Asia/Seoul */
  reminderTimezone: string
  /** FCM 기기 토큰이 등록됐는지 여부 */
  pushEnabled: boolean
  /** 공부 계획 시작 시각 알림 사용 여부 */
  planReminderEnabled: boolean
  /** 계획 시작 몇 분 전에 알릴지 */
  planReminderOffsetMinutes: PlanReminderOffset
  /** 서버가 마지막으로 알림을 보낸 로컬 날짜 */
  lastReminderKey: string
  lastReminderAt: number
  createdAt: number
  updatedAt: number
}

export interface LeaderboardEntry {
  uid: string
  name: string
  photo: string
  points: number
  level: number
  updatedAt: number
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
