# 스터디 룸 (Study Room)

실시간으로 함께 공부하는 웹 앱입니다. 포모도로 타이머를 방 단위로 공유하고, 화이트보드와 채팅으로 협업하며, 학습 시간은 자동으로 기록되어 스트릭이 쌓입니다.

## 기능

- **구글 로그인** (Firebase Auth) — 학습 기록은 계정에 저장
- **스터디 룸** — 6자리 코드로 생성/참가, 참가자 목록과 방장 표시
- **실시간 포모도로** — 집중/휴식 타이머를 방 전체가 공유 (시작·일시정지·건너뛰기·시간 조절)
- **화이트보드** — 펜/색상/굵기/지우개, 방 전체에 실시간 공유
- **채팅** — 실시간 메시지
- **학습 기록** — 오늘/누적 학습 시간, 연속 학습 스트릭, 최근 7일 그래프

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
| `npm test` | vitest 단위 테스트 (타이머/스트릭 로직) |
| `npm run preview` | 빌드 결과 미리보기 |

## Firebase 설정 (최초 1회)

기본값은 기존 프로젝트(`wordgame-8e201`)의 웹 앱 config를 공용합니다. 별도 프로젝트를 쓰려면 `.env` 파일로 덮어쓰세요.

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...   # Realtime Database URL 필수
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 1) Google 로그인 활성화

Firebase 콘솔 → **Authentication → Sign-in method → Google → 켜기**

### 2) Realtime Database 생성

Firebase 엨솔 → **Build → Realtime Database → Create database** (지역 선택, 테스트 모드 아님)

### 3) 보안 규칙 배포

```bash
npm i -g firebase-tools
firebase login
firebase use <프로젝트ID>
firebase deploy --only database,firestore:rules
```

규칙 파일: `firebase/database.rules.json`, `firebase/firestore.rules`

- Realtime DB: 로그인한 사용자만 방 읽기/쓰기, 채팅 500자·획 점수 수 제한
- Firestore: `studyUsers/{uid}` 는 본인만 접근

### 4) 호스트 도메인 확인

Auth 콘솔 → **Settings → Authorized domains** 에 배포 도메인 추가 (로컬호스트는 기본 포함).

## 구조

```
src/
  firebase.ts            Firebase 초기화 (Auth/RTDB/Firestore)
  types.ts               공용 타입
  hooks/
    useAuth.ts           로그인 상태
    useRoom.ts           방 참가·presence·타이머·채팅·화이트보드 동기화
  lib/
    pomodoro.ts          타이머 순수 로직 (상태 전이/잔여시간/진행률)
    streak.ts            스트릭/날짜 계산 순수 로직
    stats.ts             Firestore 학습 기록 (트랜잭션, 분 단위 중복 방지)
  components/
    Login / Lobby / Room / TimerPanel / Whiteboard / Chat / Members / Dashboard
firebase/
  database.rules.json    Realtime Database 보안 규칙
  firestore.rules        Firestore 보안 규칙
```

### 동기화 방식

- 방 데이터는 Realtime Database의 `rooms/{code}/` 아래에 `meta`, `timer`, `members`, `messages`, `board/strokes` 로 분리 저장
- 참가자는 `members/{uid}` 를 쓰고 `onDisconnect().remove()` 로 끊김 시 자동 제거 (presence)
- 타이머는 `endsAt`(epoch ms) 기준으로 각 클라이언트가 계산해 표시하고, 만료 시 방장(방장 부재 시 최초 참가자) 클라이언트가 다음 단계를 기록
- 학습 시간은 집중 상태에서 60초마다 Firestore 트랜잭션으로 기록 — 같은 분 안에는 한 번만 반영되어 여러 탭 중복 집계를 방지
- 참가자가 모두 빠져나가면 15초 후 방이 자동 삭제

## 트러블슈팅

| 증상 | 해결 |
|---|---|
| `auth/unauthorized-domain` | Auth → Authorized domains에 도메인 추가 |
| `Firebase: No Database URL` | Realtime Database를 생성하고 `databaseURL` 확인 |
| `Missing or insufficient permissions` | 보안 규칙 배포 확인 (`firebase deploy --only database,firestore:rules`) |
| 방에 들어가면 곧 "방이 종료" | 규칙/네트워크로 참가 정보 쓰기 실패 확인 |
