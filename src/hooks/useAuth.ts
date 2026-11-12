import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import { authMessage } from '../lib/errors'
import { removePushToken } from '../lib/push'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
    return unsub
  }, [])

  const signIn = async () => {
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      setError(authMessage(e))
    }
  }

  const signInEmail = async (
    email: string,
    password: string,
  ): Promise<boolean> => {
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      return true
    } catch (e) {
      setError(authMessage(e))
      return false
    }
  }

  const signUpEmail = async (
    name: string,
    email: string,
    password: string,
  ): Promise<boolean> => {
    setError(null)
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('이름을 입력해 주세요.')
      return false
    }
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      )
      await updateProfile(credential.user, { displayName: trimmedName })
      setUser(auth.currentUser)
      return true
    } catch (e) {
      setError(authMessage(e))
      return false
    }
  }

  const resetPassword = async (email: string): Promise<boolean> => {
    setError(null)
    if (!email.trim()) {
      setError('비밀번호를 재설정할 이메일을 먼저 입력해 주세요.')
      return false
    }
    try {
      await sendPasswordResetEmail(auth, email.trim())
      return true
    } catch (e) {
      setError(authMessage(e))
      return false
    }
  }

  const logout = async () => {
    const uid = auth.currentUser?.uid
    if (uid) await removePushToken(uid)
    await signOut(auth)
  }

  return {
    user,
    loading,
    error,
    signIn,
    signInEmail,
    signUpEmail,
    resetPassword,
    logout,
    clearError: () => setError(null),
  }
}
