# 스터디 룸 (Study Room)

실시간으로 함께 공부하는 웹 앱입니다. 포모도로 타이머를 방 단위로 공유하고, 화이트보드와 채팅으로 협업합니다. 중학생을 위한 개인 공부 플래너(과목·계획·기록·통계·주간 시간표), 집중 타이머, 반복 계획, 포인트·레벨과 주간 리그, 부모 연결 기능도 함께 들어 있습니다. 계획을 완료하면 포인트가 쌓이고, 부모님은 6자리 연결 코드로 자녀의 일정을 관리할 수 있습니다.

## 핵심 기능

### 1) 실시간 스터디 룸

- **이메일/구글 로그인** (Firebase Auth)
- **스터디 룸** — 6자리 코드로 생성/참가, 참가자 목록과 방장 표시, 끊김 시 자동 제거
- **실시간 포모도로** — 집중/휴식 타이머를 방 전체가 공유 (시작·일시정지·건너뛰기·시간 조절)
- **화이트보드** — 펜/색상/굵기/지우개, 방 전체에 실시간 공유, 크게 보기
- **채팅** — 실시간 메시지 (500자 제한, 최근 250개 유지)
- **자동 기록** — 집중 중 60초마다 공부 기록이 쌓입니다.

### 2) 개인 공부 플래너

- **과목 관리** — 색상 지정, 보관/복원, 과목별 누적 시간
- **공부 계획** — 추가/수정/삭제, 기간·과목·상태 필터, 우선순위, 목표 시간, 진행 상태
- **공부 기록** — 스터디 룸 자동 기록 + 직접 기록(과목·날짜·시간·계획 연결·메모)
- **통계** — 기간별 총 공부 시간, 공부한 날, 과목별 비중, 목표 달성률, 최근 7일 그래프
- **주간 시간표** — 월요일 시작 주간 뷰, 이전/다음 주 이동
- **집중 타이머** — 계획 카드에서 최대 60분 개인 타이머를 실행하고, 집중 시간을 공부 기록으로 저장합니다. 타이머를 끝까지 채우면 계획도 완료됩니다.
- **반복 계획·빠른 루틴** — 요일과 종료일을 골라 최대 31개의 계획을 한 번에 만들고, 수학·영어·국어 루틴을 버튼 하나로 추가합니다.
- **기기 간 동기화** — 로그인한 계정의 Firestore에 저장

### 3) 포인트와 부모 연결

- **포인트** — 완료한 계획의 목표 시간에 따라 10~40P 지급 (10분 15P, 30분 25P, 60분 이상 40P)
- **레벨** — 100P마다 상승. 새싹 → 탐험가 → 성실왕 → 집중 마스터 → 전설
- **포인트 순위** — 로그인한 사용자 상위 20명을 실시간으로 비교
- **주간 리그와 닉네임** — 월요일마다 새로 시작하는 주간 포인트 순위와 전체 순위를 탭으로 비교합니다. 순위표에는 실명 대신 닉네임을 사용할 수 있습니다.
- **부모 연결** — 학생이 만든 6자리 코드를 부모 계정에 입력. 부모는 자녀 일정 추가·삭제·완료 취소와 진도 확인 가능
- **부모 다자녀·주간 리포트** — 여러 자녀를 각각 연결하고 상단 선택기로 전환합니다. 자녀별 이번 주 완료율, 공부 시간, 연속 학습, 놓친 계획을 한눈에 확인합니다.
- **역할 구분** — 학생/부모 계정을 따로 만들고, 연결된 자녀 데이터만 공유

### 4) 데이터 관리와 오프라인

