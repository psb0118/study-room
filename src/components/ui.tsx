import { useEffect, type ReactNode } from 'react'
import {
  PERIOD_LABEL,
  STATUS_LABEL,
  formatDuration,
  type DayTotal,
  type Period,
} from '../lib/planner'
import type { PlanStatus } from '../types'

export const panelClass = 'surface'

export const inputClass = 'input-base'

export const primaryButton = 'btn btn-primary'

export const ghostButton = 'btn'

export const dangerButton = 'btn btn-danger'

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="mb-2 text-[11px] font-extrabold tracking-[0.09em] text-[#5969df] uppercase">
          {eyebrow}
        </p>
        <h1 className="text-[clamp(24px,3vw,31px)] leading-[1.22] font-extrabold tracking-[-0.045em] text-[#202538]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm text-[#72778d]">{description}</p>
        )}
      </div>
      {action}
    </header>
  )
}

export function Field({
  label,
  error,
  className = '',
  children,
}: {
  label: string
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-bold text-[#5f6579]">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1 block text-[11px] font-semibold text-[#c84f61]">
          {error}
        </span>
      )}
    </label>
  )
}

export function EmptyState({
  icon = '✦',
  title,
  description,
  action,
}: {
  icon?: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="grid min-h-44 place-items-center px-5 py-8 text-center">
      <div>
        <div className="mb-2 text-3xl">{icon}</div>
        <strong className="mb-1 block text-sm font-extrabold text-[#202538]">
          {title}
        </strong>
        <p className="text-sm leading-relaxed text-[#72778d]">{description}</p>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  )
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  small = false,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  small?: boolean
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#191d2d]/45 sm:items-center sm:p-5"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-[19px] border border-[#e7e9f2] bg-white shadow-[0_24px_70px_rgba(8,11,28,0.25)] sm:rounded-[19px] ${
          small ? 'sm:max-w-[420px]' : 'sm:max-w-[610px]'
        }`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#eef0f5] px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold tracking-[-0.03em] text-[#202538]">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-xs text-[#72778d]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f5f6fa] text-lg text-[#73798c] transition hover:bg-[#eceef5]"
          >
            ×
          </button>
        </header>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <footer className="flex justify-end gap-2 border-t border-[#eef0f5] px-5 py-4">
            {footer}
          </footer>
        )}
      </section>
    </div>
  )
}

export function PeriodTabs({
  value,
  onChange,
}: {
  value: Period
  onChange: (period: Period) => void
}) {
  const periods: Period[] = ['today', 'week', 'month', 'all']
  return (
    <div className="flex flex-wrap gap-1.5">
      {periods.map((period) => (
        <button
          key={period}
          type="button"
          onClick={() => onChange(period)}
          className={`min-h-[33px] rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            value === period
              ? 'bg-[#eef0ff] text-[#5969df]'
              : 'text-[#767b8e] hover:bg-[#f4f5fa]'
          }`}
        >
          {PERIOD_LABEL[period]}
        </button>
      ))}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string
  value: string
  hint?: string
  accent?: boolean
}) {
  return (
    <div className="surface relative min-h-[132px] overflow-hidden p-5">
      <div
        className={`absolute -right-5 -bottom-6 h-[76px] w-[76px] rounded-full ${
          accent ? 'bg-[#fff1e7]' : 'bg-[#eef0ff]'
        }`}
      />
      <div className="relative">
        <div className="text-[13px] font-bold text-[#72778d]">{label}</div>
        <div
          className={`mt-4 text-[27px] leading-none font-extrabold tracking-[-0.055em] ${
            accent ? 'text-[#d66f27]' : 'text-[#202538]'
          }`}
        >
          {value}
        </div>
        {hint && (
          <div className="mt-1.5 text-xs text-[#9498a7]">{hint}</div>
        )}
      </div>
    </div>
  )
}

const STATUS_CLASS: Record<PlanStatus, string> = {
  planned: 'badge badge-planned',
  in_progress: 'badge badge-progress',
  completed: 'badge badge-done',
}

export function StatusBadge({ status }: { status: PlanStatus }) {
  return <span className={STATUS_CLASS[status]}>{STATUS_LABEL[status]}</span>
}

export function WeekBars({ days }: { days: DayTotal[] }) {
  const max = Math.max(60_000, ...days.map((d) => d.ms))
  return (
    <div className="flex h-44 items-stretch gap-2">
      {days.map((day) => (
        <div
          key={day.key}
          className="flex h-full min-w-0 flex-1 flex-col items-center gap-1.5"
        >
          <span className="h-4 text-[10px] text-[#9498a7]">
            {day.ms > 0 ? formatDuration(day.ms) : ''}
          </span>
          <div className="flex w-full flex-1 items-end">
            <div
              className={`w-full rounded-t-md transition-all ${
                day.ms > 0
                  ? 'bg-gradient-to-t from-[#5969df] to-[#7e8af0]'
                  : 'bg-[#edf0f6]'
              }`}
              style={{ height: `${Math.max(4, (day.ms / max) * 100)}%` }}
              title={`${day.key} · ${formatDuration(day.ms)}`}
            />
          </div>
          <span className="text-[10px] text-[#9498a7]">{day.label}</span>
        </div>
      ))}
    </div>
  )
}
