/** 지정한 HH:mm의 다음 알림 시각. 이미 지났으면 내일로 넘긴다. */
export function nextReminderAt(now: Date, time: string): Date | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null
  const [hours, minutes] = time.split(':').map(Number)
  const next = new Date(now)
  next.setHours(hours, minutes, 0, 0)
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1)
  return next
}
