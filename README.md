# 스터디 룸 (Study Room)

실시간으로 함께 공부하는 웹 앱입니다. 포모도로 타이머를 방 단위로 공유하고, 화이트보드와 채팅으로 협업합니다. 개인 공부 플래너(과목·계획·기록·통계·주간 시간표)도 같은 앱에 통합되어 있어 혼자 계획을 세우고 함께 집중한 뒤 기록으로 확인할 수 있습니다.

## 핵심 기능

### 1) 실시간 스터디 룸

- **구글 로그인** (Firebase Auth)
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
- **기기 간 동기화** — 로그인한 계정의 Firestore에 저장

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

### 1) Google 로그인 활성화

Firebase 콘솔 → **Authentication → Sign-in method → Google → 켜기**

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
- **Firestore**: `studyUsers/{uid}` 문서와 그 하위 컬렉션(`subjects`, `plans`, `records`)은 본인만 접근

> 플래너 데이터는 `studyUsers/{uid}/subjects|plans|records` 하위 컬렉션에 저장됩니다. 기존 규칙을 사용 중이라면 위 명령으로 Firestore 규칙을 반드시 다시 배포해야 플래너가 동작합니다.

### 4) 호스트 도메인 확인

Auth 콘솔 → **Settings → Authorized domains** 에 배포 도메인 추가 (로컬호스트는 기본 포함).

## 구조

```
src/
  firebase.ts            Firebase 초기화 (Auth/RTDB/Firestore)
  types.ts               공용 타입 (룸 + 플래너)
  hooks/
    useAuth.ts           로그인 상태
    useRoom.ts           방 참가·presence·타이머·채팅·화이트보드 동기화
    usePlanner.ts        과목·계획·기록 실시간 구독과 CRUD
  lib/
    pomodoro.ts          타이머 순수 로직 (상태 전이/잔여시간/진행률)
    streak.ts            스트릭/날짜 계산 순수 로직
    planner.ts           플래너 날짜/필터/통계/검증 순수 로직
    stats.ts             프로필 부트스트랩, 스터디 룸 집중 기록
  components/
    AppShell             사이드바·모바일 하단 내비게이션
    Login / Dashboard / Lobby / Room
    TimerPanel / Whiteboard / Chat / Members
    Plans / Subjects / Records / Stats / Schedule
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
  - `subjects/{subjectId}` — 이름, 색상, 보관 여부
  - `plans/{planId}` — 과목, 제목, 날짜, 시간, 목표 분, 우선순위, 상태, 메모
  - `records/{recordId}` — 과목, 연결 계획, 날짜 키, 시작/종료, 공부 시간, 출처(room/manual)
  - 스터디 룸 집중 기록은 `records/room-YYYY-MM-DD` 문서에 하루 단위로 누적되며, 같은 분 중복 집계를 막습니다.
- 모든 통계는 `records` 원본에서 계산되어 계획·기록·통계가 서로 어긋나지 않습니다.

## 트러블슈팅

| 증상 | 해결 |
|---|---|
| `auth/unauthorized-domain` | Auth → Authorized domains에 도메인 추가 |
| `Firebase: No Database URL` | Realtime Database를 생성하고 `databaseURL` 확인 |
| `Missing or insufficient permissions` (플래너) | `firebase deploy --only firestore:rules`로 하위 컬렉션 규칙 배포 |
| 화이트보드 저장 거부 | Firebase 콘솔 RTDB 규칙에 최신 `database.rules.json` 게시 |
| 방에 들어가면 곧 "방이 종료" | 규칙/네트워크로 참가 정보 쓰기 실패 확인 |
