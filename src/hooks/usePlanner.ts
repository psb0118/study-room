import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { fs } from '../firebase'
import { SUBJECT_COLORS, todayKey } from '../lib/planner'
import { STUDY_USERS } from '../lib/stats'
import type {
  PlanInput,
  PlanStatus,
  StudyPlan,
  StudyRecord,
  Subject,
} from '../types'

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message
  return '알 수 없는 오류가 발생했습니다.'
}

function asSubject(id: string, data: Record<string, unknown>): Subject {
  return {
    id,
    name: String(data.name ?? '과목'),
    color: String(data.color ?? SUBJECT_COLORS[0]),
    archived: Boolean(data.archived),
    createdAt: Number(data.createdAt) || 0,
    updatedAt: Number(data.updatedAt) || 0,
  }
}

function asPlan(id: string, data: Record<string, unknown>): StudyPlan {
  const priority = data.priority
  const status = data.status
  return {
    id,
    subjectId: String(data.subjectId ?? ''),
    title: String(data.title ?? '제목 없음'),
    description: String(data.description ?? ''),
    plannedDate: String(data.plannedDate ?? todayKey()),
    startTime: String(data.startTime ?? ''),
    endTime: String(data.endTime ?? ''),
    targetMinutes: Number(data.targetMinutes) || 30,
    priority: priority === 'low' || priority === 'high' ? priority : 'medium',
    status:
      status === 'in_progress' || status === 'completed' ? status : 'planned',
    memo: String(data.memo ?? ''),
    createdAt: Number(data.createdAt) || 0,
    updatedAt: Number(data.updatedAt) || 0,
  }
}

function asRecord(id: string, data: Record<string, unknown>): StudyRecord {
  const startedAt = Number(data.startedAt) || 0
  return {
    id,
    subjectId: String(data.subjectId ?? ''),
    planId: String(data.planId ?? ''),
    dateKey: String(data.dateKey ?? ''),
    source: data.source === 'room' ? 'room' : 'manual',
    startedAt,
    endedAt: Number(data.endedAt) || startedAt,
    durationMs: Math.max(0, Number(data.durationMs) || 0),
    memo: String(data.memo ?? ''),
    createdAt: Number(data.createdAt) || startedAt,
    ...(typeof data.lastMinuteKey === 'number'
      ? { lastMinuteKey: data.lastMinuteKey }
      : {}),
  }
}

export interface ManualRecordInput {
  subjectId: string
  planId: string
  date: string
  minutes: number
  memo: string
}

export function usePlanner(uid: string) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [plans, setPlans] = useState<StudyPlan[]>([])
  const [records, setRecords] = useState<StudyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const subjectsCol = useMemo(
    () => collection(fs, STUDY_USERS, uid, 'subjects'),
    [uid],
  )
  const plansCol = useMemo(
    () => collection(fs, STUDY_USERS, uid, 'plans'),
    [uid],
  )
  const recordsCol = useMemo(
    () => collection(fs, STUDY_USERS, uid, 'records'),
    [uid],
  )

  useEffect(() => {
    let active = true
    const seen = new Set<string>()
    const done = (key: string) => {
      seen.add(key)
      if (active && seen.size === 3) setLoading(false)
    }

    const unsubs = [
      onSnapshot(
        subjectsCol,
        (snap) => {
          if (!active) return
          setSubjects(
            snap.docs.map((d) =>
              asSubject(d.id, d.data() as Record<string, unknown>),
            ),
          )
          done('subjects')
        },
        (e) => {
          if (!active) return
          setError(messageOf(e))
          done('subjects')
        },
      ),
      onSnapshot(
        plansCol,
        (snap) => {
          if (!active) return
          setPlans(
            snap.docs.map((d) =>
              asPlan(d.id, d.data() as Record<string, unknown>),
            ),
          )
          done('plans')
        },
        (e) => {
          if (!active) return
          setError(messageOf(e))
          done('plans')
        },
      ),
      onSnapshot(
        recordsCol,
        (snap) => {
          if (!active) return
          setRecords(
            snap.docs.map((d) =>
              asRecord(d.id, d.data() as Record<string, unknown>),
            ),
          )
          done('records')
        },
        (e) => {
          if (!active) return
          setError(messageOf(e))
          done('records')
        },
      ),
    ]

    return () => {
      active = false
      unsubs.forEach((unsub) => unsub())
    }
  }, [subjectsCol, plansCol, recordsCol])

  const run = async (action: () => Promise<void>): Promise<boolean> => {
    setError(null)
    try {
      await action()
      return true
    } catch (e) {
      setError(messageOf(e))
      return false
    }
  }

  const saveSubject = async (input: {
    id?: string
    name: string
    color: string
  }) =>
    run(async () => {
      const name = input.name.trim()
      if (!name) throw new Error('과목명을 입력해 주세요.')
      const now = Date.now()
      if (input.id) {
        await updateDoc(doc(subjectsCol, input.id), {
          name,
          color: input.color,
          updatedAt: now,
        })
      } else {
        await setDoc(doc(subjectsCol), {
          name,
          color: input.color,
          archived: false,
          createdAt: now,
          updatedAt: now,
        })
      }
    })

  const setSubjectArchived = async (id: string, archived: boolean) =>
    run(async () => {
      await updateDoc(doc(subjectsCol, id), { archived, updatedAt: Date.now() })
    })

  const savePlan = async (input: PlanInput & { id?: string }) => {
    const { id, ...rest } = input
    return run(async () => {
      const now = Date.now()
      const payload = {
        ...rest,
        title: rest.title.trim(),
        description: rest.description.trim(),
        memo: rest.memo.trim(),
        updatedAt: now,
      }
      if (id) {
        await updateDoc(doc(plansCol, id), payload)
      } else {
        await setDoc(doc(plansCol), { ...payload, createdAt: now })
      }
    })
  }

  const deletePlan = async (id: string) =>
    run(async () => {
      await deleteDoc(doc(plansCol, id))
    })

  const setPlanStatus = async (id: string, status: PlanStatus) =>
    run(async () => {
      await updateDoc(doc(plansCol, id), { status, updatedAt: Date.now() })
    })

  const addManualRecord = async (input: ManualRecordInput) =>
    run(async () => {
      const minutes = Math.round(input.minutes)
      if (!Number.isFinite(minutes) || minutes < 1 || minutes > 1440) {
        throw new Error('공부 시간은 1~1440분 사이로 입력해 주세요.')
      }
      const ended = new Date(`${input.date}T12:00:00`)
      if (Number.isNaN(ended.valueOf())) {
        throw new Error('올바른 날짜를 선택해 주세요.')
      }
      const started = new Date(ended.getTime() - minutes * 60_000)
      await setDoc(doc(recordsCol), {
        subjectId: input.subjectId,
        planId: input.planId,
        dateKey: input.date,
        source: 'manual',
        startedAt: started.getTime(),
        endedAt: ended.getTime(),
        durationMs: minutes * 60_000,
        memo: input.memo.trim(),
        createdAt: Date.now(),
      })
    })

  const deleteRecord = async (id: string) =>
    run(async () => {
      await deleteDoc(doc(recordsCol, id))
    })

  return {
    subjects,
    plans,
    records,
    loading,
    error,
    saveSubject,
    setSubjectArchived,
    savePlan,
    deletePlan,
    setPlanStatus,
    addManualRecord,
    deleteRecord,
  }
}

export type PlannerApi = ReturnType<typeof usePlanner>
