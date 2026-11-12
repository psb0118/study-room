import { useAdminUsers } from '../hooks/useAdminUsers'
import { ACCOUNT_STATUS_LABEL } from '../lib/accountStatus'
import { ADMIN_EMAIL, isAdminEmail } from '../lib/admin'
import type { UserProfile } from '../types'
import { Avatar } from './Avatar'
import { PageHeader, StatCard, panelClass } from './ui'

const ROLE_LABEL: Record<string, string> = {
  student: '학생',
  parent: '부모',
}

function roleLabel(profile: UserProfile): string {
  if (isAdminEmail(profile.email)) return '관리자'
  return ROLE_LABEL[profile.role] ?? '역할 미설정'
}

function dateLabel(ms: number): string {
  if (!ms) return '가입일 정보 없음'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(ms))
}

/** 관리자 전용 화면. 사용자 프로필의 이용 상태만 변경할 수 있다. */
export function AdminDashboard({ admin }: { admin: UserProfile }) {
  const {
    users,
    loading,
    error,
    busyUid,
    actionError,
    setAccountStatus,
  } = useAdminUsers()
  const students = users.filter((user) => user.role === 'student')
  const parents = users.filter((user) => user.role === 'parent')
  const connectedChildren = new Set(
    parents.flatMap((parent) => parent.childUids),
  )

  return (
    <div>
      <PageHeader
        eyebrow="ADMIN CONSOLE"
        title="관리자"
        description={`${ADMIN_EMAIL} 계정으로 로그인했어요. 전체 사용자와 가족 연결 현황을 확인하고 계정 이용 상태를 관리할 수 있어요.`}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="전체 사용자" value={`${users.length}명`} />
        <StatCard label="학생" value={`${students.length}명`} />
        <StatCard label="부모" value={`${parents.length}명`} />
        <StatCard
          label="자녀 연결"
          value={`${connectedChildren.size}건`}
          hint="부모 계정에 연결된 자녀 기준"
          accent
        />
      </div>

      <section className={`${panelClass} mt-4 p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold tracking-[0.08em] text-[#7c74f0] uppercase">
              USER DIRECTORY
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-[#3d3a55]">
              전체 사용자
            </h2>
            <p className="mt-1 text-sm text-[#8b88a3]">
              이름과 이메일, 역할, 가족 연결 상태를 확인하고 계정을 정지·재개할 수 있어요.
            </p>
          </div>
          <span className="inline-flex rounded-full bg-[#f1eeff] px-2.5 py-1 text-[11px] font-extrabold text-[#6f68e8]">
            {loading ? '불러오는 중…' : `${users.length}명`}
          </span>
        </div>

        {actionError && (
          <div className="mt-4 rounded-xl border border-[#f6d6dd] bg-[#ffeff3] px-4 py-3 text-sm leading-relaxed text-[#d96a7c]">
            {actionError}
          </div>
        )}

        {loading ? (
          <p className="mt-5 rounded-xl bg-[#faf9ff] px-4 py-4 text-sm text-[#8b88a3]">
            사용자 목록을 불러오는 중…
          </p>
        ) : error ? (
          <div className="mt-5 rounded-xl border border-[#f6d6dd] bg-[#ffeff3] px-4 py-3 text-sm leading-relaxed text-[#d96a7c]">
            <p>관리자 데이터를 불러오지 못했어요. {error}</p>
            <p className="mt-1 text-xs">
              firebase/firestore.rules의 관리자 읽기 권한이 게시됐는지
              확인해 주세요.
            </p>
          </div>
        ) : users.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-[#d6d1ff] bg-[#faf9ff] px-4 py-5 text-sm text-[#8b88a3]">
            아직 등록된 사용자가 없어요.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[#f1eef9]">
            {users.map((user) => {
              const name = user.nickname || user.name || '이름 없음'
              const isMe = user.uid === admin.uid
              const parent = user.role === 'parent'
              const isAdmin = isAdminEmail(user.email)
              const suspended = user.accountStatus === 'suspended'
              const nextStatus = suspended ? 'active' : 'suspended'
              const statusLabel = ACCOUNT_STATUS_LABEL[user.accountStatus]
              return (
                <li
                  key={user.uid}
                  className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <Avatar name={name} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="truncate text-sm font-extrabold text-[#3d3a55]">
                        {name}
                      </strong>
                      {isMe && (
                        <span className="rounded-full bg-[#fff1e8] px-2 py-0.5 text-[10px] font-extrabold text-[#b26a3f]">
                          나
                        </span>
                      )}
                      <span className="rounded-full bg-[#f1eeff] px-2 py-0.5 text-[10px] font-extrabold text-[#6a63c9]">
                        {roleLabel(user)}
                      </span>
                      <span
                        className={
                          suspended
                            ? 'rounded-full bg-[#ffeff3] px-2 py-0.5 text-[10px] font-extrabold text-[#d96a7c]'
                            : 'rounded-full bg-[#eafaf1] px-2 py-0.5 text-[10px] font-extrabold text-[#3d9b6a]'
                        }
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <p className="truncate text-xs text-[#8b88a3]">
                      {user.email || '이메일 정보 없음'}
                    </p>
                    <p className="mt-1 text-[11px] text-[#a8a5bb]">
                      {parent
                        ? `연결된 자녀 ${user.childUids.length}명`
                        : user.role === 'student'
                          ? user.familyCode
                            ? '부모 연결 코드 발급됨'
                            : '부모 연결 코드 없음'
                          : '관리자 계정'}{' '}
                      · {dateLabel(user.createdAt)} 가입
                    </p>
                  </div>
                  {!isMe && !isAdmin && (
                    <button
                      type="button"
                      disabled={busyUid === user.uid}
                      onClick={() => {
                        const message = suspended
                          ? `${name} 계정의 이용을 다시 시작할까요?`
                          : `${name} 계정을 정지할까요? 정지된 동안에는 학습 화면을 이용할 수 없어요.`
                        if (window.confirm(message)) {
                          void setAccountStatus(user.uid, nextStatus)
                        }
                      }}
                      className={
                        suspended
                          ? 'rounded-xl border border-[#c9e9d8] bg-[#f0fbf5] px-3 py-2 text-xs font-extrabold text-[#3d9b6a] transition hover:bg-[#e6f8ee] disabled:cursor-wait disabled:opacity-60'
                          : 'rounded-xl border border-[#f2ccd5] bg-[#fff5f7] px-3 py-2 text-xs font-extrabold text-[#d96a7c] transition hover:bg-[#ffecef] disabled:cursor-wait disabled:opacity-60'
                      }
                    >
                      {busyUid === user.uid
                        ? '처리 중…'
                        : suspended
                          ? '이용 재개'
                          : '이용 정지'}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
