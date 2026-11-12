# Playwright 브라우저 테스트

`planner.spec.ts`는 실제 브라우저에서 여섯 기능을 순서대로 클릭합니다.
테스트는 하나의 학생 계정을 사용하며, 실행할 때마다 `E2E <실행 ID>`로 시작하는
데이터를 만들고 마지막에 정리를 시도합니다.

## 준비

```bash
npm install
npx playwright install chromium
# Linux에서 libnspr4/libnss3 오류가 나면 (sudo 권한 필요)
sudo npx playwright install-deps chromium
```

학생 역할의 **테스트 전용 이메일/비밀번호 계정**이 필요합니다. 실제 학습
데이터가 있는 계정은 사용하지 마세요. Firestore 규칙은 저장소의 최신
`firebase/firestore.rules`가 배포되어 있어야 합니다.

## 실행

기본 대상은 라이브 사이트입니다.

```bash
E2E_EMAIL='test-student@example.com' \
E2E_PASSWORD='test-password' \
npm run test:e2e
```

로컬 개발 서버를 대상으로 하려면:

```bash
npm run dev -- --host 127.0.0.1 --port 5173
E2E_BASE_URL='http://127.0.0.1:5173/' \
E2E_EMAIL='test-student@example.com' \
E2E_PASSWORD='test-password' \
npm run test:e2e
```

선택 환경 변수:

| 변수 | 기본값 | 설명 |
|---|---|---|
| `E2E_EMAIL` | 없음 | 학생 테스트 계정 이메일 |
| `E2E_PASSWORD` | 없음 | 테스트 계정 비밀번호 |
| `E2E_BASE_URL` | `https://psb0118.github.io/study-room/` | 테스트할 앱 주소 |
| `E2E_TIMEZONE` | `Asia/Seoul` | 날짜·시각 계산에 쓸 IANA 시간대 |

`E2E_EMAIL`/`E2E_PASSWORD`는 저장소나 `playwright.config.ts`에 넣지 마세요.
CI에서는 저장소 Secrets로 주입합니다.

## 테스트가 확인하는 것

1. `서버 준비 중` 상태와 로컬 일정 알림 켜기·새로고침 유지
2. 계획 시작 시각의 로컬 알림 호출, 본문, 새로고침 후 중복 방지
3. 계획 카드 `집중` → 중간 종료 기록 → 1분 완주·계획 완료
4. 밀린 계획 개별 `오늘로`와 `모두 오늘로`
5. JSON 내보내기 파일 검증 → 제목 수정 → 복원 → 잘못된 파일 거부
6. 주간 회고의 완료율·공부 시간·연속 학습·이후 계획 표시

## 한계

- **운영체제 알림 자체는 검증하지 않습니다.** Chromium headless에서는
  알림 버블을 확인할 수 없어서, 테스트가 `Notification`과
  `ServiceWorkerRegistration.showNotification` 호출을 가로채 예약·본문·중복을
  검증합니다. 실제 알림 센터 표시는
  [브라우저 테스트 절차](../docs/browser-test-checklist.md)의 2번을 수동으로
  확인하세요.
- VAPID 키가 설정된 빌드에서는 로컬 알림 테스트 1·2가 건너뛰어집니다. 서버
  알림은 Blaze 요금제와 Functions 배포가 필요합니다.
- 테스트는 직렬로 실행되며 알림 대기·1분 타이머 때문에 약 4분 정도 걸립니다.
- 테스트 계정에 남은 데이터를 정리하지 못하면 마지막에 경고를 출력합니다.
  이때는 계정에서 `E2E`로 시작하는 계획·기록을 직접 삭제하세요.

## 실패했을 때

`test-results/`와 `playwright-report/`에 스크린샷·trace가 남습니다.

```bash
npx playwright show-report
```

자주 확인할 것:

- `E2E_EMAIL` 계정이 **학생** 역할인지
- Firebase 이메일/비밀번호 로그인이 활성화되어 있는지
- 라이브 사이트의 Firestore 규칙이 최신인지
- 브라우저 알림 권한이 아니라 테스트가 주입한 알림 spy가 로드됐는지
- 테스트 실행 중 탭이 닫히지 않았는지
