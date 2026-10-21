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
