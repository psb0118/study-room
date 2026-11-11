import { useOnlineStatus } from '../hooks/useOnlineStatus'

export function OfflineNotice() {
  const online = useOnlineStatus()
  if (online) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 flex items-start gap-2.5 rounded-xl border border-[#f0d0b8] bg-[#fff8f0] px-4 py-3 text-xs leading-relaxed text-[#9a6a44]"
    >
      <span aria-hidden="true" className="mt-0.5 text-sm">
        ◌
      </span>
      <div>
        <strong className="font-extrabold">오프라인 상태예요.</strong>{' '}
        마지막으로 불러온 내용을 보여주고, 새로 저장한 내용은 연결이
        돌아오면 자동으로 동기화됩니다.
      </div>
    </div>
  )
}