- **데이터 내보내기** — 현재 계정(부모는 선택한 자녀)의 프로필·과목·계획·기록을 JSON 또는 CSV로 저장합니다. 네트워크를 다시 호출하지 않아 오프라인에서도 내보낼 수 있습니다.
- **주간 목표** — 과목별 주간 공부 시간 목표를 설정하고 이번 주 기록과 비교합니다. 부모 화면에서도 자녀의 목표 달성률을 볼 수 있습니다.
- **백그라운드 학습 알림** — 브라우저 알림 권한과 FCM 기기 등록을 마치면, 앱을 닫아도 설정한 시간에 공부 알림을 받습니다. Cloud Functions가 사용자 시간대 기준으로 5분마다 발송합니다.
- **공부 일정 시작 알림** — 시작 시간이 있는 공부 계획은 정시·5분 전·10분 전·15분 전·30분 전에 맞춰 알림을 받습니다. 앱을 닫아도 동작하며, 계획 완료·삭제·정지 계정은 자동으로 제외됩니다. 알림 서버가 준비되기 전에는 앱을 열어둔 동안 로컬 알림으로 동작합니다.
- **계획에서 바로 집중** — 공부 계획 카드에서 집중 타이머를 열어 바로 기록을 시작할 수 있습니다.
- **밀린 계획 정리** — 지난 날짜의 미완료 계획을 오늘로 옮기거나 한 번에 모두 옮길 수 있습니다.
- **JSON 복원** — 내보낸 JSON 백업에서 과목·계획·기록을 검증해 다시 가져옵니다. 프로필은 덮어쓰지 않습니다.
- **주간 회고** — 이번 주 완료율, 공부 시간, 연속 학습, 가장 많이 공부한 과목, 다음 주로 이어갈 계획을 확인합니다.
- **PWA 설치** — Android Chrome에서는 설치 버튼으로, iPhone Safari에서는 공유 → 홈 화면에 추가로 스토어 없이 앱처럼 설치할 수 있습니다.
- **계정 삭제** — 비밀번호 또는 Google 재인증과 확인 문구를 거친 뒤 프로필, 플래너 데이터, 가족 연결 코드, 순위표·주간 리그 항목을 정리하고 Auth 계정을 삭제합니다. 부모 계정 삭제 시 자녀의 학습 데이터는 유지됩니다.
- **오프라인 지원** — Firestore 영구 캐시로 마지막 데이터를 읽고 변경을 대기열에 저장하며, 서비스 워커가 앱 셸과 해시된 JS/CSS를 캐시합니다. 오프라인 중에는 상단에 상태 안내가 표시되고, 연결이 돌아오면 저장 내용이 자동 동기화됩니다.

## 실행 방법

```bash
npm install
npm run dev        # http://localhost:5173
```

| 스크립트 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (HMR) |
| `npm run build` | 프로덕션 빌드 (`dist/`) |
| `npm run lint` | oxlint |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm test` | vitest 단위 테스트 (타이머/스트릭/플래너 로직) |
| `npm run preview` | 빌드 결과 미리보기 |

브라우저에서 일정 알림·집중 타이머·밀린 계획·JSON 복원·주간 회고를 직접
확인하려면 [브라우저 테스트 절차](docs/browser-test-checklist.md)를 참고하세요.

## Firebase 설정 (최초 1회)

기본값은 `study-room-d0c89` 프로젝트의 웹 앱 config를 사용합니다. 다른 프로젝트를 쓰려면 `.env` 파일로 덮어쓰세요.

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...   # Realtime Database URL 필수 (DB 루트 URL)
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
# 선택: Firebase App Check reCAPTCHA v3 사이트 키
VITE_RECAPTCHA_SITE_KEY=...
# 백그라운드 알림: Cloud Messaging → Web Push certificates의 공개 키
VITE_FCM_VAPID_KEY=...
```

### 1) 로그인 활성화

Firebase 콘솔 → **Authentication → Sign-in method**에서 아래를 켭니다.

- **Email/Password** — 학생·부모 이메일 계정 (필수)
- **Google** — 간편 로그인 (선택)

> 이메일 로그인을 켜지 않으면 `auth/operation-not-allowed` 오류가 납니다. 관리자 계정은 Google 로그인만 허용됩니다.

