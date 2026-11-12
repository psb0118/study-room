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

## 5. 학습 알림의 범위

현재 알림은 브라우저 Notification API를 사용하며 **앱을 열어둔 동안**만
동작합니다. 앱을 닫은 뒤의 푸시 알림은 Firebase Cloud Messaging과 서버 측
발송 작업이 필요하므로 이 저장소의 정적 배포만으로는 지원하지 않습니다.

## 6. 데이터 내보내기

- 학생·부모: 데이터 관리 화면에서 JSON 및 CSV를 내려받을 수 있습니다.
- 관리자: 사용자 목록을 CSV로 내려받을 수 있습니다.
- 부모는 현재 선택한 자녀의 데이터를 내보냅니다.
