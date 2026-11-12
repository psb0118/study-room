import { expect, type Page } from '@playwright/test'

export const APP_TIME_ZONE = process.env.E2E_TIMEZONE ?? 'Asia/Seoul'
export const RUN_ID = new Date()
  .toISOString()
  .replace(/[-:TZ.]/g, '')
  .slice(0, 12)
export const NOTIFICATION_LOG_KEY = '__haru_e2e_notifications'

export interface PlanInput {
  subjectName: string
  title: string
  date: string
  targetMinutes: number
  startTime?: string
}

export interface NotificationEntry {
  title: string
  body: string
}

function dateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )
  return {
    year: values.year,
    month: values.month,
    day: values.day,
  }
}

/** YYYY-MM-DD in the same timezone the browser uses. */
export function dateKey(date = new Date()): string {
  const { year, month, day } = dateParts(date, APP_TIME_ZONE)
  return `${year}-${month}-${day}`
}

/** HH:MM in the same timezone the browser uses. */
export function timeKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )
  return `${values.hour}:${values.minute}`
}

/** Add days to a YYYY-MM-DD key without depending on the runner timezone. */
export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + days, 12))
  return dateKey(next)
}

export async function signIn(page: Page): Promise<void> {
  const email = process.env.E2E_EMAIL?.trim()
  const password = process.env.E2E_PASSWORD
  if (!email || !password) {
    throw new Error(
      'E2E_EMAIL과 E2E_PASSWORD를 설정해야 합니다. 실제 데이터가 아닌 학생 테스트 계정을 사용하세요.',
    )
  }

  await page.goto('./')
  const emailInput = page.getByLabel('이메일')
  const loginButton = page.getByRole('button', {
    name: '이메일로 로그인',
    exact: true,
  })

  if (await emailInput.isVisible({ timeout: 10_000 }).catch(() => false)) {
    await emailInput.fill(email)
    await page.getByLabel('비밀번호').fill(password)
    await loginButton.click()
  }

  try {
    await expect
      .poll(
        async () => {
          if (
            await page
              .getByRole('button', { name: '공부 계획', exact: true })
              .first()
              .isVisible()
              .catch(() => false)
          ) {
            return 'app'
          }
          if (
            await page
              .getByRole('button', { name: /학생이에요/ })
              .first()
              .isVisible()
              .catch(() => false)
          ) {
            return 'role'
          }
          return 'wait'
        },
        { timeout: 30_000 },
      )
      .not.toBe('wait')
  } catch {
    throw new Error(
      '학생 계정으로 로그인하지 못했습니다. E2E_EMAIL/E2E_PASSWORD가 이메일 로그인 학생 계정인지 확인하세요.',
    )
  }

  const studentButton = page.getByRole('button', { name: /학생이에요/ }).first()
  if (await studentButton.isVisible().catch(() => false)) {
    await studentButton.click()
  }

  await expect(
    page.getByRole('button', { name: '공부 계획', exact: true }).first(),
  ).toBeVisible({ timeout: 30_000 })
}

export async function go(
  page: Page,
  navLabel: string,
  heading = navLabel,
): Promise<void> {
  await page
    .getByRole('button', { name: navLabel, exact: true })
    .first()
    .click()
  await expect(
    page.getByRole('heading', { name: heading, exact: true }).first(),
  ).toBeVisible({ timeout: 20_000 })
}

export function planCard(page: Page, title: string) {
  return page.locator('article').filter({
    has: page.getByRole('heading', { name: title, exact: true }),
  })
}

export function reminderCard(page: Page) {
  return page.locator('section').filter({
    has: page.getByRole('heading', { name: '일정 시작 알림', exact: true }),
  })
}

