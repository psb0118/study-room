# 보안·운영 설정

이 문서는 코드만으로 끝낼 수 없는 Firebase 콘솔·GCP 작업을 정리합니다.
앱은 GitHub Pages의 정적 클라이언트이며, 아래 설정 전에는 기능이 제한됩니다.

## 1. App Check (선택이지만 권장)

App Check는 비정상적인 클라이언트의 Firestore/Realtime Database 호출을 줄입니다.

1. Firebase Console → **App Check** → 앱 등록에서 웹 앱을 선택합니다.
2. reCAPTCHA v3 제공업체를 선택하고 사이트 키를 발급합니다.
3. GitHub 저장소 → **Settings → Secrets and variables → Actions → Variables**에
   `VITE_RECAPTCHA_SITE_KEY`를 추가합니다.
4. `main`에 푸시해 Pages를 다시 배포합니다.
5. 앱에서 App Check 토큰이 정상 발급되는지 확인한 뒤, Firebase Console에서
   Firestore와 Realtime Database의 **Enforcement**를 켭니다.

로컬 개발에서 App Check를 켠 상태라면 Firebase의 App Check 디버그 토큰을
사용해야 할 수 있습니다. 운영 사이트 키를 소스에 직접 넣지 마세요.

## 2. 클라이언트 오류 모니터링

외부 DSN 없이 Firestore의 `appErrors` 컬렉션에 오류를 기록합니다.

- React 렌더링 오류: `AppErrorBoundary`
- 전역 오류: `window.error`, `unhandledrejection`
- 기록 항목: 메시지, 스택, 발생 위치, 브라우저 정보, 사용자 uid, 시각
- 로그인한 사용자만 로그를 만들 수 있고, 관리자(Google 로그인)만 읽을 수 있습니다.
- 관리자 화면의 **최근 클라이언트 오류** 카드에서 최근 30건을 확인합니다.
- 로그에는 URL·스택 등 개인정보가 포함될 수 있으므로 관리자만 열람하세요.

규칙을 게시하지 않으면 오류 로그 저장과 관리자 조회가 모두 거부됩니다.

## 3. Firestore 백업·복원

Firestore export/import는 **Blaze 요금제**와 Cloud Storage 버킷이 필요합니다.
아래 명령은 예시이며, 운영 데이터에 import하기 전에 별도 프로젝트에서 복원을
연습하세요.

```bash
# 프로젝트와 버킷 이름을 실제 값으로 바꾸세요.
gcloud config set project study-room-d0c89
gcloud firestore export \
  gs://YOUR_BACKUP_BUCKET/firestore/$(date +%Y%m%d-%H%M) \
  --project=study-room-d0c89
```

복원:

```bash
gcloud firestore import \
  gs://YOUR_BACKUP_BUCKET/firestore/20261111-0300 \
  --project=study-room-d0c89
```

권장 운영 방식:

- Cloud Scheduler + Cloud Run/Cloud Functions로 매일 export
- 버킷 수명 주기로 30~90일 보관
- 복원 권한은 관리자에게만 부여
- 복원 전 현재 데이터를 한 번 더 export
- `firebase/firestore.rules`도 Git 커밋으로 함께 보관

## 4. 관리자 Google 전용 로그인

관리자 화면은 이메일이 `soundpsb1@gmail.com`이면서 **Google 로그인 세션**인
경우에만 열립니다. Firestore 규칙도 `sign_in_provider == 'google.com'`을
확인합니다.

- Google 계정에 2단계 인증을 설정하세요.
- 기존 이메일/비밀번호 로그인 세션은 관리자 권한이 없습니다.
- 관리자 이메일을 바꾸려면 `src/lib/admin.ts`와 Firestore 규칙의 `isAdmin()`을
  함께 수정하고 다시 배포해야 합니다.

## 5. 백그라운드 학습 알림

알림은 두 단계로 동작합니다.

- **로컬 알림**: 앱을 열어둔 동안 `useStudyReminder`가 브라우저 Notification을
  표시합니다. FCM 기기를 등록하기 전의 기존 동작입니다.
- **백그라운드 알림**: FCM 웹 푸시 기기 토큰을 등록하면 Cloud Functions의
  `sendStudyReminders`가 5분마다 실행되어 앱을 닫아도 알림을 보냅니다.
- **일정 시작 알림**: `sendPlanReminders`가 5분마다 시작 시간이 있는 계획을
  확인해 정시 또는 설정한 분 전에 알림을 보냅니다.

서버 발송을 켜려면 다음이 필요합니다.

1. Firebase 프로젝트를 **Blaze 요금제**로 전환합니다.
2. **Cloud Messaging → Web Push certificates**에서 VAPID 키 쌍을 만들고 공개 키를
   GitHub Actions 변수 `VITE_FCM_VAPID_KEY`로 설정합니다.
3. 최신 Firestore 규칙을 배포합니다. 기기 토큰은
   `studyUsers/{uid}/devices/{tokenHash}`에만 저장되며 본인만 읽고 쓸 수 있습니다.
4. `functions/`에서 `npm ci && npm run build` 후
   `firebase deploy --only functions`를 실행합니다.
5. 앱에서 **백그라운드 알림 켜기**를 눌러 브라우저 권한을 허용합니다.

운영 기준:

- 함수는 `asia-northeast3`에서 5분마다 실행되며, 사용자별
  `reminderTimezone`과 `reminderTime`으로 로컬 시간을 계산합니다.
- `lastReminderKey`로 하루 한 번만 발송합니다.
- 일정 시작 알림은 `planReminderEnabled`, `planReminderOffsetMinutes`,
  계획의 `plannedDate`·`startTime`으로 계산합니다.
- `planReminderDeliveries`의 결정적 문서 ID로 같은 계획의 중복 발송을 막습니다.
  서버만 생성·수정하고 본인은 읽기·계정 정리용 삭제만 할 수 있습니다.
- 계획이 `completed`이거나 시작 시간이 비어 있으면 일정 알림을 보내지 않습니다.
- `accountStatus == 'suspended'`인 계정과 기기 토큰이 없는 계정은 제외합니다.
- 만료된 FCM 토큰은 발송 결과에서 확인해 기기 문서를 삭제합니다.
- 알림 본문에는 민감한 학습 내용을 넣지 않습니다.
- 함수 로그에 FCM 토큰 원문을 남기지 않습니다.
- iPhone은 iOS 16.4 이상에서 홈 화면에 설치한 PWA에서만 웹 푸시를 받을 수
  있습니다.

> GitHub Pages 배포와 Cloud Functions 배포는 별개입니다. Pages 워크플로우는
> 정적 클라이언트만 올리며, Functions는 Firebase CLI/GCP 권한이 있는 사람이
> 배포해야 합니다.

## 6. PWA 설치

- `public/manifest.webmanifest`와 `public/icons/`가 설치 정보를 제공합니다.
- Android Chrome은 설치 가능 조건을 만족하면 앱 안의 **앱 설치** 버튼 또는
  브라우저 메뉴에서 설치할 수 있습니다.
- iPhone Safari는 공유 → **홈 화면에 추가**를 사용합니다.
- 설치는 HTTPS(또는 localhost)에서만 동작하며, 서비스 워커가 등록되어야 합니다.
- 설치형 PWA는 스토어 업로드 없이 홈 화면에서 독립 창으로 실행됩니다.

## 7. 데이터 내보내기

- 학생·부모: 데이터 관리 화면에서 JSON 및 CSV를 내려받을 수 있습니다.
- 관리자: 사용자 목록을 CSV로 내려받을 수 있습니다.
- 부모는 현재 선택한 자녀의 데이터를 내보냅니다.
