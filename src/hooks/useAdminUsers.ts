import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { fs } from '../firebase'
import { firestoreMessage } from '../lib/errors'
import { normalizeProfile } from '../lib/profile'
import { STUDY_USERS } from '../lib/stats'
import type { UserProfile } from '../types'

export function useAdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return { users, loading, error }
}
