import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { AppShell, type View } from './components/AppShell'
import { Dashboard } from './components/Dashboard'
import { Lobby } from './components/Lobby'
import { Login } from './components/Login'
import { Plans } from './components/Plans'
import { Records } from './components/Records'
import { Room } from './components/Room'
import { Schedule } from './components/Schedule'
import { Stats } from './components/Stats'
import { Subjects } from './components/Subjects'
import { useAuth } from './hooks/useAuth'
import { usePlanner } from './hooks/usePlanner'
import { ensureUserProfile } from './lib/stats'

export default function App() {
  const { user, loading, error, signIn, logout } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[#72778d]">
        불러오는 중…
      </div>
    )
  }

  if (!user) {
    return <Login onSignIn={signIn} error={error} />
  }

  return <Workspace user={user} onLogout={logout} />
}

function Workspace({
  user,
  onLogout,
}: {
  user: User
  onLogout: () => void
}) {
  const planner = usePlanner(user)
  const [view, setView] = useState<View>('home')
  const [code, setCode] = useState<string | null>(null)

  useEffect(() => {
    void ensureUserProfile(user)
  }, [user])

  if (code) {
    return <Room code={code} user={user} onLeave={() => setCode(null)} />
  }

  const page = (() => {
    switch (view) {
      case 'rooms':
        return <Lobby user={user} onEnter={setCode} />
      case 'plans':
        return <Plans planner={planner} onNavigate={setView} />
      case 'subjects':
        return <Subjects planner={planner} />
      case 'records':
        return <Records planner={planner} onNavigate={setView} />
      case 'stats':
        return <Stats planner={planner} />
      case 'schedule':
        return <Schedule planner={planner} onNavigate={setView} />
      case 'home':
      default:
        return <Dashboard user={user} planner={planner} onNavigate={setView} />
    }
  })()

  return (
    <AppShell
      user={user}
      view={view}
      onNavigate={setView}
      onLogout={onLogout}
    >
      {planner.error && (
        <div className="mb-4 rounded-xl border border-[#f3ced3] bg-[#fff0f2] px-4 py-3 text-sm text-[#c84f61]">
          {planner.error}
        </div>
      )}
      {page}
    </AppShell>
  )
}
