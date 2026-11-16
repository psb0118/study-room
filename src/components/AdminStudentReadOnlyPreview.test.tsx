import { renderToStaticMarkup } from 'react-dom/server'
import type { User } from 'firebase/auth'
import { describe, expect, it, vi } from 'vitest'
import { defaultProfile } from '../lib/profile'
import { AdminStudentReadOnlyPreview } from './AdminStudentReadOnlyPreview'

const mocks = vi.hoisted(() => {
  const now = new Date()
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')

  return {
    planner: {
      subjects: [
        {
          id: 'subject-math',
          name: '수학',
          color: '#7c74f0',
          archived: false,
          createdAt: 0,
          updatedAt: 0,
        },
      ],
      plans: [
        {
          id: 'plan-math',
          subjectId: 'subject-math',
          title: '수학 문제집 2단원',
          description: '',
          plannedDate: today,
          startTime: '',
          endTime: '',
          targetMinutes: 30,
          priority: 'medium',
          status: 'planned',
          completedAt: 0,
          memo: '',
          createdAt: 0,
          updatedAt: 0,
        },
      ],
      records: [],
      loading: false,
      error: null,
    },
  }
})

vi.mock('../hooks/usePlanner', () => ({
  usePlanner: () => mocks.planner,
}))

vi.mock('../hooks/useProfile', () => ({
  useChildProfile: () => ({
    profile: {
      uid: 'student-1',
      email: 'student@example.com',
      name: '테스트 학생',
      nickname: '테스트 학생',
      photo: '',
      role: 'student',
      accountStatus: 'active',
      weeklyGoals: {},
      reminderEnabled: false,
      reminderTime: '20:00',
      reminderTimezone: 'Asia/Seoul',
      pushEnabled: false,
      planReminderEnabled: false,
      planReminderOffsetMinutes: 10,
      childUids: [],
      familyCode: '',
      statusReason: '',
      createdAt: 0,
      lastSeenAt: 0,
    },
    loading: false,
    error: null,
  }),
}))

describe('AdminStudentReadOnlyPreview', () => {
  it('renders real student data without edit controls', () => {
    const student = defaultProfile({
      uid: 'student-1',
      email: 'student@example.com',
      displayName: '테스트 학생',
      photoURL: null,
    } as User)

    const html = renderToStaticMarkup(
      <AdminStudentReadOnlyPreview
        student={student}
        onExit={() => undefined}
      />,
    )

    expect(html).toContain('테스트 학생 학생의 실제 플래너')
    expect(html).toContain('읽기 전용')
    expect(html).toContain('실제 학생 데이터를 읽기만 하며')
    expect(html).not.toContain('데모 데이터로만 동작')
    expect(html).toContain('수학 문제집 2단원')
    expect(html).not.toContain('계획 추가')
    expect(html).not.toContain('스터디 룸 입장')
  })
})
