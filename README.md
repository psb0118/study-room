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
```

### 1) 로그인 활성화

Firebase 콘솔 → **Authentication → Sign-in method**에서 아래를 켭니다.

- **Email/Password** — 학생·부모 이메일 계정 (필수)
- **Google** — 간편 로그인 (선택)

> 이메일 로그인을 켜지 않으면 `auth/operation-not-allowed` 오류가 납니다.

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
- **Firestore**: 학생은 본인 데이터에 접근하고, 연결된 부모는 자녀의 프로필·계획·기록을 읽고 계획을 추가·삭제·완료 취소할 수 있습니다. 가족 코드와 공개 포인트 순위·주간 리그 규칙도 포함되며, 학생/연결된 부모는 순위표 항목을 삭제할 수 있습니다.

> 플래너 데이터는 `studyUsers/{uid}/subjects|plans|records` 하위 컬렉션에 저장됩니다. 부모 연결과 포인트 순위를 사용하려면 이 저장소의 최신 `firebase/firestore.rules`를 반드시 배포해야 합니다. 기존 규칙만 배포된 상태에서는 `Missing or insufficient permissions`가 발생할 수 있습니다.

#### Firestore 규칙 자동 배포 (선택)

`firebase/firestore.rules` 또는 `firebase.json`이 `main`에 푸시되면 GitHub Actions가 Firestore 규칙을 자동 배포합니다.

1. 로컬에서 CI 토큰을 발급합니다.

   ```bash
   npx firebase-tools login:ci
   ```

2. GitHub 저장소 → **Settings → Secrets and variables → Actions → New repository secret**에서 `FIREBASE_TOKEN` 이름으로 토큰을 저장합니다.

3. **최초 1회**는 Actions → **Deploy Firestore Rules** → **Run workflow**를 실행해 현재 규칙을 배포합니다. 워크플로우 파일을 추가한 커밋만으로는 실행되지 않습니다.

4. 이후 규칙 파일을 수정해 `main`에 푸시하면 자동으로 배포됩니다.

다른 Firebase 프로젝트를 사용한다면 저장소 변수 `FIREBASE_PROJECT_ID`를 설정하세요. 기본값은 `study-room-d0c89`입니다.

> `FIREBASE_TOKEN`은 Firebase 계정 권한을 가진 비밀값입니다. 저장소 Secret으로만 보관하고, 노출이 의심되면 `firebase login:ci`로 재발급해 교체하세요.

### 4) 호스트 도메인 확인

Auth 콘솔 → **Settings → Authorized domains** 에 배포 도메인 추가 (로컬호스트는 기본 포함).

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
  lib/
    pomodoro.ts          타이머 순수 로직 (상태 전이/잔여시간/진행률)
    streak.ts            스트릭/날짜 계산 순수 로직
    planner.ts           플래너 날짜/필터/통계/검증 순수 로직
    points.ts            완료 포인트/레벨/칭호 계산
    profile.ts           프로필 기본값, 가족 코드, 기본 과목
    errors.ts            Firebase 오류 한국어 메시지
    stats.ts             프로필 부트스트랩, 스터디 룸 집중 기록
  components/
    AppShell             역할별 사이드바·모바일 하단 내비게이션
    Login / RoleSetup / Dashboard / Lobby / Room
    Family / Leaderboard / ParentHome / PointsCard
    TimerPanel / Whiteboard / Chat / Members
    FocusTimer / Plans / Subjects / Records / Stats / Schedule
    ui                   공통 카드·모달·입력·탭·차트
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
  - `studyUsers/{uid}` — 이름, 닉네임, 이메일, 역할(student/parent), `familyCode`, `childUid`, `childUids`, `childNames`
  - `subjects/{subjectId}` — 이름, 색상, 보관 여부
  - `plans/{planId}` — 과목, 제목, 날짜, 시간, 목표 분, 우선순위, 상태, `completedAt`(완료 시각), 메모
  - `records/{recordId}` — 과목, 연결 계획, 날짜 키, 시작/종료, 공부 시간, 출처(room/manual)
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
| 부모 연결 코드를 찾을 수 없어요 | 자녀가 코드를 만들었는지, 최신 Firestore 규칙이 배포됐는지 확인 |
| 포인트 순위가 비어 있어요 | 계획을 완료한 뒤 순위표 동기화를 기다리고, 로그인/규칙 상태 확인 |
| 주간 순위가 비어 있어요 | 최신 Firestore 규칙을 배포한 뒤, 이번 주 계획을 완료하고 동기화를 기다려 주세요 |
| 화이트보드 저장 거부 | Firebase 콘솔 RTDB 규칙에 최신 `database.rules.json` 게시 |
| 방에 들어가면 곧 "방이 종료" | 규칙/네트워크로 참가 정보 쓰기 실패 확인 |
