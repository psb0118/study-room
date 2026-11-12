import { describe, expect, it } from 'vitest'
import type {
  StudyPlan,
  StudyRecord,
  Subject,
  UserProfile,
} from '../types'
import { buildExportBundle, exportFileName } from './exportData'

const parent: UserProfile = {
  uid: 'parent-1',
  name: '보호자',
  nickname: '엄마',
  email: 'parent@example.com',
  photo: '',
  role: 'parent',
  familyCode: '',
  childUid: 'student-1',
  childUids: ['student-1'],
  childNames: { 'student-1': '민준' },
  accountStatus: 'active',
  statusReason: '',
  statusUpdatedAt: 0,
  statusUpdatedBy: '',
  weeklyGoals: {},
  reminderEnabled: false,
  reminderTime: '19:00',
  reminderTimezone: 'Asia/Seoul',
  pushEnabled: false,
  lastReminderKey: '',
  lastReminderAt: 0,
  createdAt: 1,
  updatedAt: 2,
}

const student: UserProfile = {
  uid: 'student-1',
  name: '민준',
  nickname: '공부왕',
  email: 'student@example.com',
  photo: '',
  role: 'student',
  familyCode: 'ABC123',
  childUid: '',
  childUids: [],
  childNames: {},
  accountStatus: 'active',
  statusReason: '',
  statusUpdatedAt: 0,
  statusUpdatedBy: '',
  weeklyGoals: {},
  reminderEnabled: false,
  reminderTime: '19:00',
  reminderTimezone: 'Asia/Seoul',
  pushEnabled: false,
  lastReminderKey: '',
  lastReminderAt: 0,
  createdAt: 3,
  updatedAt: 4,
}

const subject: Subject = {
  id: 'subject-1',
  name: '수학',
  color: '#7c74f0',
  archived: false,
  createdAt: 5,
  updatedAt: 6,
}

const plan: StudyPlan = {
  id: 'plan-1',
  subjectId: subject.id,
  title: '분수 복습',
  description: '',
  plannedDate: '2026-11-11',
  startTime: '18:00',
  endTime: '18:30',
  targetMinutes: 30,
  priority: 'medium',
  status: 'completed',
  completedAt: 7,
  memo: '',
  createdAt: 7,
  updatedAt: 8,
}

const record: StudyRecord = {
  id: 'record-1',
  subjectId: subject.id,
  planId: plan.id,
  dateKey: '2026-11-11',
  source: 'manual',
  startedAt: 7,
  endedAt: 8,
  durationMs: 30 * 60_000,
  memo: '',
  createdAt: 8,
}

describe('buildExportBundle', () => {
  it('exports the selected child data with the parent as the exporter', () => {
    const bundle = buildExportBundle(
      {
        exportedBy: parent,
        target: student,
        subjects: [subject],
        plans: [plan],
        records: [record],
      },
      new Date('2026-11-11T12:00:00.000Z'),
    )

    expect(bundle.app).toBe('하루결')
    expect(bundle.version).toBe(1)
    expect(bundle.exportedAt).toBe('2026-11-11T12:00:00.000Z')
    expect(bundle.exportedBy).toEqual({
      uid: parent.uid,
      name: parent.name,
      role: 'parent',
    })
    expect(bundle.profile.uid).toBe(student.uid)
    expect(bundle.subjects).toHaveLength(1)
    expect(bundle.plans).toHaveLength(1)
    expect(bundle.records).toHaveLength(1)
  })

  it('keeps a stable, readable file name and removes unsafe characters', () => {
    expect(
      exportFileName(
        { name: '민준', nickname: '공부/왕' },
        new Date(2026, 10, 11, 12),
      ),
    ).toBe('haru-gyeol-공부왕-2026-11-11.json')
  })
})
