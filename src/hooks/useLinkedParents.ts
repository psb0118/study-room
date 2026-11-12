import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { fs } from '../firebase'
import { firestoreMessage } from '../lib/errors'

export interface LinkedParent {
  uid: string
  name: string
  email: string
  linkedAt: number
}

interface LinkedParentsSnapshot {
  uid: string
  parents: LinkedParent[]
  error: string | null
}

function asLinkedParent(
  id: string,
  data: Record<string, unknown>,
): LinkedParent {
  const name = String(data.name ?? '').trim()
  return {
    uid: String(data.uid ?? id),
    name: name || '부모님',
    email: String(data.email ?? '').trim(),
    linkedAt: Number(data.linkedAt) || 0,
  }
}

/**
 * 학생 계정에 연결된 부모 문서를 실시간으로 읽는다.
 * 부모가 연결/해제되면 학생 화면도 새로고침 없이 갱신된다.
 */
export function useLinkedParents(uid: string, enabled: boolean) {
  const [snapshot, setSnapshot] = useState<LinkedParentsSnapshot | null>(null)

  useEffect(() => {
    if (!uid || !enabled) return

    let active = true
    const unsub = onSnapshot(
      collection(fs, 'families', uid, 'parents'),
      (snap) => {
        if (!active) return
        setSnapshot({
          uid,
          parents: snap.docs
            .map((item) =>
              asLinkedParent(item.id, item.data() as Record<string, unknown>),
            )
            .sort((a, b) => a.linkedAt - b.linkedAt),
          error: null,
        })
      },
      (e) => {
        if (!active) return
        setSnapshot({
          uid,
          parents: [],
          error: firestoreMessage(e),
        })
      },
    )

    return () => {
      active = false
      unsub()
    }
  }, [enabled, uid])

  const current = snapshot?.uid === uid ? snapshot : null
  return {
    parents: enabled && current ? current.parents : [],
    loading: Boolean(enabled && uid && !current),
    error: enabled ? current?.error ?? null : null,
  }
}