export async function ensureSubject(
  page: Page,
  subjectName: string,
): Promise<void> {
  await go(page, '과목 관리')
  const existing = page.locator('article').filter({ hasText: subjectName })
  if ((await existing.count()) > 0) return

  await page.getByRole('button', { name: /과목 추가/ }).first().click()
  const dialog = page.getByRole('dialog', { name: '새 과목' })
  await dialog.getByLabel('과목명 *').fill(subjectName)
  await dialog.getByRole('button', { name: '과목 추가', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(existing).toBeVisible()
}

export async function createPlan(page: Page, input: PlanInput): Promise<void> {
  await go(page, '공부 계획')
  await page.getByRole('button', { name: /계획 추가/ }).first().click()
  const dialog = page.getByRole('dialog', { name: '새 공부 계획' })
  await dialog.getByLabel('과목 *').selectOption({ label: input.subjectName })
  await dialog.getByLabel('제목 *').fill(input.title)
  await dialog.getByLabel('날짜 *').fill(input.date)
  await dialog
    .getByLabel('목표 공부 시간 (분) *')
    .fill(String(input.targetMinutes))
  if (input.startTime) {
    await dialog.getByLabel('시작 시간').fill(input.startTime)
  }
  await dialog.getByRole('button', { name: '계획 추가', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(planCard(page, input.title)).toBeVisible()
}

export async function editPlanTitle(
  page: Page,
  currentTitle: string,
  nextTitle: string,
): Promise<void> {
  const card = planCard(page, currentTitle)
  await card.getByRole('button', { name: '계획 수정' }).click()
  const dialog = page.getByRole('dialog', { name: '공부 계획 수정' })
  await dialog.getByLabel('제목 *').fill(nextTitle)
  await dialog.getByRole('button', { name: '변경 저장', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(planCard(page, nextTitle)).toBeVisible()
}

/**
 * Chromium headless cannot assert on an operating-system notification bubble.
 * This spy records the app's actual Notification / service-worker call instead.
 */
export async function installNotificationSpy(page: Page): Promise<void> {
  await page.addInitScript(
    ({ key }) => {
      const read = (): Array<{ title: string; body: string }> => {
        try {
          const raw = window.localStorage.getItem(key)
          return raw ? (JSON.parse(raw) as Array<{ title: string; body: string }>) : []
        } catch {
          return []
        }
      }

      const record = (title: string, options?: NotificationOptions) => {
        const entries = read()
        entries.push({ title, body: options?.body ?? '' })
        window.localStorage.setItem(key, JSON.stringify(entries))
      }

      const proto = window.ServiceWorkerRegistration?.prototype
      if (proto) {
        proto.showNotification = function showNotification(
          title: string,
          options?: NotificationOptions,
        ) {
          record(title, options)
          return Promise.resolve()
        }
      }

      const FakeNotification = function fakeNotification(
        title: string,
        options?: NotificationOptions,
      ) {
        record(title, options)
      } as unknown as typeof Notification

      Object.defineProperty(FakeNotification, 'permission', {
        configurable: true,
        get: () => 'granted',
      })
      FakeNotification.requestPermission = async () =>
        'granted' as NotificationPermission
      Object.defineProperty(window, 'Notification', {
        configurable: true,
        value: FakeNotification,
      })
    },
    { key: NOTIFICATION_LOG_KEY },
  )
}

export async function readNotificationLog(
  page: Page,
): Promise<NotificationEntry[]> {
  return page.evaluate((key) => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as NotificationEntry[]) : []
    } catch {
      return []
    }
  }, NOTIFICATION_LOG_KEY)
}

export async function clearNotificationLog(page: Page): Promise<void> {
  await page.evaluate(
    (key) => window.localStorage.removeItem(key),
    NOTIFICATION_LOG_KEY,
  )
}

export async function cleanupRun(
  page: Page,
  runId: string,
  subjectName: string,
): Promise<void> {
  await go(page, '공부 계획')
  await page.getByLabel('검색').fill(runId)
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const deletes = page.getByRole('button', { name: '계획 삭제' })
    const count = await deletes.count()
    if (count === 0) break
    page.once('dialog', (dialog) => {
      void dialog.accept()
    })
    await deletes.first().click()
    await expect(deletes).toHaveCount(count - 1)
  }

  await go(page, '공부 기록')
  await page.getByLabel('검색').fill(runId)
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const deletes = page.getByRole('button', { name: '기록 삭제' })
    const count = await deletes.count()
    if (count === 0) break
    page.once('dialog', (dialog) => {
      void dialog.accept()
    })
    await deletes.first().click()
    await expect(deletes).toHaveCount(count - 1)
  }

  await go(page, '과목 관리')
  const subjectCard = page.locator('article').filter({ hasText: subjectName })
  if ((await subjectCard.count()) > 0) {
    page.once('dialog', (dialog) => {
      void dialog.accept()
    })
    await subjectCard.getByRole('button', { name: '과목 보관' }).click()
  }
}
