import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { auth, fs } from '../firebase'
import { firestoreMessage } from '../lib/errors'
import { normalizeProfile } from '../lib/profile'
import { STUDY_USERS } from '../lib/stats'
import type { AccountStatus, UserProfile } from '../types'

export function useAdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyUid, setBusyUid] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(fs, STUDY_USERS),
      (snap) => {
        setUsers(
          snap.docs
            .map((item) =>
              normalizeProfile(item.id, item.data() as Record<string, unknown>),
            )
            .sort((a, b) => b.createdAt - a.createdAt),
        )
        setLoading(false)
        setError(null)
      },
      (e) => {
        setError(firestoreMessage(e))
        setLoading(false)
      },
    )
    return unsub
  }, [])

  const setAccountStatus = async (
    uid: string,
    accountStatus: AccountStatus,
  ): Promise<boolean> => {
    if (!uid) return false
    if (auth.currentUser?.uid === uid) {
      setActionError('자기 자신의 계정 상태는 변경할 수 없어요.')
      return false
    }
    setBusyUid(uid)
    setActionError(null)
    try {
      await updateDoc(doc(fs, STUDY_USERS, uid), {
        accountStatus,
        statusUpdatedAt: Date.now(),
        statusUpdatedBy: auth.currentUser?.uid ?? '',
      })
      return true
    } catch (e) {
      setActionError(firestoreMessage(e))
      return false
    } finally {
      setBusyUid('')
    }
  }

  return {
    users,
    loading,
    error,
    busyUid,
    actionError,
    setAccountStatus,
  }
}
