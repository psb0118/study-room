import { useEffect, useMemo, useState } from 'react'
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
import { startOfWeek } from '../lib/planner'
import type { LeaderboardEntry } from '../types'

export type LeaderboardPeriod = 'week' | 'all'

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

export function useLeaderboard(
  highlightUid: string,
  period: LeaderboardPeriod = 'all',
) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [mine, setMine] = useState<LeaderboardEntry | null>(null)
  const [entriesBoard, setEntriesBoard] = useState('')
  const [mineKey, setMineKey] = useState('')
  const [loadedBoard, setLoadedBoard] = useState('')
  const [error, setError] = useState<string | null>(null)
  const weekKey = startOfWeek()
  const boardKey = period === 'week' ? `week:${weekKey}` : 'all'
  const mineSlot = `${boardKey}:${highlightUid}`
  const loading = loadedBoard !== boardKey
  const boardRef = useMemo(
    () =>
      period === 'week'
        ? collection(fs, 'weeklyLeaderboards', weekKey, 'entries')
        : collection(fs, 'leaderboard'),
    [period, weekKey],
  )
  const mineRef = useMemo(
    () =>
      period === 'week'
        ? doc(fs, 'weeklyLeaderboards', weekKey, 'entries', highlightUid)
        : doc(fs, 'leaderboard', highlightUid),
    [highlightUid, period, weekKey],
  )

  useEffect(() => {
    const q = query(boardRef, orderBy('points', 'desc'), limit(20))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setEntries(
          snap.docs.map((item) =>
            asEntry(item.id, item.data() as Record<string, unknown>),
          ),
        )
        setEntriesBoard(boardKey)
        setLoadedBoard(boardKey)
        setError(null)
      },
      (e) => {
        setError(firestoreMessage(e))
        setLoadedBoard(boardKey)
      },
    )
    return unsub
  }, [boardRef, boardKey])

  useEffect(() => {
    if (!highlightUid) return
    const unsub = onSnapshot(
      mineRef,
      (snap) => {
        setMine(
          snap.exists()
            ? asEntry(snap.id, snap.data() as Record<string, unknown>)
            : null,
        )
        setMineKey(mineSlot)
      },
      (e) => {
        console.warn('[leaderboard] 내 기록을 불러오지 못했습니다:', e)
      },
    )
    return unsub
  }, [highlightUid, mineRef, mineSlot])

  return {
    entries: entriesBoard === boardKey ? entries : [],
    mine: mineKey === mineSlot ? mine : null,
    loading,
    error,
  }
}