### 2) Realtime Database 생성

Firebase 콘솔 → **Build → Realtime Database → Create database** (지역 선택, 테스트 모드 아님)

### 3) 보안 규칙 배포

```bash
npm i -g firebase-tools
firebase login
firebase use <프로젝트ID>
firebase deploy --only database,firestore:rules
```

규칙 파일: `firebase/database.rules.json`, `firebase/firestore.rules`

- **Realtime DB**: 로그인한 사용자만 방 읽기/쓰기, 채팅 500자·획 점 수 제한
- **Firestore**: 학생은 본인 데이터에 접근하고, 연결된 부모는 자녀의 프로필·계획·기록을 읽고 계획을 추가·삭제·완료 취소할 수 있습니다. 관리자 이메일은 전체 프로필을 읽고 다른 계정의 이용 상태 필드(`accountStatus`, `statusReason`)만 변경할 수 있습니다. 가족 코드와 공개 포인트 순위·주간 리그 규칙도 포함되며, 학생/연결된 부모는 순위표 항목을 삭제할 수 있습니다.

> 플래너 데이터는 `studyUsers/{uid}/subjects|plans|records` 하위 컬렉션에 저장됩니다. 부모 연결, 관리자 기능, 오류 로그를 사용하려면 이 저장소의 최신 `firebase/firestore.rules`를 반드시 배포해야 합니다. 기존 규칙만 배포된 상태에서는 `Missing or insufficient permissions`가 발생할 수 있습니다.
>
> App Check, 오류 모니터링, Firestore 백업, 관리자 Google 전용 로그인 설정은 [보안·운영 문서](docs/security-and-operations.md)를 참고하세요.

#### Firestore 규칙·Functions 자동 배포 (서비스 계정)

`firebase/firestore.rules`, `functions/**`, `firebase.json`이 `main`에 푸시되면
GitHub Actions가 배포합니다. `FIREBASE_TOKEN` 대신 **GCP 서비스 계정 키**를
사용합니다.

1. Google Cloud Console → **IAM 및 관리자 → 서비스 계정 → 서비스 계정 만들기**에서
   배포용 계정(예: `firebase-deployer`)을 만듭니다.
2. 프로젝트 IAM에서 다음 역할을 부여합니다.
   - `Cloud Functions Admin` (`roles/cloudfunctions.admin`)
   - `Service Account User` (`roles/iam.serviceAccountUser`)
   - `Cloud Scheduler Admin` (`roles/cloudscheduler.admin`)
   - `Firebase Rules Admin` (`roles/firebaserules.admin`)
   - 필요하면 `Storage Admin` (`roles/storage.admin`)
   - 간단히 시작하려면 `Firebase Admin`을 추가해도 되지만, 운영에서는 최소 권한을
     권장합니다.
3. 서비스 계정 → **키 → 키 추가 → JSON**으로 키를 만들고 JSON 파일을 내려받습니다.
4. GitHub 저장소 → **Settings → Secrets and variables → Actions → New repository
   secret**에서 이름을 `GCP_SA_KEY`로 하고, JSON 파일의 **내용 전체**를 붙여넣습니다.
   가능하면 JSON을 한 줄로 압축해 붙여넣으세요. 파일 자체나 키를 저장소에
   커밋하지 마세요.
5. **최초 1회**는 Actions → **Deploy Firestore Rules**와 **Deploy Cloud Functions**를
   각각 **Run workflow**로 실행합니다. 이후에는 관련 파일을 `main`에 푸시하면
   자동 실행됩니다.

다른 Firebase 프로젝트를 사용한다면 저장소 변수 `FIREBASE_PROJECT_ID`를 설정하세요.
기본값은 `study-room-d0c89`입니다. `GCP_SA_KEY`가 없으면 두 워크플로우는 배포를
건너뜁니다.

