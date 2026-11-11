import { useState } from 'react'
import type { User } from 'firebase/auth'
import { AppShell, type View } from './components/AppShell'
import { Dashboard } from './components/Dashboard'
import { Family } from './components/Family'
import { Leaderboard } from './components/Leaderboard'
import { Lobby } from './components/Lobby'
import { Login } from './components/Login'
import { ParentHome, ParentWelcome } from './components/ParentHome'
import { Plans } from './components/Plans'
import { Records } from './components/Records'
import { RoleSetup } from './components/RoleSetup'
import { Room } from './components/Room'
import { Schedule } from './components/Schedule'
import { Stats } from './components/Stats'
import { Subjects } from './components/Subjects'
import { useAuth } from './hooks/useAuth'
import { usePlanner } from './hooks/usePlanner'
import { useChildProfile, useProfile, type ProfileApi } from './hooks/useProfile'
import { usePointsSync } from './hooks/usePointsSync'
import type { UserProfile } from './types'

export default function App() {
  const auth = useAuth()

  if (auth.loading) {
    return <FullScreenLoading />
  }

  if (!auth.user) {
    return (
      <Login
        onGoogle={auth.signIn}
        onEmailSignIn={auth.signInEmail}
        onEmailSignUp={auth.signUpEmail}
        onResetPassword={auth.resetPassword}
        error={auth.error}
        clearError={auth.clearError}
      />
    )
  }

  return <Workspace user={auth.user} onLogout={auth.logout} />
}

function Workspace({
  user,
  onLogout,
}: {
  user: User
  onLogout: () => void
}) {
  const profileApi = useProfile(user)

  if (profileApi.loading) {
    return <FullScreenLoading label="프로필을 불러오는 중…" />
  }

  if (profileApi.error && !profileApi.profile) {
    return (
      <ProfileError
        message={profileApi.error}
        onLogout={onLogout}
      />
    )
  }

  const profile = profileApi.profile
  if (!profile) {
    return <FullScreenLoading label="프로필을 준비하는 중…" />
  }

  if (!profile.role) {
    return (
      <RoleSetup
        profile={profile}
        busy={profileApi.busy}
        error={profileApi.actionError}
        onChoose={profileApi.chooseRole}
        onLogout={onLogout}
      />
    )
  }

  if (profile.role === 'parent') {
    return (
      <ParentWorkspace
        profile={profile}
        profileApi={profileApi}
        onLogout={onLogout}
      />
    )
  }

  return (
    <StudentWorkspace
      user={user}
      profile={profile}
      profileApi={profileApi}
      onLogout={onLogout}
    />
  )
}

function StudentWorkspace({
  user,
  profile,
  profileApi,
  onLogout,
}: {
  user: User
  profile: UserProfile
  profileApi: ProfileApi
  onLogout: () => void
}) {
  const planner = usePlanner(user.uid)
  const [view, setView] = useState<View>('home')
  const [code, setCode] = useState<string | null>(null)
  usePointsSync(user.uid, profile, planner.plans, !planner.loading)

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
      case 'leaderboard':
        return <Leaderboard highlightUid={user.uid} viewerRole="student" />
      case 'family':
        return <Family profile={profile} profileApi={profileApi} />
      case 'home':
      default:
        return (
          <Dashboard
            name={profile.name}
            photo={profile.photo || undefined}
            planner={planner}
            onNavigate={setView}
          />
        )
    }
  })()

  return (
    <AppShell
      name={profile.name}
      photo={profile.photo || undefined}
      role="student"
      view={view}
      onNavigate={setView}
      onLogout={onLogout}
    >
      <PlannerError message={planner.error} />
      {page}
    </AppShell>
  )
}

function ParentWorkspace({
  profile,
  profileApi,
  onLogout,
}: {
  profile: UserProfile
  profileApi: ProfileApi
  onLogout: () => void
}) {
  const [view, setView] = useState<View>('home')

  if (!profile.childUid) {
    const page =
      view === 'family' ? (
        <Family profile={profile} profileApi={profileApi} />
      ) : (
        <ParentWelcome parentName={profile.name} onNavigate={setView} />
      )
    return (
      <AppShell
        name={profile.name}
        photo={profile.photo || undefined}
        role="parent"
        view={view}
        onNavigate={setView}
        onLogout={onLogout}
      >
        {page}
      </AppShell>
    )
  }

  return (
    <LinkedParentWorkspace
      profile={profile}
      profileApi={profileApi}
      childUid={profile.childUid}
      onLogout={onLogout}
    />
  )
}

function LinkedParentWorkspace({
  profile,
  profileApi,
  childUid,
  onLogout,
}: {
  profile: UserProfile
  profileApi: ProfileApi
  childUid: string
  onLogout: () => void
}) {
  const planner = usePlanner(childUid)
  const child = useChildProfile(childUid)
  const [view, setView] = useState<View>('home')
  usePointsSync(
    childUid,
    child.profile,
    planner.plans,
    !planner.loading && !child.loading,
  )

  const page = (() => {
    switch (view) {
      case 'plans':
        return <Plans planner={planner} onNavigate={setView} role="parent" />
      case 'schedule':
        return <Schedule planner={planner} onNavigate={setView} />
      case 'stats':
        return <Stats planner={planner} />
      case 'leaderboard':
        return <Leaderboard highlightUid={childUid} viewerRole="parent" />
      case 'family':
        return (
          <Family
            profile={profile}
            profileApi={profileApi}
            childName={child.profile?.name}
          />
        )
      case 'home':
      default:
        return (
          <ParentHome
            parentName={profile.name}
            child={child.profile}
            planner={planner}
            loading={planner.loading || child.loading}
            onNavigate={setView}
          />
        )
    }
  })()

  return (
    <AppShell
      name={profile.name}
      photo={profile.photo || undefined}
      role="parent"
      view={view}
      onNavigate={setView}
      onLogout={onLogout}
    >
      <PlannerError message={planner.error ?? child.error} />
      {page}
    </AppShell>
  )
}

function PlannerError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="mb-4 rounded-xl border border-[#f6d6dd] bg-[#ffeff3] px-4 py-3 text-sm text-[#d96a7c]">
      {message}
    </div>
  )
}

function FullScreenLoading({ label = '불러오는 중…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf8ff] px-4 text-sm text-[#8b88a3]">
      {label}
    </div>
  )
}

function ProfileError({
  message,
  onLogout,
}: {
  message: string
  onLogout: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf8ff] px-4">
      <div className="surface w-full max-w-md p-7 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#ffeff3] text-xl">
          !
        </div>
        <h1 className="mt-4 text-lg font-extrabold text-[#3d3a55]">
          계정 정보를 불러오지 못했어요
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#8b88a3]">{message}</p>
        <p className="mt-3 rounded-lg bg-[#f7f4ff] px-3 py-2 text-xs leading-relaxed text-[#706d8a]">
          Firestore 보안 규칙이 최신인지 확인한 뒤 다시 로그인해 주세요.
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="btn btn-primary mt-5 w-full"
        >
          로그아웃
        </button>
      </div>
    </div>
  )
}
