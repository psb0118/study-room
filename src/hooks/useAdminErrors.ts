import { useEffect, useState } from 'react'
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { fs } from '../firebase'
import { firestoreMessage } from '../lib/errors'

export interface AppErrorLog {
  id: string
  message: string
  stack: string
  context: string
  url: string
  userAgent: string
  uid: string
  createdAt: number
}

export function useAdminErrors() {
  const [errors, setErrors] = useState<AppErrorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onSnapshot(
      query(
        collection(fs, 'appErrors'),
        orderBy('createdAt', 'desc'),
        limit(30),
      ),
      (snap) => {
        setErrors(
          snap.docs.map((item) => {
            const data = item.data() as Record<string, unknown>
            return {
              id: item.id,
              message: String(data.message ?? ''),
              stack: String(data.stack ?? ''),
              context: String(data.context ?? ''),
              url: String(data.url ?? ''),
              userAgent: String(data.userAgent ?? ''),
              uid: String(data.uid ?? ''),
              createdAt: Number(data.createdAt) || 0,
            }
          }),
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

  return { errors, loading, error }
}
