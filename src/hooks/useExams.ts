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
import { firestoreMessage } from '../lib/errors'
import { isDateKey, isTime, todayKey } from '../lib/planner'
import { STUDY_USERS } from '../lib/stats'
import type { Exam, ExamInput } from '../types'

function asExam(id: string, data: Record<string, unknown>): Exam {
  const examDate = String(data.examDate ?? '')
  return {
    id,
    title: String(data.title ?? '시험'),
    subjectId: String(data.subjectId ?? ''),
    examDate: isDateKey(examDate) ? examDate : todayKey(),
    startTime: String(data.startTime ?? ''),
    memo: String(data.memo ?? ''),
    createdAt: Number(data.createdAt) || 0,
    updatedAt: Number(data.updatedAt) || 0,
  }
}

function sortExams(exams: Exam[]): Exam[] {
  return [...exams].sort((a, b) =>
    `${a.examDate}|${a.startTime || '99:99'}|${a.createdAt}`.localeCompare(
      `${b.examDate}|${b.startTime || '99:99'}|${b.createdAt}`,
    ),
  )
}

export function useExams(uid: string) {
  const [exams, setExams] = useState<Exam[]>([])
  const [loadedUid, setLoadedUid] = useState('')
  const [error, setError] = useState<string | null>(null)
  const loading = Boolean(uid) && loadedUid !== uid

  const examsCol = useMemo(
    () => (uid ? collection(fs, STUDY_USERS, uid, 'exams') : null),
    [uid],
  )

  useEffect(() => {
    if (!examsCol) return
    const unsub = onSnapshot(
      examsCol,
      (snap) => {
        setExams(
          sortExams(
            snap.docs.map((item) =>
              asExam(item.id, item.data() as Record<string, unknown>),
            ),
          ),
        )
        setError(null)
        setLoadedUid(uid)
      },
      (e) => {
        setError(firestoreMessage(e))
        setLoadedUid(uid)
      },
    )
    return unsub
  }, [examsCol, uid])

  const run = async (action: () => Promise<void>): Promise<boolean> => {
    setError(null)
    try {
      await action()
      return true
    } catch (e) {
      setError(firestoreMessage(e))
      return false
    }
  }

  const saveExam = async (input: ExamInput & { id?: string }) => {
    if (!examsCol) return false
    return run(async () => {
      const title = input.title.trim()
      if (!title) throw new Error('시험명을 입력해 주세요.')
      if (title.length > 100) throw new Error('시험명은 100자 이하여야 해요.')
      if (!input.subjectId) throw new Error('과목을 선택해 주세요.')
      if (!isDateKey(input.examDate)) {
        throw new Error('올바른 시험 날짜를 선택해 주세요.')
      }
      if (input.startTime && !isTime(input.startTime)) {
        throw new Error('올바른 시험 시간을 입력해 주세요.')
      }
      const now = Date.now()
      const payload = {
        title,
        subjectId: input.subjectId,
        examDate: input.examDate,
        startTime: input.startTime,
        memo: input.memo.trim(),
        updatedAt: now,
      }
      if (input.id) {
        await updateDoc(doc(examsCol, input.id), payload)
      } else {
        await setDoc(doc(examsCol), { ...payload, createdAt: now })
      }
    })
  }

  const deleteExam = async (id: string) => {
    if (!examsCol) return false
    return run(async () => {
      await deleteDoc(doc(examsCol, id))
    })
  }

  return { exams, loading, error, saveExam, deleteExam }
}

export type ExamsApi = ReturnType<typeof useExams>
