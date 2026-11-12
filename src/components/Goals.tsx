import { useEffect, useState } from 'react'
import type { PlannerApi } from '../hooks/usePlanner'
import type { ProfileApi } from '../hooks/useProfile'
import {
  MAX_WEEKLY_GOAL_MINUTES,
  weeklyGoalRows,
} from '../lib/goals'
import { formatDuration } from '../lib/planner'
import {
  PLAN_REMINDER_OFFSETS,
  PLAN_REMINDER_OFFSET_LABELS,
} from '../lib/planReminder'
import {
  isPushSupported,
  registerPushToken,
  removePushToken,
} from '../lib/push'
import type { PlanReminderOffset, UserProfile } from '../types'
import {
  PageHeader,
  ghostButton,
  inputClass,
  panelClass,
  primaryButton,
} from './ui'

export function Goals({
  profile,
  profileApi,
  planner,
}: {
  profile: UserProfile
  profileApi: ProfileApi
  planner: PlannerApi
}) {
  const activeSubjects = planner.subjects.filter((subject) => !subject.archived)
  const [form, setForm] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const rows = weeklyGoalRows(
    planner.subjects,
    profile.weeklyGoals,
    planner.records,
  )

  const valueFor = (subjectId: string) =>
    form[subjectId] ?? String(profile.weeklyGoals[subjectId] ?? '')

  const save = async () => {
    setError(null)
    setNotice(null)
    const goals: Record<string, number> = {}
    for (const subject of activeSubjects) {
      const raw = valueFor(subject.id).trim()
      if (!raw) continue
      const minutes = Number(raw)
      if (
        !Number.isFinite(minutes) ||
        minutes < 0 ||
        minutes > MAX_WEEKLY_GOAL_MINUTES
      ) {
        setError(`${subject.name} 목표를 0~${MAX_WEEKLY_GOAL_MINUTES}분으로 입력해 주세요.`)
        return
      }
      if (minutes > 0) goals[subject.id] = Math.round(minutes)
    }
    setBusy(true)
    const ok = await profileApi.savePreferences({ weeklyGoals: goals })
    setBusy(false)
    if (ok) {
      setForm({})
      setNotice('주간 목표를 저장했어요.')
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="WEEKLY GOALS"
        title="주간 목표"
        description="과목별로 이번 주에 공부할 시간을 정하고, 실제 기록과 비교해 보세요."
        action={
          <button
            type="button"
            onClick={() => void save()}
            disabled={busy || activeSubjects.length === 0}
            className={primaryButton}
          >
            {busy ? '저장 중…' : '목표 저장'}
          </button>
        }
      />

      <section className={`${panelClass} p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-[#3d3a55]">
              이번 주 과목별 목표
            </h2>
            <p className="mt-1 text-sm text-[#8b88a3]">
              월요일부터 일요일까지의 기록을 기준으로 달성률을 계산해요.
            </p>
          </div>
          <span className="rounded-full bg-[#f1eeff] px-2.5 py-1 text-[11px] font-extrabold text-[#6a63c9]">
            {rows.length}개 목표
          </span>
        </div>

        {activeSubjects.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-[#d6d1ff] bg-[#faf9ff] px-4 py-5 text-sm text-[#8b88a3]">
            먼저 과목을 추가하면 주간 목표를 설정할 수 있어요.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {activeSubjects.map((subject) => (
              <div
                key={subject.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-[#f1eef9] bg-[#faf9ff] px-4 py-3"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: subject.color }}
                />
                <span className="min-w-0 flex-1 text-sm font-extrabold text-[#3d3a55]">
                  {subject.name}
                </span>
                <label className="flex items-center gap-2 text-xs text-[#8b88a3]">
                  주간 목표
                  <input
                    type="number"
                    min={0}
                    max={MAX_WEEKLY_GOAL_MINUTES}
                    step={10}
                    value={valueFor(subject.id)}
                    onChange={(event) => {
                      setForm((prev) => ({
                        ...prev,
                        [subject.id]: event.target.value,
                      }))
                      setNotice(null)
                      setError(null)
                    }}
                    placeholder="0"
                    className={`${inputClass} w-28`}
                  />
                  분
                </label>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-[#ffeff3] px-3.5 py-2.5 text-sm text-[#d96a7c]">
            {error}
          </p>
        )}
        {notice && (
          <p className="mt-4 rounded-xl bg-[#eafaf1] px-3.5 py-2.5 text-sm text-[#3d9b6a]">
            {notice}
          </p>
        )}
        {profileApi.actionError && (
          <p className="mt-4 rounded-xl bg-[#ffeff3] px-3.5 py-2.5 text-sm text-[#d96a7c]">
            {profileApi.actionError}
          </p>
        )}
      </section>

      {rows.length > 0 && (
        <section className={`${panelClass} mt-4 p-6`}>
          <h2 className="text-base font-extrabold text-[#3d3a55]">
            이번 주 달성률
          </h2>
          <div className="mt-4 space-y-4">
            {rows.map((row) => (
              <div key={row.subjectId}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-2 font-bold text-[#5f5c78]">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                    {row.name}
                  </span>
                  <span className="text-[#8b88a3]">
                    {formatDuration(row.studiedMs)} / {row.targetMinutes}분 ·{' '}
                    <strong className="text-[#6f68e8]">{row.progress}%</strong>
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#f1eef9]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${row.progress}%`,
                      backgroundColor: row.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <ReminderSettings profile={profile} profileApi={profileApi} />
      <PlanReminderSettings profile={profile} profileApi={profileApi} />
    </div>
  )
}

function ReminderSettings({
  profile,
  profileApi,
}: {
  profile: UserProfile
  profileApi: ProfileApi
}) {
  const [supported, setSupported] = useState(false)
  const [enabled, setEnabled] = useState(profile.reminderEnabled)
  const [pushEnabled, setPushEnabled] = useState(profile.pushEnabled)
  const [time, setTime] = useState(profile.reminderTime)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const permission =
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported'
  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul'

  useEffect(() => {
    void isPushSupported().then(setSupported)
  }, [])

  const enable = async () => {
    setError(null)
    setNotice(null)
    if (!supported) {
      setError('이 브라우저에서는 백그라운드 알림을 지원하지 않아요.')
      return
    }
    const result = await Notification.requestPermission()
    if (result !== 'granted') {
      setError('브라우저 알림 권한이 필요해요. 주소창의 알림 설정을 확인해 주세요.')
      return
    }
    setBusy(true)
    const registered = await registerPushToken(profile.uid)
    if (!registered.ok) {
      setBusy(false)
      setError(registered.error ?? '기기 등록에 실패했어요.')
      return
    }
    const ok = await profileApi.savePreferences({
      reminderEnabled: true,
      reminderTime: time,
      reminderTimezone: timezone,
      pushEnabled: true,
    })
    setBusy(false)
    if (!ok) {
      await removePushToken(profile.uid)
      return
    }
    setEnabled(true)
    setPushEnabled(true)
    setNotice('백그라운드 알림을 켰어요. 앱을 닫아도 알림을 받을 수 있어요.')
  }

  const disable = async () => {
    setError(null)
    setNotice(null)
    setBusy(true)
    await removePushToken(profile.uid)
    const ok = await profileApi.savePreferences({
      reminderEnabled: false,
      pushEnabled: false,
      planReminderEnabled: false,
    })
    setBusy(false)
    if (ok) {
      setEnabled(false)
      setPushEnabled(false)
      setNotice('학습 알림을 껐어요.')
    }
  }

  const updateTime = async () => {
    setError(null)
    setNotice(null)
    setBusy(true)
    const ok = await profileApi.savePreferences({
      reminderEnabled: true,
      reminderTime: time,
      reminderTimezone: timezone,
      pushEnabled: true,
    })
    setBusy(false)
    if (ok) setNotice('알림 시간을 변경했어요.')
  }

  const updateLocalTime = async () => {
    setError(null)
    setNotice(null)
    setBusy(true)
    const ok = await profileApi.savePreferences({
      reminderEnabled: true,
      reminderTime: time,
      reminderTimezone: timezone,
    })
    setBusy(false)
    if (ok) setNotice('알림 시간을 변경했어요.')
  }

  return (
    <section className={`${panelClass} mt-4 p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-[#3d3a55]">
            학습 알림
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[#8b88a3]">
            앱을 닫아도 정한 시간에 공부 시작을 알려드려요. 브라우저 알림
            권한을 허용하고 기기를 등록해야 합니다.
          </p>
        </div>
        <span className="rounded-full bg-[#faf9ff] px-2.5 py-1 text-[11px] font-extrabold text-[#8b88a3]">
          {pushEnabled
            ? '백그라운드 알림 켜짐'
            : enabled
              ? '로컬 알림만 켜짐'
              : '알림 꺼짐'}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-xs font-bold text-[#5f5c78]">
          알림 시간
          <input
            type="time"
            value={time}
            onChange={(event) => {
              setTime(event.target.value)
              setNotice(null)
              setError(null)
            }}
            className={`${inputClass} mt-1 block`}
          />
        </label>
        {pushEnabled ? (
          <>
            <button
              type="button"
              onClick={() => void disable()}
              disabled={busy}
              className={ghostButton}
            >
              {busy ? '저장 중…' : '알림 끄기'}
            </button>
            <button
              type="button"
              onClick={() => void updateTime()}
              disabled={busy}
              className={ghostButton}
            >
              시간 변경
            </button>
          </>
        ) : (
          <>
            {enabled && (
              <button
                type="button"
                onClick={() => void disable()}
                disabled={busy}
                className={ghostButton}
              >
                {busy ? '저장 중…' : '알림 끄기'}
              </button>
            )}
            <button
              type="button"
              onClick={() => void enable()}
              disabled={busy || !supported}
              className={primaryButton}
            >
              {busy ? '등록 중…' : '백그라운드 알림 켜기'}
            </button>
            {enabled && (
              <button
                type="button"
                onClick={() => void updateLocalTime()}
                disabled={busy}
                className={ghostButton}
              >
                시간 변경
              </button>
            )}
          </>
        )}
      </div>

      {!supported && (
        <p className="mt-3 text-xs leading-relaxed text-[#b26a3f]">
          이 브라우저는 백그라운드 알림을 지원하지 않아요. Chrome·Edge 또는
          홈 화면에 설치한 PWA에서 사용해 주세요.
        </p>
      )}
      {enabled && !pushEnabled && (
        <p className="mt-3 text-xs leading-relaxed text-[#8b88a3]">
          현재는 앱을 열어둔 동안만 알림을 받는 로컬 알림 상태예요. 위 버튼을
          누르면 앱을 닫아도 받을 수 있는 백그라운드 알림으로 전환됩니다.
        </p>
      )}
      {permission === 'denied' && (
        <p className="mt-3 text-xs leading-relaxed text-[#d96a7c]">
          브라우저에서 이 사이트의 알림이 차단되어 있어요. 주소창의 사이트
          설정에서 알림을 허용해 주세요.
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-xl bg-[#ffeff3] px-3.5 py-2.5 text-sm text-[#d96a7c]">
          {error}
        </p>
      )}
      {notice && (
        <p className="mt-3 rounded-xl bg-[#eafaf1] px-3.5 py-2.5 text-sm text-[#3d9b6a]">
          {notice}
        </p>
      )}
      {profileApi.actionError && (
        <p className="mt-3 rounded-xl bg-[#ffeff3] px-3.5 py-2.5 text-sm text-[#d96a7c]">
          {profileApi.actionError}
        </p>
      )}
    </section>
  )
}

function PlanReminderSettings({
  profile,
  profileApi,
}: {
  profile: UserProfile
  profileApi: ProfileApi
}) {
  const [supported, setSupported] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const enabled = profile.planReminderEnabled
  const offset = profile.planReminderOffsetMinutes
  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul'

  useEffect(() => {
    void isPushSupported().then(setSupported)
  }, [])

  const enable = async () => {
    setError(null)
    setNotice(null)
    if (!supported) {
      setError('이 브라우저에서는 백그라운드 알림을 지원하지 않아요.')
      return
    }

    setBusy(true)
    let registeredHere = false
    try {
      if (!profile.pushEnabled) {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          setError(
            '브라우저 알림 권한이 필요해요. 주소창의 알림 설정을 확인해 주세요.',
          )
          return
        }
        const registered = await registerPushToken(profile.uid)
        if (!registered.ok) {
          setError(registered.error ?? '기기 등록에 실패했어요.')
          return
        }
        registeredHere = true
      }

      const ok = await profileApi.savePreferences({
        planReminderEnabled: true,
        planReminderOffsetMinutes: offset,
        reminderTimezone: timezone,
        ...(registeredHere ? { pushEnabled: true } : {}),
      })
      if (!ok) {
        if (registeredHere) await removePushToken(profile.uid)
        return
      }
      setNotice('공부 일정 시작 알림을 켰어요.')
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : '알림 설정 중 오류가 발생했어요.',
      )
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    setError(null)
    setNotice(null)
    setBusy(true)
    const ok = await profileApi.savePreferences({ planReminderEnabled: false })
    setBusy(false)
    if (ok) setNotice('공부 일정 시작 알림을 껐어요.')
  }

  const updateOffset = async (value: string) => {
    const next = Number(value) as PlanReminderOffset
    setError(null)
    setNotice(null)
    setBusy(true)
    const ok = await profileApi.savePreferences({
      planReminderOffsetMinutes: next,
      reminderTimezone: timezone,
    })
    setBusy(false)
    if (ok) {
      setNotice(`알림 시점을 ${PLAN_REMINDER_OFFSET_LABELS[next]}로 저장했어요.`)
    }
  }

  return (
    <section className={`${panelClass} mt-4 p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-[#3d3a55]">
            일정 시작 알림
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[#8b88a3]">
            공부 계획의 시작 시각에 맞춰 알려드려요. 시작 시간이 비어 있는
            계획은 알림을 보내지 않습니다.
          </p>
        </div>
        <span className="rounded-full bg-[#faf9ff] px-2.5 py-1 text-[11px] font-extrabold text-[#8b88a3]">
          {enabled && profile.pushEnabled
            ? '일정 알림 켜짐'
            : enabled
              ? '기기 등록 필요'
              : '꺼짐'}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <label className="flex items-center gap-2 text-sm font-bold text-[#5f5c78]">
          <input
            type="checkbox"
            checked={enabled}
            disabled={busy || !supported}
            onChange={(event) => {
              if (event.target.checked) void enable()
              else void disable()
            }}
            className="h-4 w-4 accent-[#6f68e8]"
          />
          일정 시작 알림 받기
        </label>

        <label className="text-xs font-bold text-[#5f5c78]">
          알림 시점
          <select
            value={offset}
            disabled={busy}
            onChange={(event) => void updateOffset(event.target.value)}
            className={`${inputClass} mt-1 block`}
          >
            {PLAN_REMINDER_OFFSETS.map((value) => (
              <option key={value} value={value}>
                {PLAN_REMINDER_OFFSET_LABELS[value]}
              </option>
            ))}
          </select>
        </label>

        {enabled && !profile.pushEnabled && (
          <button
            type="button"
            onClick={() => void enable()}
            disabled={busy || !supported}
            className={ghostButton}
          >
            {busy ? '등록 중…' : '기기 등록'}
          </button>
        )}
      </div>

      {!supported && (
        <p className="mt-3 text-xs leading-relaxed text-[#b26a3f]">
          이 브라우저는 백그라운드 알림을 지원하지 않아요. Chrome·Edge 또는
          홈 화면에 설치한 PWA에서 사용해 주세요.
        </p>
      )}
      {enabled && !profile.pushEnabled && (
        <p className="mt-3 text-xs leading-relaxed text-[#b26a3f]">
          알림을 받으려면 위의 기기 등록을 눌러 브라우저 권한과 FCM 기기를
          등록해 주세요.
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-xl bg-[#ffeff3] px-3.5 py-2.5 text-sm text-[#d96a7c]">
          {error}
        </p>
      )}
      {notice && (
        <p className="mt-3 rounded-xl bg-[#eafaf1] px-3.5 py-2.5 text-sm text-[#3d9b6a]">
          {notice}
        </p>
      )}
      {profileApi.actionError && (
        <p className="mt-3 rounded-xl bg-[#ffeff3] px-3.5 py-2.5 text-sm text-[#d96a7c]">
          {profileApi.actionError}
        </p>
      )}
    </section>
  )
}
