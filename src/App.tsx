import { useEffect, useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { Lobby } from './components/Lobby'
import { Login } from './components/Login'
import { Room } from './components/Room'
import { useAuth } from './hooks/useAuth'
import { ensureUserProfile } from './lib/stats'

export default function App() {
  const { user, loading, error, signIn, logout } = useAuth()
  const [code, setCode] = useState<string | null>(null)
  const [view, setView] = useState<'lobby' | 'dashboard'>('lobby')

  useEffect(() => {
    if (user) void ensureUserProfile(user)
  }, [user])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">불러오는 중…</div>
    )
  }

  if (!user) {
    return <Login onSignIn={signIn} error={error} />
  }

  return (
    <div className="min-h-screen">
      {code ? (
        <Room code={code} user={user} onLeave={() => setCode(null)} />
      ) : view === 'dashboard' ? (
        <Dashboard user={user} onBack={() => setView('lobby')} />
      ) : (
        <Lobby
          user={user}
          onEnter={(c) => {
            setView('lobby')
            setCode(c)
          }}
          onOpenDashboard={() => setView('dashboard')}
          onLogout={logout}
        />
      )}
    </div>
  )
}
