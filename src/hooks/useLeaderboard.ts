import { useEffect, useState } from 'react'
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { fs } from '../firebase'
import { firestoreMessage } from '../lib/errors'
import type { LeaderboardEntry } from '../types'

function asEntry(id: string, data: Record<string, unknown>): LeaderboardEntry {
  return {
    uid: String(data.uid ?? id),
    name: String(data.name ?? '학생'),
    photo: String(data.photo ?? ''),
    points: Math.max(0, Number(data.points) || 0),
    level: Math.max(1, Number(data.level) || 1),
    updatedAt: Number(data.updatedAt) || 0,
  }
}

export function useLeaderboard(highlightUid: string) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [mine, setMine] = useState<LeaderboardEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(
      collection(fs, 'leaderboard'),
      orderBy('points', 'desc'),
      limit(20),
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        setEntries(
          snap.docs.map((item) =>
            asEntry(item.id, item.data() as Record<string, unknown>),
          ),
        )
        setLoading(false)
      },
      (e) => {
        setError(firestoreMessage(e))
        setLoading(false)
      },
    )
    return unsub
  }, [])

  useEffect(() => {
    if (!highlightUid) return
    const unsub = onSnapshot(
      doc(fs, 'leaderboard', highlightUid),
      (snap) => {
        setMine(
          snap.exists()
            ? asEntry(snap.id, snap.data() as Record<string, unknown>)
            : null,
        )
      },
      (e) => {
        console.warn('[leaderboard] 내 기록을 불러오지 못했습니다:', e)
      },
    )
    return unsub
  }, [highlightUid])

  return { entries, mine, loading, error }
}
