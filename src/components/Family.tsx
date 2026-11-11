import { useState, type FormEvent } from 'react'
import type { User } from 'firebase/auth'
import type { PlannerApi } from '../hooks/usePlanner'
import type { ProfileApi } from '../hooks/useProfile'
import type { UserProfile } from '../types'
import { DataSettings } from './DataSettings'
import {
  PageHeader,
  dangerButton,
  ghostButton,
  inputClass,
  panelClass,
  primaryButton,
} from './ui'

interface FamilyProps {
  user: User
  profile: UserProfile
  profileApi: ProfileApi
  exportProfile?: UserProfile | null
  planner?: PlannerApi
}

export function Family({
  user,
  profile,
  profileApi,
  exportProfile,
  planner,
}: FamilyProps) {
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)

  const copyCode = async () => {
    if (!profile.familyCode) return
    try {
      await navigator.clipboard.writeText(profile.familyCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      window.prompt('부모님께 알려줄 연결 코드', profile.familyCode)
    }
  }

  const linkChild = async (event: FormEvent) => {
    event.preventDefault()
    const ok = await profileApi.linkChild(code)
    if (ok) setCode('')
  }

  if (profile.role === 'student') {
    return (
      <div>
        <PageHeader
          eyebrow="FAMILY LINK"
          title="부모님 연결"
          description="부모님이 자녀의 공부 일정을 함께 관리할 수 있도록 연결 코드를 알려주세요."
        />

        <NicknameCard profile={profile} profileApi={profileApi} />

        <div className="grid gap-4 lg:grid-cols-5">
          <section className={`${panelClass} p-6 lg:col-span-3`}>
            <p className="text-[11px] font-extrabold tracking-[0.08em] text-[#7c74f0] uppercase">
              MY FAMILY CODE
            </p>
            <h2 className="mt-2 text-lg font-extrabold text-[#3d3a55]">
              부모님께 알려줄 6자리 코드
            </h2>
            {profile.familyCode ? (
              <>
                <div className="mt-5 rounded-2xl border border-[#e6e1ff] bg-gradient-to-br from-[#f1eeff] to-[#e8f8f0] px-4 py-7 text-center">
                  <div className="font-mono text-[clamp(28px,7vw,42px)] font-extrabold tracking-[0.28em] text-[#5f57c8]">
                    {profile.familyCode}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void copyCode()}
                    className={primaryButton}
                  >
                    {copied ? '복사됐어요 ✓' : '코드 복사'}
                  </button>
                  <button
                    type="button"
                    disabled={profileApi.busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          '새 코드를 만들까요? 기존에 연결된 부모님은 그대로 유지되고, 새로 연결할 때만 새 코드가 필요해요.',
                        )
                      ) {
                        void profileApi.regenerateFamilyCode()
                      }
                    }}
                    className={ghostButton}
                  >
                    코드 재발급
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-[#d6d1ff] bg-[#faf9ff] px-5 py-8 text-center">
                <p className="text-sm text-[#8b88a3]">
                  아직 연결 코드가 없어요.
                </p>
                <button
                  type="button"
                  disabled={profileApi.busy}
                  onClick={() => void profileApi.regenerateFamilyCode()}
                  className={`${primaryButton} mt-4`}
                >
                  연결 코드 만들기
                </button>
              </div>
            )}
          </section>

          <section className={`${panelClass} p-6 lg:col-span-2`}>
            <h2 className="text-sm font-extrabold text-[#3d3a55]">
              연결은 이렇게 해요
            </h2>
            <ol className="mt-3 space-y-3 text-sm leading-relaxed text-[#706d8a]">
              <li className="flex gap-2">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#f1eeff] text-[10px] font-extrabold text-[#6f68e8]">
                  1
                </span>
                부모님이 하루결에 부모 계정으로 로그인해요.
              </li>
              <li className="flex gap-2">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#f1eeff] text-[10px] font-extrabold text-[#6f68e8]">
                  2
                </span>
                부모님 화면에서 위 6자리 코드를 입력해요.
              </li>
              <li className="flex gap-2">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#e8f8f0] text-[10px] font-extrabold text-[#3f9f7f]">
                  3
                </span>
                연결되면 부모님이 일정을 추가·삭제하거나 완료를 취소할 수
                있어요.
              </li>
            </ol>
            <p className="mt-4 rounded-xl bg-[#fffaf2] px-3 py-2.5 text-xs leading-relaxed text-[#9a7b4f]">
              코드는 가족끼리만 공유해 주세요. 코드를 아는 사람은 부모
              계정으로 연결할 수 있어요.
            </p>
          </section>
        </div>

        <DataSettings
          user={user}
          profile={profile}
          exportProfile={exportProfile ?? profile}
          planner={planner}
        />

        <ActionError message={profileApi.actionError} />
      </div>
    )
  }

  const childUids =
    profile.childUids.length > 0
      ? profile.childUids
      : profile.childUid
        ? [profile.childUid]
        : []

  return (
    <div>
      <PageHeader
        eyebrow="FAMILY LINK"
        title="자녀 연결"
        description="자녀의 하루결 연결 코드를 입력하면 일정과 진도를 함께 볼 수 있어요."
      />

      <NicknameCard profile={profile} profileApi={profileApi} />

      {childUids.length > 0 && (
        <section className={`${panelClass} mb-4 p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="inline-flex rounded-full bg-[#e8f8f0] px-2.5 py-1 text-[11px] font-extrabold text-[#3f9f7f]">
                {childUids.length}명 연결됨
              </span>
              <h2 className="mt-3 text-lg font-extrabold text-[#3d3a55]">
                연결된 자녀
              </h2>
              <p className="mt-1 text-sm text-[#8b88a3]">
                자녀를 선택하면 현황·일정·순위를 각각 확인할 수 있어요.
              </p>
            </div>
          </div>
          <ul className="mt-4 divide-y divide-[#f1eef9]">
            {childUids.map((uid, index) => (
              <li
                key={uid}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <div className="text-sm font-extrabold text-[#3d3a55]">
                    {profile.childNames[uid] ?? `자녀 ${index + 1}`}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#a8a5bb]">
                    연결된 공부 계정
                  </div>
                </div>
                <button
                  type="button"
                  disabled={profileApi.busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        '이 자녀의 연결을 해제할까요? 해제하면 자녀의 일정을 더 이상 관리할 수 없어요.',
                      )
                    ) {
                      void profileApi.unlinkChild(uid)
                    }
                  }}
                  className={dangerButton}
                >
                  연결 해제
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <section className={`${panelClass} p-6 lg:col-span-3`}>
          <h2 className="text-lg font-extrabold text-[#3d3a55]">
            {childUids.length > 0 ? '자녀 추가 연결' : '자녀의 연결 코드 입력'}
          </h2>
          <p className="mt-1 text-sm text-[#8b88a3]">
            자녀가 하루결의 부모님 연결 화면에서 확인한 6자리 코드를 입력해
            주세요.
          </p>
          <form onSubmit={linkChild} className="mt-5">
            <label
              htmlFor="family-code"
              className="mb-1.5 block text-xs font-bold text-[#5f5c78]"
            >
              연결 코드
            </label>
            <input
              id="family-code"
              value={code}
              onChange={(event) => {
                setCode(event.target.value.toUpperCase())
                if (profileApi.actionError) profileApi.clearError()
              }}
              maxLength={6}
              autoComplete="off"
              placeholder="예: A7K2M9"
              className={`${inputClass} text-center font-mono text-2xl tracking-[0.3em] uppercase`}
            />
            <button
              type="submit"
              disabled={profileApi.busy || code.trim().length !== 6}
              className={`${primaryButton} mt-4 w-full`}
            >
              {profileApi.busy ? '연결 중…' : '자녀와 연결하기'}
            </button>
          </form>
          <ActionError message={profileApi.actionError} />
        </section>

        <section className={`${panelClass} p-6 lg:col-span-2`}>
          <h2 className="text-sm font-extrabold text-[#3d3a55]">
            부모님 계정으로 할 수 있는 일
          </h2>
          <ul className="mt-3 space-y-3 text-sm leading-relaxed text-[#706d8a]">
            <li>✓ 자녀의 오늘 계획과 완료 상태 확인</li>
            <li>✓ 공부 일정 직접 추가</li>
            <li>✓ 일정 삭제 및 완료 취소</li>
            <li>✓ 포인트·레벨과 전체 순위 확인</li>
            <li>✓ 이번 주 완료율과 공부 시간 확인</li>
          </ul>
          <p className="mt-4 rounded-xl bg-[#f1eeff] px-3 py-2.5 text-xs leading-relaxed text-[#6a63c9]">
            부모님 계정도 이메일로 가입할 수 있어요. 자녀 계정과는 연결
            코드로 안전하게 이어집니다.
          </p>
        </section>
      </div>

      <DataSettings
        user={user}
        profile={profile}
        exportProfile={exportProfile}
        planner={planner}
      />
    </div>
  )
}

function NicknameCard({
  profile,
  profileApi,
}: {
  profile: UserProfile
  profileApi: ProfileApi
}) {
  const [nickname, setNickname] = useState(profile.nickname || profile.name)
  const [saved, setSaved] = useState(false)

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setSaved(false)
    const ok = await profileApi.updateNickname(nickname)
    if (ok) setSaved(true)
  }

  return (
    <section className={`${panelClass} mb-4 p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-extrabold text-[#3d3a55]">
            순위표 닉네임
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[#8b88a3]">
            친구들에게 보여줄 이름이에요. 실명 대신 별명을 사용할 수 있어요.
          </p>
        </div>
        <div className="text-[11px] font-bold text-[#a8a5bb]">
          {nickname.length}/20
        </div>
      </div>
      <form onSubmit={save} className="mt-3 flex flex-wrap gap-2">
        <input
          value={nickname}
          onChange={(event) => {
            setNickname(event.target.value)
            setSaved(false)
          }}
          maxLength={20}
          aria-label="순위표 닉네임"
          className={`${inputClass} min-w-[180px] flex-1`}
        />
        <button
          type="submit"
          disabled={profileApi.busy || nickname.trim().length < 2}
          className={primaryButton}
        >
          {saved ? '저장됨 ✓' : '닉네임 저장'}
        </button>
      </form>
    </section>
  )
}

function ActionError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p className="mt-4 rounded-xl border border-[#f6d6dd] bg-[#ffeff3] px-4 py-3 text-sm text-[#d96a7c]">
      {message}
    </p>
  )
}
