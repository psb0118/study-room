import { useCallback, useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import {
  arrayRemove,
  arrayUnion,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { fs } from '../firebase'
import { firestoreMessage } from '../lib/errors'
import { isTime } from '../lib/planner'
import { normalizeWeeklyGoals } from '../lib/goals'
import {
  normalizePlanReminderOffset,
  PLAN_REMINDER_OFFSETS,
} from '../lib/planReminder'
import {
  createUniqueFamilyCode,
  defaultProfile,
  normalizeProfile,
  seedDefaultSubjects,
} from '../lib/profile'
import { STUDY_USERS } from '../lib/stats'
import type { Role, UserProfile } from '../types'

export interface ProfileApi {
  profile: UserProfile | null
  loading: boolean
  error: string | null
  actionError: string | null
  busy: boolean
  chooseRole: (role: Role) => Promise<boolean>
  updateNickname: (nickname: string) => Promise<boolean>
  savePreferences: (patch: {
    weeklyGoals?: Record<string, number>
    reminderEnabled?: boolean
    reminderTime?: string
    reminderTimezone?: string
    pushEnabled?: boolean
    planReminderEnabled?: boolean
    planReminderOffsetMinutes?: number
  }) => Promise<boolean>
  linkChild: (code: string) => Promise<boolean>
  unlinkChild: (childUid?: string) => Promise<boolean>
  regenerateFamilyCode: () => Promise<boolean>
  clearError: () => void
}

export function useProfile(user: User): ProfileApi {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const userRef = doc(fs, STUDY_USERS, user.uid)

  useEffect(() => {
    let active = true
    let unsub: (() => void) | undefined
    setLoading(true)
    setError(null)

    void (async () => {
      try {
        const snap = await getDoc(userRef)
        if (!snap.exists()) {
          await setDoc(doc(fs, STUDY_USERS, user.uid), defaultProfile(user))
        } else {
          const data = snap.data()
          const patch: Record<string, unknown> = {}
          if (!data.email && user.email) patch.email = user.email
          if (!data.name && user.displayName) patch.name = user.displayName
          if (!data.photo && user.photoURL) patch.photo = user.photoURL
          if (Object.keys(patch).length > 0) {
            await updateDoc(doc(fs, STUDY_USERS, user.uid), patch)
          }
        }
        if (!active) return
        unsub = onSnapshot(
          doc(fs, STUDY_USERS, user.uid),
          (next) => {
            if (!active) return
            if (next.exists()) {
              setProfile(normalizeProfile(next.id, next.data()))
            }
            setLoading(false)
          },
          (e) => {
            if (!active) return
            setError(firestoreMessage(e))
            setLoading(false)
          },
        )
      } catch (e) {
        if (!active) return
        setError(firestoreMessage(e))
        setLoading(false)
      }
    })()

    return () => {
      active = false
      unsub?.()
    }
    // userRef is derived from user.uid; metadata is only used to seed a new profile.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.uid])

  const run = useCallback(async (action: () => Promise<void>) => {
    setBusy(true)
    setActionError(null)
    try {
      await action()
      return true
    } catch (e) {
      setActionError(firestoreMessage(e))
      return false
    } finally {
      setBusy(false)
    }
  }, [])

  const chooseRole = async (role: Role): Promise<boolean> => {
    if (!profile) {
      setActionError('프로필을 불러오는 중이에요. 잠시 후 다시 시도해 주세요.')
      return false
    }
    if (profile.role) {
      setActionError('이미 역할이 선택되어 있어요.')
      return false
    }
    if (role !== 'student' && role !== 'parent') {
      setActionError('지원하지 않는 역할이에요.')
      return false
    }
    return run(async () => {
      const now = Date.now()
      if (role === 'parent') {
        await updateDoc(userRef, { role: 'parent', updatedAt: now })
        return
      }
      const code = await createUniqueFamilyCode(user.uid)
      await updateDoc(userRef, {
        role: 'student',
        familyCode: code,
        updatedAt: now,
      })
      try {
        await seedDefaultSubjects(user.uid)
      } catch (e) {
        console.warn('[profile] 기본 과목 생성 실패:', e)
      }
    })
  }

  const updateNickname = async (rawNickname: string): Promise<boolean> => {
    const nickname = rawNickname.trim()
    if (nickname.length < 2 || nickname.length > 20) {
      setActionError('닉네임은 2~20자로 입력해 주세요.')
      return false
    }
    return run(async () => {
      await updateDoc(userRef, { nickname, updatedAt: Date.now() })
    })
  }

  const savePreferences = async (patch: {
    weeklyGoals?: Record<string, number>
    reminderEnabled?: boolean
    reminderTime?: string
    reminderTimezone?: string
    pushEnabled?: boolean
    planReminderEnabled?: boolean
    planReminderOffsetMinutes?: number
  }): Promise<boolean> => {
    if (!profile) {
      setActionError('프로필을 불러오는 중이에요. 잠시 후 다시 시도해 주세요.')
      return false
    }
    if (patch.reminderTime && !isTime(patch.reminderTime)) {
      setActionError('올바른 알림 시간을 선택해 주세요.')
      return false
    }
    if (patch.reminderTimezone) {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: patch.reminderTimezone })
      } catch {
        setActionError('올바른 시간대를 선택해 주세요.')
        return false
      }
    }
    if (
      typeof patch.planReminderOffsetMinutes === 'number' &&
      !PLAN_REMINDER_OFFSETS.includes(
        patch.planReminderOffsetMinutes as (typeof PLAN_REMINDER_OFFSETS)[number],
      )
    ) {
      setActionError('올바른 알림 시점을 선택해 주세요.')
      return false
    }
    return run(async () => {
      const payload: Record<string, unknown> = { updatedAt: Date.now() }
      if (patch.weeklyGoals) {
        payload.weeklyGoals = normalizeWeeklyGoals(patch.weeklyGoals)
      }
      if (typeof patch.reminderEnabled === 'boolean') {
        payload.reminderEnabled = patch.reminderEnabled
      }
      if (patch.reminderTime) payload.reminderTime = patch.reminderTime
      if (patch.reminderTimezone) {
        payload.reminderTimezone = patch.reminderTimezone
      }
      if (typeof patch.pushEnabled === 'boolean') {
        payload.pushEnabled = patch.pushEnabled
      }
      if (typeof patch.planReminderEnabled === 'boolean') {
        payload.planReminderEnabled = patch.planReminderEnabled
      }
      if (typeof patch.planReminderOffsetMinutes === 'number') {
        payload.planReminderOffsetMinutes = normalizePlanReminderOffset(
          patch.planReminderOffsetMinutes,
        )
      }
      await updateDoc(userRef, payload)
    })
  }

  const linkChild = async (rawCode: string): Promise<boolean> => {
    if (!profile) {
      setActionError('프로필을 불러오는 중이에요. 잠시 후 다시 시도해 주세요.')
      return false
    }
    if (profile.role !== 'parent') {
      setActionError('부모 계정에서만 자녀를 연결할 수 있어요.')
      return false
    }
    const code = rawCode.trim().toUpperCase()
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      setActionError('6자리 연결 코드를 입력해 주세요.')
      return false
    }
    return run(async () => {
      const codeSnap = await getDoc(doc(fs, 'familyCodes', code))
      if (!codeSnap.exists()) {
        throw new Error('연결 코드를 찾을 수 없어요. 코드를 다시 확인해 주세요.')
      }
      const studentUid = String(codeSnap.data().studentUid ?? '')
      if (!studentUid) throw new Error('연결 코드가 올바르지 않아요.')
      if (studentUid === user.uid) {
        throw new Error('본인 계정은 자녀로 연결할 수 없어요.')
      }
      if (
        profile.childUids.includes(studentUid) ||
        profile.childUid === studentUid
      ) {
        throw new Error('이미 연결된 자녀예요.')
      }
      await setDoc(doc(fs, 'families', studentUid, 'parents', user.uid), {
        uid: user.uid,
        name: profile.name,
        email: user.email ?? profile.email,
        code,
        linkedAt: Date.now(),
      })
      const childSnap = await getDoc(
        doc(fs, STUDY_USERS, studentUid),
      ).catch(() => null)
      const childData: Record<string, unknown> = childSnap?.exists()
        ? (childSnap.data() as Record<string, unknown>)
        : {}
      const childName = String(childData.name ?? childData.nickname ?? '자녀')
      await updateDoc(userRef, {
        childUid: studentUid,
        childUids: arrayUnion(studentUid),
        [`childNames.${studentUid}`]: childName,
        updatedAt: Date.now(),
      })
    })
  }

  const unlinkChild = async (childUid = ''): Promise<boolean> => {
    if (!profile) return false
    const target = childUid || profile.childUid
    if (!target) return false
    return run(async () => {
      await deleteDoc(doc(fs, 'families', target, 'parents', user.uid))
      const remaining = profile.childUids.filter((uid) => uid !== target)
      await updateDoc(userRef, {
        childUid: remaining[0] ?? '',
        childUids: arrayRemove(target),
        [`childNames.${target}`]: deleteField(),
        updatedAt: Date.now(),
      })
    })
  }

  const regenerateFamilyCode = async (): Promise<boolean> => {
    if (!profile || profile.role !== 'student') return false
    return run(async () => {
      const oldCode = profile.familyCode
      const code = await createUniqueFamilyCode(user.uid)
      await updateDoc(userRef, {
        familyCode: code,
        updatedAt: Date.now(),
      })
      if (oldCode && oldCode !== code) {
        try {
          await deleteDoc(doc(fs, 'familyCodes', oldCode))
        } catch (e) {
          console.warn('[profile] 이전 연결 코드 삭제 실패:', e)
        }
      }
    })
  }

  return {
    profile,
    loading,
    error,
    actionError,
    busy,
    chooseRole,
    updateNickname,
    savePreferences,
    linkChild,
    unlinkChild,
    regenerateFamilyCode,
    clearError: () => setActionError(null),
  }
}

export function useChildProfile(uid: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loadedUid, setLoadedUid] = useState('')
  const [error, setError] = useState<string | null>(null)
  const loading = loadedUid !== uid

  useEffect(() => {
    if (!uid) return
    const unsub = onSnapshot(
      doc(fs, STUDY_USERS, uid),
      (snap) => {
        setProfile(
          snap.exists() ? normalizeProfile(snap.id, snap.data()) : null,
        )
        setLoadedUid(uid)
      },
      (e) => {
        setError(firestoreMessage(e))
        setLoadedUid(uid)
      },
    )
    return unsub
  }, [uid])

  return { profile, loading, error }
}
