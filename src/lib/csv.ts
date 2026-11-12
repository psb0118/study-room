export function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value ?? '')
          return /[",\n\r]/.test(text)
            ? `"${text.replace(/"/g, '""')}"`
            : text
        })
        .join(','),
    )
    .join('\r\n')
}

export function csvFileName(
  profileName: string,
  now = new Date(),
): string {
  const safe =
    profileName.replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 40) || '하루결'
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
  return `haru-gyeol-${safe}-${date}.csv`
}

/** 브라우저에서 CSV 파일을 내려받는다. */
export function downloadText(
  text: string,
  filename: string,
  type = 'text/csv;charset=utf-8',
): void {
  const blob = new Blob(['\uFEFF', text], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