> 서비스 계정 키는 장기 자격 증명입니다. GitHub Secret으로만 보관하고, 노출이
> 의심되면 키를 즉시 삭제·재발급하세요. 가능하면 Workload Identity Federation
> 또는 짧은 수명의 자격 증명으로 전환하는 것이 더 안전합니다.

### 4) 백그라운드 학습 알림 (Blaze 필요)

Cloud Functions와 Cloud Scheduler를 쓰려면 Firebase 프로젝트를 **Blaze 요금제**로
전환해야 합니다. 정적 GitHub Pages 배포만으로는 서버 알림이 켜지지 않습니다.

1. Firebase Console → **Cloud Messaging → Web Push certificates**에서 키 쌍을
   생성하고 **공개 키**를 복사합니다.
2. GitHub 저장소 → **Settings → Secrets and variables → Actions → Variables**에
   `VITE_FCM_VAPID_KEY`를 추가합니다. 이 값은 클라이언트 공개 키이며 비밀값은
   아닙니다.
3. 최신 Firestore 규칙을 배포합니다. `studyUsers/{uid}/devices` 규칙이 없으면
   기기 등록이 `Missing or insufficient permissions`로 실패합니다.
4. 함수를 배포합니다.

   GitHub Actions를 사용하려면 `GCP_SA_KEY` Secret을 등록한 뒤
   Actions → **Deploy Cloud Functions** → **Run workflow**를 실행합니다.

   로컬에서 직접 배포하려면 서비스 계정 JSON을 지정합니다.

   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
   cd functions
   npm ci
   npm run build
   cd ..
   npx firebase-tools deploy --only functions --project study-room-d0c89
   ```

5. `main`에 푸시해 Pages를 다시 배포한 뒤, 학생 화면의 **주간 목표 → 학습 알림**에서
   **백그라운드 알림 켜기**를 누릅니다. 브라우저 알림 권한을 허용해야 합니다.
6. 같은 화면의 **일정 시작 알림**을 켜고 알림 시점을 고릅니다. 시작 시간이 있는
   공부 계획마다 해당 시점에 알림이 발송됩니다.
7. iPhone은 iOS 16.4 이상에서 **Safari → 공유 → 홈 화면에 추가**로 설치한 PWA에서만
   웹 푸시를 받을 수 있습니다.

배포되는 함수는 `functions/src/index.ts`의 `sendStudyReminders`와
`sendPlanReminders`입니다. 둘 다 `asia-northeast3`에서 5분마다 실행됩니다.
`sendStudyReminders`는 각 사용자의 `reminderTimezone`과 `reminderTime`을 비교해
하루 한 번만 발송하고, `sendPlanReminders`는 `plannedDate`·`startTime`과
`planReminderOffsetMinutes`를 비교해 계획별로 한 번 발송합니다. 정지된 계정과
기기 토큰이 없는 사용자는 건너뜁니다.

> `public/push-sw.js`에는 기본 Firebase 프로젝트 설정이 들어 있습니다. 다른
> Firebase 프로젝트를 쓴다면 `src/firebase.ts`와 `public/push-sw.js`의 설정을
> 함께 맞춰야 합니다. 서비스 계정 키는 저장소에 넣지 마세요.
>
> `main`에 `functions/**` 또는 `firebase.json` 변경이 푸시되면
> **Deploy Cloud Functions** 워크플로우가 실행됩니다. `GCP_SA_KEY` Secret이
> 없으면 배포를 건너뛰고, Secret이 있어도 Blaze 요금제가 아니면 배포가 실패합니다.

### 5) 호스트 도메인 확인

Auth 콘솔 → **Settings → Authorized domains** 에 배포 도메인 추가 (로컬호스트는 기본 포함).

## 관리자 계정

관리자 이메일은 **`soundpsb1@gmail.com`** 입니다.

- 이 이메일로 로그인하면 학생·부모 화면 대신 관리자 화면이 열립니다.
- 전체 사용자, 학생·부모 수, 부모 계정에 연결된 자녀 수를 확인할 수 있습니다.
- **전체 / 이용 중 / 이용 정지** 상태 필터로 사용자를 나눠 볼 수 있습니다.
- 사용자별 **이용 중 / 이용 정지** 상태를 전환할 수 있습니다. 정지할 때 사유를 입력하며, 사유는 관리자 목록과 정지된 사용자의 안내 화면에 표시됩니다. 정지된 계정은 학습 데이터에 접근하지 못합니다.
- 관리자는 자기 자신의 상태를 정지할 수 없고, 프로필의 다른 내용이나 학습 데이터는 수정·삭제할 수 없습니다.
- 관리자 판별은 `src/lib/admin.ts`와 `firebase/firestore.rules`의 `isAdmin()`에 함께 설정되어 있습니다. 이메일을 바꾸려면 두 곳을 같이 수정해야 합니다.
- 관리자 화면은 Google 로그인 세션에서만 열립니다. 이메일/비밀번호 세션은 관리자 권한이 없습니다.
- 관리자 사용자 목록과 오류 로그를 읽으려면 최신 Firestore 규칙을 반드시 배포해야 합니다. 자동 배포 Secret이 없다면 Firebase 콘솔 → Firestore → Rules에서 `firebase/firestore.rules` 내용을 붙여넣고 게시하세요.

## 구조

```
src/
  firebase.ts            Firebase 초기화 (Auth/RTDB/Firestore)
  types.ts               공용 타입 (룸 + 플래너 + 프로필 + 포인트)
  hooks/
    useAuth.ts           이메일/구글 로그인, 회원가입, 비밀번호 재설정
    useProfile.ts        역할 선택, 가족 코드, 부모-자녀 연결
    useRoom.ts           방 참가·presence·타이머·채팅·화이트보드 동기화
    usePlanner.ts        과목·계획·기록 실시간 구독과 CRUD
    usePointsSync.ts     완료 계획에서 포인트를 계산해 순위표에 동기화
    useLeaderboard.ts    전체/주간 상위 20명과 내 순위 구독
    useOnlineStatus.ts   브라우저 온라인/오프라인 상태
    useAdminUsers.ts     관리자 사용자 목록 조회·계정 상태 변경
    useAdminErrors.ts    관리자 오류 로그 조회
    useStudyReminder.ts  앱이 열린 동안 로컬 학습 알림 예약
    usePlanReminders.ts  앱이 열린 동안 일정 시작 로컬 알림 예약
    useForegroundPush.ts FCM 포그라운드 알림 표시
  lib/
    accountStatus.ts     계정 이용 상태 정규화·라벨
    admin.ts             관리자 이메일·Google 로그인 판별
    goals.ts             주간 목표 정규화·달성률
    reminders.ts         다음 알림 시각 계산
    planReminder.ts      일정 시작 알림 시점 정규화·라벨
    csv.ts               CSV 직렬화·다운로드
    errorLog.ts          관리자 전용 클라이언트 오류 로그
    pomodoro.ts          타이머 순수 로직 (상태 전이/잔여시간/진행률)
    streak.ts            스트릭/날짜 계산 순수 로직
    planner.ts           플래너 날짜/필터/통계/검증 순수 로직
    points.ts            완료 포인트/레벨/칭호 계산
    profile.ts           프로필 기본값, 가족 코드, 기본 과목
    exportData.ts        JSON 내보내기 번들·파일명·가져오기 검증
    account.ts           재인증 후 계정·가족·학습 데이터 삭제
    weeklyKeys.ts        계정 삭제 시 정리할 주간 리그 키
    errors.ts            Firebase 오류 한국어 메시지
    push.ts              FCM 권한·기기 토큰 등록·해제
    notifications.ts     모바일/데스크톱 브라우저 알림 표시
    installPrompt.ts     PWA 설치 이벤트 보관
    timeZone.ts          IANA 시간대 검증
    stats.ts             프로필 부트스트랩, 스터디 룸 집중 기록
  components/
    AppShell             역할별 사이드바·모바일 하단 내비게이션
    Login / RoleSetup / Dashboard / Lobby / Room
    Family / Leaderboard / ParentHome / PointsCard
    DataSettings / OfflineNotice / AppErrorBoundary
    Goals / ErrorMonitor (Admin 내부)
    InstallPrompt        PWA 설치 버튼·iOS 안내
    TimerPanel / Whiteboard / Chat / Members
    FocusTimer / Plans / Subjects / Records / Stats / Schedule
    ui                   공통 카드·모달·입력·탭·차트
public/
  sw.js                 오프라인 앱 셸 서비스 워커
  push-sw.js            FCM 백그라운드 푸시 서비스 워커 (별도 scope)
  manifest.webmanifest  PWA 매니페스트
  icons/                PWA·홈 화면 아이콘
functions/
  src/index.ts          sendStudyReminders·sendPlanReminders 예약 함수
  src/reminders.ts      하루 한 번 학습 알림 대상 조회·중복 방지
  src/planReminders.ts  계획 시작 알림 대상 조회·중복 방지
  src/planTime.ts       계획 날짜·시작 시각·알림 시점 계산
  src/push.ts           FCM 멀티캐스트·만료 토큰 정리
  src/time.ts           시간대·알림 시간 계산
firebase/
  database.rules.json    Realtime Database 보안 규칙
  firestore.rules        Firestore 보안 규칙
```

## 데이터 저장

- **Realtime Database**: `rooms/{code}/` 아래 `meta`, `timer`, `members`, `messages`, `board/strokes`
  - 참가자는 `members/{uid}`를 쓰고 `onDisconnect().remove()`로 끊김 시 자동 제거
  - 타이머는 `endsAt`(epoch ms) 기준으로 각 클라이언트가 계산하고, 만료 시 방장(부재 시 최초 참가자)이 다음 단계 기록
  - 참가자가 모두 나가면 15초 후 방 자동 삭제
- **Firestore**: `studyUsers/{uid}` 프로필 + 하위 컬렉션
  - Firestore 영구 캐시를 사용해 온라인에서 본 데이터와 대기 중인 변경을 기기에 보관합니다. 서비스 워커는 앱 셸과 해시된 정적 자산을 캐시합니다.
  - `studyUsers/{uid}` — 이름, 닉네임, 이메일, 역할(student/parent), `familyCode`, `childUid`, `childUids`, `childNames`, `accountStatus`(active/suspended), `statusReason`(정지 사유), `weeklyGoals`(과목별 주간 목표), `reminderEnabled`, `reminderTime`, `reminderTimezone`, `pushEnabled`, `planReminderEnabled`, `planReminderOffsetMinutes`, `lastReminderKey`, `lastReminderAt`
  - `studyUsers/{uid}/devices/{tokenHash}` — FCM 웹 푸시 기기 토큰, 브라우저 정보, 등록·확인 시각
  - `studyUsers/{uid}/planReminderDeliveries/{deliveryKey}` — 일정 알림의 계획·날짜·시작 시각·발송 상태·기기 수. 서버만 만들고 수정하며 본인은 읽고 삭제할 수 있습니다.
  - JSON 가져오기는 과목·계획·기록만 같은 ID로 덮어쓰거나 추가하며, 프로필·가족 연결·순위표는 건드리지 않습니다.
  - `subjects/{subjectId}` — 이름, 색상, 보관 여부
  - `plans/{planId}` — 과목, 제목, 날짜, 시간, 목표 분, 우선순위, 상태, `completedAt`(완료 시각), 메모
  - `records/{recordId}` — 과목, 연결 계획, 날짜 키, 시작/종료, 공부 시간, 출처(room/manual)
  - `appErrors/{errorId}` — 관리자만 읽는 클라이언트 오류 로그 (메시지·스택·URL·사용자 uid)
  - `familyCodes/{code}` — 학생이 만든 6자리 연결 코드
  - `families/{studentUid}/parents/{parentUid}` — 부모 연결 문서
  - `leaderboard/{uid}` — 공개 이름·사진·포인트·레벨 요약
  - `weeklyLeaderboards/{weekKey}/entries/{uid}` — 월요일 시작 주차별 포인트·레벨 요약
  - 스터디 룸 집중 기록은 `records/room-YYYY-MM-DD` 문서에 하루 단위로 누적되며, 같은 분 중복 집계를 막습니다.
- 포인트는 완료된 `plans` 원본에서 계산되어 완료/취소를 반복해도 중복 지급되지 않습니다. 모든 통계는 `records` 원본에서 계산됩니다.

## 트러블슈팅

| 증상 | 해결 |
|---|---|
| `auth/unauthorized-domain` | Auth → Authorized domains에 도메인 추가 |
| `auth/operation-not-allowed` | Authentication → Sign-in method → Email/Password 사용 설정 |
| `Firebase: No Database URL` | Realtime Database를 생성하고 `databaseURL` 확인 |
| `Missing or insufficient permissions` (플래너) | `firebase deploy --only firestore:rules`로 최신 Firestore 규칙 배포 |
| 관리자 화면에서 이용 정지·재개가 안 돼요 | 최신 `firebase/firestore.rules`를 게시했고, 정지 사유를 입력했는지 확인 |
| 관리자 화면이 Google 로그인 안내만 보여요 | `soundpsb1@gmail.com`으로 Google 로그인했는지 확인 |
| 오류 로그가 비어 있어요 | 관리자 Google 세션인지, 최신 Firestore 규칙이 게시됐는지 확인 |
| 부모 연결 코드를 찾을 수 없어요 | 자녀가 코드를 만들었는지, 최신 Firestore 규칙이 배포됐는지 확인 |
| 포인트 순위가 비어 있어요 | 계획을 완료한 뒤 순위표 동기화를 기다리고, 로그인/규칙 상태 확인 |
| 주간 순위가 비어 있어요 | 최신 Firestore 규칙을 배포한 뒤, 이번 주 계획을 완료하고 동기화를 기다려 주세요 |
| 백그라운드 알림이 오지 않아요 | 알림 권한 허용, `VITE_FCM_VAPID_KEY` 설정, Functions 배포, Firestore `devices` 규칙, Blaze 요금제를 확인하세요. iPhone은 홈 화면에 설치한 PWA에서만 동작합니다 |
| 일정 시작 알림이 오지 않아요 | **주간 목표 → 일정 시작 알림**이 켜져 있는지, 계획에 시작 시간이 있는지, `planReminderOffsetMinutes`가 맞는지 확인하세요. 계획 완료·삭제 상태이거나 Functions 배포 전이면 발송되지 않습니다 |
| 앱 설치 버튼이 보이지 않아요 | HTTPS(또는 localhost)로 접속하고, `manifest.webmanifest`와 서비스 워커가 로드되는지 확인하세요. iPhone Safari는 공유 → 홈 화면에 추가를 사용합니다 |
| 오프라인에서 앱이 열리지 않아요 | 프로덕션 빌드로 한 번 이상 접속해 서비스 워커를 등록하고, 브라우저 사이트 데이터를 지우지 마세요 |
| 계정 삭제가 `requires-recent-login`으로 실패해요 | 로그아웃 후 다시 로그인하거나, 이메일 계정은 비밀번호를 정확히 입력하고 Google 계정은 재인증 창을 완료해 주세요 |
| 화이트보드 저장 거부 | Firebase 콘솔 RTDB 규칙에 최신 `database.rules.json` 게시 |
| 방에 들어가면 곧 "방이 종료" | 규칙/네트워크로 참가 정보 쓰기 실패 확인 |
