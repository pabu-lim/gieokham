# GIEOKHAM · 기억함

Keep your thoughts here. Focus on what matters.

기억할 것을 빠르고 효율적으로 기록하고, 중요한 일에 집중하세요.
개인용 메모·할 일 웹앱 서비스입니다.

## 주요 기능

- Google 로그인과 사용자별 Firebase Firestore 저장
- 빠른 입력, 카테고리, 5단계 중요도, 검색과 커스텀 드래그 정렬
- 오늘 할 일, 반복 일정, 완료 기록
- 선택적인 상세 메모와 변경 사항을 확인하는 닫기 동작
- JSON 백업 내보내기·불러오기
- 모바일 화면과 Android 홈 화면 설치(PWA)

## 로컬 실행

Node.js 22.13 이상과 pnpm 11.25.0을 사용합니다.

```sh
git clone https://github.com/pabu-lim/gieokham.git
cd gieokham
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm dev
```

개발 서버가 표시하는 주소를 엽니다(기본 포트 5173).
Google 로그인 개발 테스트에는 Firebase Authentication의 승인된 도메인에 `localhost`를 등록해야 합니다.

```sh
pnpm exec tsc --noEmit --incremental false
pnpm build
pnpm start
```

`pnpm start`는 빌드한 Worker의 로컬 미리보기입니다. 배포 명령이 아닙니다.

## Firebase

현재 앱은 기존 `girokham-1` 프로젝트를 사용합니다. 앱 이름을 기억함으로 바꿨지만 데이터 연속성을 위해 Firebase 프로젝트 ID는 유지합니다.
웹 클라이언트 설정은 `lib/firebase.ts`에 있습니다. 다른 Firebase 프로젝트로 복제한다면 이 설정을 해당 프로젝트의 웹 앱 설정으로 교체하세요.

- Authentication: Google 로그인 활성화, 사용하는 호스트 이름을 승인된 도메인에 추가
- Cloud Firestore: `users/{uid}/app/state` 문서에 사용자 상태 저장
- 접근 제어: 로그인한 사용자만 자신의 경로에 접근할 수 있도록 Firestore 규칙 설정

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

위 규칙은 운영 콘솔의 현재 설정을 자동으로 변경하지 않습니다. Firebase 웹 설정은 브라우저에 공개되는 클라이언트 식별 정보이며, 데이터 접근 권한은 Authentication과 Firestore 규칙으로 제어합니다. 서비스 계정 키나 관리자 인증 정보는 저장소에 넣지 마세요.

## 배포 상태

이 저장소는 현재 서비스의 소스 스냅샷입니다. GitHub의 코드를 변경하는 것만으로 기존 Sites 서비스가 자동 업데이트되지는 않습니다.

현재 빌드는 React + Vinext/Vite와 Cloudflare Worker 구조입니다. `dist/client`와 `dist/server`를 생성하므로 GitHub Pages에 소스만 올리는 방식으로는 실행되지 않습니다.
외부 호스팅으로 이전하려면 호스팅 연결과 배포 파이프라인을 별도로 설정해야 합니다. 새 주소를 정한 뒤 Firebase의 승인된 도메인에도 추가하세요.

## 소스 안내

- `app/page.tsx`: 메모 화면과 Firebase 동기화
- `lib/memory.ts`: 정렬, 반복 일정, 백업 검증 등 데이터 처리
- `lib/firebase.ts`: Firebase 클라이언트
- `components/install-app.tsx`, `public/`: PWA 설치와 아이콘, 오프라인 안내
- `build/`, `scripts/`, `.openai/hosting.json`: 기존 Sites/Vinext 빌드 기반
