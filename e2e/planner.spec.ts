import { readFileSync, writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import {
  addDays,
  cleanupRun,
  clearNotificationLog,
  createPlan,
  dateKey,
  editPlanTitle,
  ensureSubject,
  go,
  installNotificationSpy,
  planCard,
  readNotificationLog,
  reminderCard,
  RUN_ID,
  signIn,
  timeKey,
} from './helpers'

const subjectName = `E2E ${RUN_ID}`
const notificationPlan = `E2E ${RUN_ID} 알림`
const partialTimerPlan = `E2E ${RUN_ID} 타이머 중간`
const completeTimerPlan = `E2E ${RUN_ID} 타이머 완주`
const overdueA = `E2E ${RUN_ID} 밀린 A`
const overdueB = `E2E ${RUN_ID} 밀린 B`

test.describe.configure({ mode: 'serial' })

test.describe('하루결 플래너 여섯 기능', () => {
  test.beforeEach(async ({ page }) => {
    await installNotificationSpy(page)
    await signIn(page)
  })

  test.afterAll(async ({ browser }) => {
    const configuredBaseUrl =
      process.env.E2E_BASE_URL ?? 'https://psb0118.github.io/study-room/'
    const context = await browser.newContext({
      baseURL: configuredBaseUrl.endsWith('/')
        ? configuredBaseUrl
        : `${configuredBaseUrl}/`,
      locale: 'ko-KR',
      timezoneId: process.env.E2E_TIMEZONE ?? 'Asia/Seoul',
      permissions: ['notifications'],
    })
    try {
      const page = await context.newPage()
      await signIn(page)
      await cleanupRun(page, RUN_ID, subjectName)
    } catch (error) {
      console.warn(
        'E2E 테스트 데이터 정리에 실패했습니다. 테스트 계정에서 E2E 항목을 직접 삭제하세요.',
        error,
      )
    } finally {
      await context.close()
    }
  })

  test('1. 알림 준비 상태와 로컬 알림 설정', async ({ page }) => {
    await ensureSubject(page, subjectName)
    await go(page, '주간 목표')

    const card = reminderCard(page)
    const localMode =
      (await card
        .getByText('서버 준비 중', { exact: true })
        .isVisible()
        .catch(() => false)) ||
      (await card
        .getByText('로컬 알림 켜짐', { exact: true })
        .isVisible()
        .catch(() => false))

    test.skip(
      !localMode,
      'VAPID 키가 설정된 빌드입니다. 서버 알림은 Blaze·Functions 배포 후 수동으로 확인하세요.',
    )

    const toggle = card.getByLabel('일정 시작 알림 받기')
    const wasEnabled = await toggle.isChecked()
    if (!wasEnabled) {
      await toggle.check()
      await expect(
        card.getByText(/앱을 열어둔 동안 일정 알림을 켰어요/),
      ).toBeVisible()
    }

    await expect(
      card.getByText('로컬 알림 켜짐', { exact: true }),
    ).toBeVisible()

    await page.reload()
    await expect(
      page.getByRole('button', { name: '공부 계획', exact: true }).first(),
    ).toBeVisible({ timeout: 30_000 })
    await go(page, '주간 목표')
    await expect(
      reminderCard(page).getByText('로컬 알림 켜짐', { exact: true }),
    ).toBeVisible()
  })

  test('2. 앱을 열어둔 동안 일정 시작 로컬 알림', async ({ page }) => {
    test.setTimeout(240_000)

    await go(page, '주간 목표')
    const card = reminderCard(page)
    const localMode =
      (await card
        .getByText('서버 준비 중', { exact: true })
        .isVisible()
        .catch(() => false)) ||
      (await card
        .getByText('로컬 알림 켜짐', { exact: true })
        .isVisible()
        .catch(() => false))
    test.skip(
      !localMode,
      'VAPID 키가 설정된 빌드에서는 이 로컬 알림 테스트를 실행하지 않습니다.',
    )

    const startAt = new Date(Date.now() + 2 * 60_000)
    test.skip(
      dateKey(startAt) !== dateKey(),
      '자정 직전에는 로컬 일정 알림 테스트를 실행할 수 없습니다.',
    )

    const freshCard = reminderCard(page)
    const toggle = freshCard.getByLabel('일정 시작 알림 받기')
    if (!(await toggle.isChecked())) await toggle.check()

    const offset = freshCard.getByLabel('알림 시점')
    if ((await offset.inputValue()) !== '0') {
      await offset.selectOption('0')
      await expect(
        freshCard.getByText(/알림 시점을 시작 시각로 저장했어요/),
      ).toBeVisible()
    }

    await clearNotificationLog(page)
    await createPlan(page, {
      subjectName,
      title: notificationPlan,
      date: dateKey(),
      targetMinutes: 1,
      startTime: timeKey(startAt),
    })
    await go(page, '주간 목표')
    await expect(
      reminderCard(page).getByText('로컬 알림 켜짐', { exact: true }),
    ).toBeVisible()

    const planEntries = async () =>
      (await readNotificationLog(page)).filter((entry) =>
        entry.body.includes(notificationPlan),
      )

    await expect.poll(
      async () => (await planEntries()).length,
      {
        message: '계획 시작 시각에 로컬 알림 호출이 기록되어야 합니다.',
        timeout: 150_000,
      },
    ).toBeGreaterThan(0)

    const entries = await planEntries()
    expect(entries).toHaveLength(1)
    expect(entries[0].title).toBe('하루결 공부 알림')
    expect(entries[0].body).toContain(timeKey(startAt))

    await page.reload()
    await expect(
      page.getByRole('button', { name: '공부 계획', exact: true }).first(),
    ).toBeVisible({ timeout: 30_000 })
    await page.waitForTimeout(3_000)
    expect(await planEntries()).toHaveLength(1)
  })

  test('3. 계획 카드에서 집중 타이머 시작과 기록', async ({ page }) => {
    await createPlan(page, {
      subjectName,
      title: partialTimerPlan,
      date: dateKey(),
      targetMinutes: 1,
    })

    const partialCard = planCard(page, partialTimerPlan)
    await partialCard.getByRole('button', { name: '집중', exact: true }).click()
    const partialDialog = page.getByRole('dialog', { name: '집중 타이머' })
    await expect(partialDialog).toBeVisible()
    await expect(partialDialog.getByText('01:00')).toBeVisible()

    await partialDialog
      .getByRole('button', { name: '집중 시작', exact: true })
      .click()
    await expect(
      partialDialog.getByRole('button', { name: '일시정지', exact: true }),
    ).toBeVisible()
    await page.waitForTimeout(2_000)
    await partialDialog
      .getByRole('button', { name: '일시정지', exact: true })
      .click()
    await partialDialog
      .getByRole('button', { name: '그만하기', exact: true })
      .click()
    await expect(
      partialDialog.getByText(
        '1분 집중을 기록했어요. 계획은 아직 완료 전이에요.',
      ),
    ).toBeVisible({ timeout: 20_000 })
    await partialDialog
      .getByRole('button', { name: '닫기', exact: true })
      .click()

    await go(page, '공부 기록')
    await expect(
      page.getByText(`집중 타이머 · ${partialTimerPlan}`).first(),
    ).toBeVisible()

    await createPlan(page, {
      subjectName,
      title: completeTimerPlan,
      date: dateKey(),
      targetMinutes: 1,
    })
    const completeCard = planCard(page, completeTimerPlan)
    await completeCard.getByRole('button', { name: '집중', exact: true }).click()
    const completeDialog = page.getByRole('dialog', { name: '집중 타이머' })
    await completeDialog
      .getByRole('button', { name: '집중 시작', exact: true })
      .click()
    await expect(
      completeDialog.getByText(
        '1분 집중을 기록하고 계획을 완료했어요.',
      ),
    ).toBeVisible({ timeout: 90_000 })
    await completeDialog
      .getByRole('button', { name: '닫기', exact: true })
      .click()
    await expect(
      planCard(page, completeTimerPlan).getByText('완료', { exact: true }),
    ).toBeVisible()
  })

  test('4. 밀린 계획을 오늘로 옮기기', async ({ page }) => {
    const yesterday = addDays(dateKey(), -1)
    await createPlan(page, {
      subjectName,
      title: overdueA,
      date: yesterday,
      targetMinutes: 10,
    })
    await createPlan(page, {
      subjectName,
      title: overdueB,
      date: yesterday,
      targetMinutes: 20,
    })

    await expect(page.getByText(/개의 밀린 계획이 있어요/)).toBeVisible()

    const cardA = planCard(page, overdueA)
    await cardA.getByRole('button', { name: '오늘로', exact: true }).click()
    await expect(
      cardA.getByRole('button', { name: '오늘로', exact: true }),
    ).toHaveCount(0)

    await page
      .getByRole('button', { name: '모두 오늘로', exact: true })
      .click()
    await expect(
      planCard(page, overdueB).getByRole('button', {
        name: '오늘로',
        exact: true,
      }),
    ).toHaveCount(0)

    await page.getByLabel('기간').selectOption('today')
    await expect(planCard(page, overdueA)).toBeVisible()
    await expect(planCard(page, overdueB)).toBeVisible()
  })

  test('5. JSON 내보내기와 복원', async ({ page }) => {
    await go(page, '부모님 연결')
    await expect(
      page.getByRole('heading', { name: '데이터 관리', exact: true }),
    ).toBeVisible()

    const exportButton = page.getByRole('button', {
      name: 'JSON으로 내보내기',
      exact: true,
    })
    await expect(exportButton).toBeEnabled()
    const downloadPromise = page.waitForEvent('download')
    await exportButton.click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.json$/)
    const backupPath = test.info().outputPath('backup.json')
    await download.saveAs(backupPath)

    const backup = JSON.parse(readFileSync(backupPath, 'utf8')) as {
      app: string
      version: number
      subjects: unknown[]
      plans: unknown[]
      records: unknown[]
    }
    expect(backup.app).toBe('하루결')
    expect(backup.version).toBe(1)
    expect(backup.plans.length).toBeGreaterThan(0)

    await editPlanTitle(page, overdueA, `${overdueA} 수정`)
    await expect(planCard(page, `${overdueA} 수정`)).toBeVisible()

    await go(page, '부모님 연결')
    const importButton = page.getByRole('button', {
      name: 'JSON 가져오기',
      exact: true,
    })
    await expect(importButton).toBeVisible()

    const chooserPromise = page.waitForEvent('filechooser')
    page.once('dialog', (dialog) => {
      void dialog.accept()
    })
    await importButton.click()
    const chooser = await chooserPromise
    await chooser.setFiles(backupPath)
    await expect(
      page.getByText(/\d+개 항목을 가져왔어요\./),
    ).toBeVisible({ timeout: 30_000 })

    await go(page, '공부 계획')
    await expect(planCard(page, overdueA)).toBeVisible()
    await expect(planCard(page, `${overdueA} 수정`)).toHaveCount(0)

    await go(page, '부모님 연결')
    const invalidPath = test.info().outputPath('invalid.json')
    writeFileSync(
      invalidPath,
      JSON.stringify({ app: '다른 앱', version: 1 }),
      'utf8',
    )
    await page.locator('input[type="file"]').setInputFiles(invalidPath)
    await expect(
      page.getByText('하루결 JSON 백업 파일이 아니에요.', { exact: true }),
    ).toBeVisible()
  })

  test('6. 주간 회고 카드', async ({ page }) => {
    await go(page, '통계', '공부 통계')

    const review = page.locator('section').filter({
      has: page.getByRole('heading', { name: '이번 주 회고', exact: true }),
    })
    await expect(review).toBeVisible()
    await expect(review.getByText(/\d+\/\d+ 완료/)).toBeVisible()
    await expect(review.getByText('완료율', { exact: true })).toBeVisible()
    await expect(
      review.getByText('이번 주 공부', { exact: true }),
    ).toBeVisible()
    await expect(review.getByText('연속 학습', { exact: true })).toBeVisible()
    await expect(
      review.getByText('다음 주로 이어갈 계획', { exact: true }),
    ).toBeVisible()
    await expect(review.getByText(subjectName).first()).toBeVisible()
  })
})
