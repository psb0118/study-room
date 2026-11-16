import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore'
import { fs } from '../firebase'
import { firestoreMessage } from '../lib/errors'
import { isDateKey, todayKey } from '../lib/planner'
import { STUDY_USERS } from '../lib/stats'
import type { StudyReflection } from '../types'

export const MAX_REFLECTION_LENGTH = 2000

function asReflection(id: string, data: Record<string, unknown>): StudyReflection | null {
  if (!isDateKey(id)) return null
  return {
    dateKey: id,
    content: String(data.content ?? '').slice(0, MAX_REFLECTION_LENGTH),
    createdAt: Number(data.createdAt) || 0,
    updatedAt: Number(data.updatedAt) || 0,
  }
}

function sortReflections(reflections: StudyReflection[]): StudyReflection[] {
  return [...reflections].sort((a, b) => b.dateKey.localeCompare(a.dateKey))
}

export function useReflections(uid: string) {
  const [reflections, setReflections] = useState<StudyReflection[]>([])
  const [loadedUid, setLoadedUid] = useState('')
  const [error, setError] = useState<string | null>(null)
  const loading = Boolean(uid) && loadedUid !== uid

  const reflectionsCol = useMemo(
    () => (uid ? collection(fs, STUDY_USERS, uid, 'reflections') : null),
    [uid],
  )

  useEffect(() => {
    if (!reflectionsCol) return
    const unsub = onSnapshot(
      reflectionsCol,
      (snap) => {
        const next = snap.docs
          .map((item) =>
            asReflection(item.id, item.data() as Record<string, unknown>),
          )
          .filter((item): item is StudyReflection => item !== null)
        setReflections(sortReflections(next))
        setError(null)
        setLoadedUid(uid)
      },
      (e) => {
        setError(firestoreMessage(e))
        setLoadedUid(uid)
      },
    )
    return unsub
  }, [reflectionsCol, uid])

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

  const saveReflection = async (dateKey: string, rawContent: string) => {
    if (!reflectionsCol) return false
    return run(async () => {
      if (!isDateKey(dateKey)) {
        throw new Error('올바른 날짜를 선택해 주세요.')
      }
      const content = rawContent.trim()
      if (content.length > MAX_REFLECTION_LENGTH) {
        throw new Error(`회고는 ${MAX_REFLECTION_LENGTH}자 이하여야 해요.`)
      }
      const ref = doc(reflectionsCol, dateKey)
      if (!content) {
        await deleteDoc(ref)
        return
      }
      const existing = reflections.find((item) => item.dateKey === dateKey)
      const now = Date.now()
      await setDoc(ref, {
        dateKey,
        content,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      })
    })
  }

  const deleteReflection = async (dateKey: string) => {
    if (!reflectionsCol) return false
    return run(async () => {
      if (!isDateKey(dateKey)) return
      await deleteDoc(doc(reflectionsCol, dateKey))
    })
  }

  return {
    reflections,
    loading,
    error,
    saveReflection,
    deleteReflection,
  }
}

export type ReflectionsApi = ReturnType<typeof useReflections>

/** 오늘 회고를 아직 쓰지 않았는지 확인할 때 사용한다. */
export function hasReflectionToday(
  reflections: StudyReflection[],
  today = todayKey(),
): boolean {
  return reflections.some(
    (reflection) =>
      reflection.dateKey === today && reflection.content.trim().length > 0,
  )
}
