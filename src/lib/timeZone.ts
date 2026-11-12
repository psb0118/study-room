/** IANA 시간대인지 확인하고, 잘못된 값은 한국 시간으로 대체한다. */
export function normalizeTimeZone(value: unknown): string {
  const raw = String(value ?? '').trim()
  if (!raw) return 'Asia/Seoul'
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: raw })
    return raw
  } catch {
    return 'Asia/Seoul'
  }
}
