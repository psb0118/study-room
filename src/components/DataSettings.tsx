import { useState } from 'react'
import type { User } from 'firebase/auth'
import type { PlannerApi } from '../hooks/usePlanner'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { deleteAccount } from '../lib/account'
import { authMessage } from '../lib/errors'
import { csvFileName, downloadText, toCsv } from '../lib/csv'
import { buildExportBundle, exportFileName } from '../lib/exportData'
import type { UserProfile } from '../types'
import {
  Modal,
  dangerButton,
  ghostButton,
  inputClass,
  panelClass,
  primaryButton,
} from './ui'

interface DataSettingsProps {
  user: User
  profile: UserProfile
  /** 부모가 선택한 자녀. 없으면 현재 로그인 계정 데이터를 내보낸다. */
  exportProfile?: UserProfile | null
  planner?: PlannerApi
}

export function DataSettings({
  user,
  profile,
  exportProfile,
  planner,
}: DataSettingsProps) {
  const online = useOnlineStatus()
  const target = exportProfile ?? profile
  const targetIsChild = target.uid !== profile.uid
  const targetPlanner =
    profile.role === 'student' || targetIsChild ? planner : undefined
  const exportLoading = targetPlanner?.loading ?? false
  const targetName = target.nickname || target.name
  const [exportNotice, setExportNotice] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const hasPassword = user.providerData.some(
    (provider) => provider.providerId === 'password',
  )
  const hasGoogle = user.providerData.some(
    (provider) => provider.providerId === 'google.com',
  )
  const canDelete = hasPassword || hasGoogle

  const exportCsv = () => {
    if (exportLoading) return
    setExportNotice(null)
    setExportError(null)
    try {
      const rows: (string | number)[][] = [
        ['구분', '날짜', '과목', '제목', '상태', '목표(분)', '시간', '메모'],
      ]
      for (const plan of targetPlanner?.plans ?? []) {
        const subject = targetPlanner?.subjects.find(
          (item) => item.id === plan.subjectId,
        )
        rows.push([
          '계획',
          plan.plannedDate,
          subject?.name ?? '과목 없음',
          plan.title,
          plan.status,
          plan.targetMinutes,
          plan.startTime || '',
          plan.memo,
        ])
      }
      for (const record of targetPlanner?.records ?? []) {
        const subject = targetPlanner?.subjects.find(
          (item) => item.id === record.subjectId,
        )
        rows.push([
          '기록',
          record.dateKey,
          subject?.name ?? '과목 없음',
          '',
          record.source === 'room' ? '스터디 룸' : '직접 기록',
          Math.round(record.durationMs / 60_000),
          '',
          record.memo,
        ])
      }
      downloadText(toCsv(rows), csvFileName(targetName))
      setExportNotice(`${targetName}님의 계획·기록을 CSV로 저장했어요.`)
    } catch (e) {
      setExportError(
        e instanceof Error ? e.message : 'CSV를 내보내지 못했어요.',
      )
    }
  }

  const exportData = () => {
    if (exportLoading) return
    setExportNotice(null)
    setExportError(null)
    try {
      const bundle = buildExportBundle({
        exportedBy: profile,
        target,
        subjects: targetPlanner?.subjects,
        plans: targetPlanner?.plans,
        records: targetPlanner?.records,
      })
      const blob = new Blob([JSON.stringify(bundle, null, 2)], {
        type: 'application/json;charset=utf-8',
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = exportFileName(target)
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setExportNotice(`${targetName}님의 데이터를 JSON 파일로 저장했어요.`)
    } catch (e) {
      setExportError(
        e instanceof Error
          ? e.message
          : '데이터를 내보내지 못했어요. 잠시 후 다시 시도해 주세요.',
      )
    }
  }

  const openDelete = () => {
    if (!online) return
    setPassword('')
    setConfirmText('')
    setDeleteError(null)
    setDeleteBusy(false)
    setDeleteOpen(true)
  }

  const closeDelete = () => {
    if (deleteBusy) return
    setDeleteOpen(false)
  }

  const removeAccount = async () => {
    setDeleteError(null)
    if (confirmText.trim() !== '삭제') {
      setDeleteError('확인을 위해 “삭제”를 정확히 입력해 주세요.')
      return
    }
    if (hasPassword && !password) {
      setDeleteError('비밀번호를 입력해 주세요.')
      return
    }
    setDeleteBusy(true)
    try {
      await deleteAccount(user, profile, password)
    } catch (e) {
      setDeleteError(authMessage(e))
      setDeleteBusy(false)
    }
  }

  const canSubmit =
    online &&
    canDelete &&
    confirmText.trim() === '삭제' &&
    (!hasPassword || password.length > 0)

  return (
    <>
      <section className={`${panelClass} mt-4 p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold tracking-[0.08em] text-[#7c74f0] uppercase">
              DATA &amp; ACCOUNT
            </p>
            <h2 className="mt-2 text-lg font-extrabold text-[#3d3a55]">
              데이터 관리
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-[#8b88a3]">
              공부 기록을 보관하거나, 계정을 정리할 수 있어요.
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
              online
                ? 'bg-[#e8f8f0] text-[#3f9f7f]'
                : 'bg-[#fff8f0] text-[#b26a3f]'
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${
                online ? 'bg-[#4faa83]' : 'bg-[#d98a5f]'
              }`}
            />
            {online ? '온라인' : '오프라인'}
          </span>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-[#ece8f7] bg-[#faf9ff] p-4">
            <h3 className="text-sm font-extrabold text-[#3d3a55]">
              데이터 내보내기
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#8b88a3]">
              {targetIsChild
                ? `${targetName}님의 프로필·과목·계획·기록을 JSON으로 저장해요.`
                : '내 프로필·과목·계획·기록을 JSON으로 저장해요.'}{' '}
              {targetPlanner
                ? `현재 ${targetPlanner.plans.length}개 계획, ${targetPlanner.records.length}개 기록이에요.`
                : '프로필과 연결 정보를 저장해요.'}
            </p>
            <button
              type="button"
              onClick={exportData}
              disabled={exportLoading}
              className={`${primaryButton} mt-4 w-full`}
            >
              {exportLoading ? '데이터 불러오는 중…' : 'JSON으로 내보내기'}
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={exportLoading}
              className={`${ghostButton} mt-2 w-full`}
            >
              CSV로 내보내기
            </button>
            {exportNotice && (
              <p className="mt-2 text-[11px] leading-relaxed text-[#3f9f7f]">
                {exportNotice}
              </p>
            )}
            {exportError && (
              <p className="mt-2 text-[11px] leading-relaxed text-[#d96a7c]">
                {exportError}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-[#ece8f7] bg-white p-4">
            <h3 className="text-sm font-extrabold text-[#3d3a55]">
              오프라인에서도
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#8b88a3]">
              한 번 불러온 계획과 기록은 오프라인에서도 볼 수 있어요. 새로
              만든 계획과 기록은 연결이 돌아오면 자동으로 저장됩니다.
            </p>
            <p className="mt-3 rounded-lg bg-[#f7f4ff] px-2.5 py-2 text-[11px] leading-relaxed text-[#6a63c9]">
              휴대폰·PC에서 앱을 한 번 연 뒤부터 오프라인 앱 셸이
              준비돼요. 로그인 상태는 기기에 안전하게 유지됩니다.
            </p>
          </div>

          <div className="rounded-xl border border-[#f6d6dd] bg-[#fffafb] p-4">
            <h3 className="text-sm font-extrabold text-[#a84f60]">
              계정 삭제
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#9c7a82]">
              {profile.role === 'parent'
                ? '부모 계정과 연결 정보가 삭제돼요. 연결된 자녀의 학습 데이터는 유지됩니다.'
                : '프로필·계획·기록·포인트·부모 연결 정보가 모두 삭제되고 복구할 수 없어요.'}
            </p>
            <button
              type="button"
              onClick={openDelete}
              disabled={!online}
              className={`${dangerButton} mt-4 w-full`}
            >
              계정 삭제
            </button>
            {!online && (
              <p className="mt-2 text-[11px] text-[#b26a3f]">
                연결된 상태에서만 삭제할 수 있어요.
              </p>
            )}
          </div>
        </div>
      </section>

      {deleteOpen && (
        <Modal
          title="정말 계정을 삭제할까요?"
          subtitle="이 작업은 되돌릴 수 없어요."
          small
          onClose={closeDelete}
          footer={
            <>
              <button
                type="button"
                onClick={closeDelete}
                disabled={deleteBusy}
                className={ghostButton}
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void removeAccount()}
                disabled={!canSubmit || deleteBusy}
                className={dangerButton}
              >
                {deleteBusy ? '삭제 중…' : '계정 삭제'}
              </button>
            </>
          }
        >
          <div className="space-y-3 text-sm leading-relaxed text-[#5f5c78]">
            <p className="rounded-xl bg-[#fff8f8] px-3.5 py-3 text-xs text-[#9c5a67]">
              {profile.role === 'parent'
                ? '부모 계정과 자녀 연결이 삭제됩니다. 자녀 계정과 학습 기록은 삭제되지 않아요.'
                : '프로필, 과목, 계획, 공부 기록, 포인트, 주간 리그, 부모 연결이 모두 삭제됩니다. 부모님 계정은 별도로 남아요.'}
            </p>

            {hasPassword ? (
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[#5f5c78]">
                  비밀번호 확인
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="현재 비밀번호"
                  className={inputClass}
                />
              </label>
            ) : hasGoogle ? (
              <p className="rounded-xl bg-[#f7f4ff] px-3.5 py-3 text-xs leading-relaxed text-[#6a63c9]">
                Google 계정으로 다시 인증하는 창이 열려요. 창을 닫으면
                삭제가 진행되지 않습니다.
              </p>
            ) : (
              <p className="rounded-xl bg-[#fff8f0] px-3.5 py-3 text-xs text-[#b26a3f]">
                이 로그인 방식은 계정 삭제를 지원하지 않아요. 로그아웃 후
                다시 로그인해 주세요.
              </p>
            )}

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#5f5c78]">
                확인을 위해 <strong className="text-[#d96a7c]">삭제</strong>
                를 입력해 주세요
              </span>
              <input
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                autoComplete="off"
                placeholder="삭제"
                className={inputClass}
              />
            </label>

            {deleteError && (
              <p className="rounded-xl bg-[#ffeff3] px-3.5 py-2.5 text-xs leading-relaxed text-[#d96a7c]">
                {deleteError}
              </p>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}
