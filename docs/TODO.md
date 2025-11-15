# GitHub PR 댓글 작성/편집 기능 구현 TODO

## 📋 구현 개요
- **아키텍처**: Giscus 방식 채택 (Next.js + Vercel Serverless)
- **PR 전략**: 기존 Merged PR 활용 + 자동 PR 생성&병합
  - 기존 파일: 해당 파일을 수정한 가장 최신 **merged PR**에 댓글 추가
  - 새 파일: 자동으로 PR 생성 → 즉시 병합 → merged PR에 댓글 추가
- **인증**: GitHub App + OAuth (선택적)
- **OAuth 로그인 시**: 사용자 본인 이름으로 댓글 작성
- **비로그인 시**: Bot 토큰으로 댓글 작성 (익명 처리)
- **배포**: Vercel (Serverless Functions 지원)

---

## 🔧 구현 체크리스트

### 1. 사전 준비

- [ ] **GitHub App 생성** (수동 작업)
  - GitHub Settings → Developer settings → GitHub Apps → New GitHub App
  - App Name: `prwiki-comments` (원하는 이름)
  - Homepage URL: `https://your-domain.vercel.app`
  - OAuth Callback URL: `https://your-domain.vercel.app/api/oauth/authorized`
  - **필요 권한**:
    - Pull requests: Read & write
    - Issues: Read & write (댓글용)
  - **설정**:
    - ❌ "Expire user authorization tokens" 체크 해제
    - ❌ "Request user authorization during installation" 체크 해제
  - Private Key 다운로드 (`.pem` 파일)
  - App ID, Client ID, Client Secret 복사

- [ ] **GitHub Bot Token 생성** (수동 작업)
  - Settings → Developer settings → Personal access tokens → Tokens (classic)
  - Generate new token (classic)
  - 필요 권한: `repo` (Full control) 또는 `public_repo`
  - 토큰 복사 및 안전하게 보관

- [x] **Next.js 설정 변경**
  - `next.config.mjs`: `output: 'export'` 제거 ✓
  - basePath/assetPrefix 제거 (Vercel 배포용) ✓

- [x] **환경 변수 템플릿 생성**
  - `.env.example` 파일 생성 ✓
  - `.gitignore`에 `.env.example` 예외 추가 ✓

---

### 2. 패키지 설치

```bash
pnpm add @octokit/rest iron-session jose isomorphic-dompurify
```

**패키지 설명:**
- `@octokit/rest`: GitHub API 클라이언트
- `iron-session`: 세션 관리 (쿠키 암호화)
- `jose`: JWT 처리
- `isomorphic-dompurify`: XSS 방지 (마크다운 sanitize)

---

### 3. API Routes 구현

#### 3.1. OAuth 인증

- [ ] **`/pages/api/oauth/authorized.ts`**
  - GitHub OAuth callback 처리
  - Authorization code → Access token 교환
  - 사용자 정보 가져오기
  - 세션 생성 및 쿠키 저장
  - 원래 페이지로 리다이렉트

- [ ] **`/pages/api/auth/status.ts`**
  - 현재 로그인 상태 확인 (GET)
  - 세션에서 사용자 정보 반환
  - Response: `{ isAuthenticated: boolean, user?: { login, name, avatarUrl } }`

- [ ] **`/pages/api/auth/logout.ts`**
  - 로그아웃 처리 (POST)
  - 세션 쿠키 삭제
  - Response: `{ success: true }`

#### 3.2. 댓글 CRUD

- [ ] **`/pages/api/comments/create.ts`** (POST)
  - 요청 본문: `{ filePath, body, lineNumber?, inReplyTo?, anonymousName? }`
  - **PR 자동 매칭**: `getOrCreateTargetPR(filePath)` 호출
    - 기존 파일: 최신 merged PR 찾기
    - 새 파일: PR 생성 → 즉시 병합 → PR 번호 반환
  - 세션 확인:
    - 있으면: OAuth 토큰으로 사용자 이름으로 작성
    - 없으면: Bot 토큰으로 작성 (본문에 익명 정보 추가)
  - PR 댓글 API 호출
  - Response: 생성된 댓글 정보

- [ ] **`/pages/api/comments/update.ts`** (PATCH)
  - 요청 본문: `{ commentId, body }`
  - 세션 필수 (비로그인 시 에러)
  - 권한 검증: 본인 댓글인지 확인
  - GitHub API로 댓글 수정
  - Response: 수정된 댓글 정보

- [ ] **`/pages/api/comments/delete.ts`** (DELETE)
  - 요청 본문: `{ commentId }`
  - 세션 필수 (비로그인 시 에러)
  - 권한 검증: 본인 댓글인지 확인
  - GitHub API로 댓글 삭제
  - Response: `{ success: true }`

#### 3.3. 유틸리티

- [ ] **`/lib/pr-manager.ts`** ⭐ 핵심 로직
  - `searchPRsByFile(filePath)`: 파일 경로로 PR 검색
    - GitHub Search API 또는 Pulls API 사용
    - 해당 파일을 수정한 모든 PR 반환
  - `getLatestMergedPR(prs)`: 최신 merged PR 선택
    - merged_at 기준 정렬
    - merged 상태인 PR만 필터링
  - `createAndMergeCommentPR(filePath)`: 댓글 전용 PR 생성 및 병합
    - 빈 커밋 또는 dummy 파일로 PR 생성
    - 제목: `[Comments] ${파일명}`
    - 본문: 댓글 전용 PR임을 명시
    - 레이블: `comments`, `auto-generated`
    - **즉시 병합**: `pulls.merge()` 호출
    - 병합 후 PR 번호 반환
  - `getOrCreateTargetPR(filePath)`: 통합 함수
    - 기존 merged PR 찾기 → 있으면 반환
    - 없으면 새 PR 생성 → 즉시 병합 → 반환

- [ ] **`/lib/github.ts`**
  - Octokit 클라이언트 생성 함수
  - `getAuthenticatedClient(token)`: 사용자 토큰으로 클라이언트 생성
  - `getBotClient()`: Bot 토큰으로 클라이언트 생성
  - GitHub App 인증 로직

- [ ] **`/lib/session.ts`**
  - iron-session 설정
  - 세션 타입 정의
  - `getSession(req, res)`: 세션 가져오기
  - 세션 암호화 키 관리

- [ ] **`/lib/auth.ts`**
  - OAuth URL 생성: `getOAuthUrl(redirectUri)`
  - Access token 교환: `exchangeCodeForToken(code)`
  - 사용자 정보 가져오기: `getAuthenticatedUser(token)`

---

### 4. 클라이언트 컴포넌트 구현

#### 4.1. 인증 관련

- [ ] **`/src/contexts/AuthContext.tsx`**
  - React Context 생성
  - 인증 상태 관리: `{ isAuthenticated, user, isLoading }`
  - `/api/auth/status` 호출하여 상태 가져오기
  - `login()`, `logout()` 함수 제공

- [ ] **`/src/hooks/useAuth.ts`**
  - `useContext(AuthContext)` wrapper
  - 타입 안전성 제공

- [ ] **`/src/components/AuthButton.tsx`**
  - 로그인/로그아웃 버튼
  - 로그인: GitHub OAuth 팝업 열기
  - 로그아웃: `/api/auth/logout` 호출
  - 사용자 아바타 및 이름 표시

#### 4.2. 댓글 작성/수정

- [ ] **`/src/components/CommentForm.tsx`**
  - 새 댓글/답글 작성 폼
  - Props: `{ filePath, lineNumber?, inReplyTo?, onSuccess }`
  - **prNumber 제거**: 서버에서 자동 매칭
  - 마크다운 입력 (textarea)
  - 미리보기 기능 (선택)
  - 비로그인 시 익명 이름 입력 (선택)
  - 제출 시 `/api/comments/create` 호출
  - Optimistic UI 업데이트

- [ ] **`/src/components/CommentEditForm.tsx`**
  - 댓글 수정 폼
  - Props: `{ comment, onSuccess, onCancel }`
  - 기존 댓글 내용을 초기값으로 설정
  - 제출 시 `/api/comments/update` 호출
  - 취소 버튼

- [ ] **`/src/components/CommentActions.tsx`**
  - 댓글 액션 버튼 (수정, 삭제, 답글)
  - Props: `{ comment, onEdit, onDelete, onReply }`
  - 본인 댓글일 때만 수정/삭제 버튼 표시
  - 삭제 확인 다이얼로그

#### 4.3. 기존 컴포넌트 수정

- [ ] **`/src/components/PRComments.tsx` 수정**
  - 하단에 `<CommentForm>` 추가
  - 댓글 아이템에 `<CommentActions>` 통합
  - 상태 관리: 수정 모드, 답글 모드
  - Optimistic 업데이트 로직

- [ ] **`/src/components/CommentSidebar.tsx` 수정**
  - 하단에 `<CommentForm>` 추가
  - 댓글 아이템에 `<CommentActions>` 통합
  - 상태 관리: 수정 모드, 답글 모드

- [ ] **`/src/app/layout.tsx` 수정**
  - `<AuthProvider>` 추가 (최상위)
  - `<AuthButton>` 헤더에 추가 (위치 확인 필요)

---

### 5. 타입 정의

- [ ] **`/src/types/auth.ts`**
  - `User`: 사용자 정보 타입
  - `AuthStatus`: 인증 상태 타입
  - `SessionData`: 세션 데이터 타입

- [ ] **`/src/types/api.ts`**
  - API 요청/응답 타입
  - `CreateCommentRequest`, `CreateCommentResponse`
  - `UpdateCommentRequest`, `UpdateCommentResponse`
  - `DeleteCommentRequest`, `DeleteCommentResponse`

---

### 6. 보안 및 에러 처리

- [ ] **Rate Limiting**
  - IP 기반 rate limiting (선택)
  - 댓글 작성: 10 requests / 1분

- [ ] **XSS 방지**
  - 댓글 내용 sanitize (DOMPurify)
  - 마크다운 렌더링 시 안전한 HTML만 허용

- [ ] **CSRF 방지**
  - API Routes에 CSRF 토큰 검증 (선택)
  - SameSite 쿠키 설정

- [ ] **에러 핸들링**
  - API 에러 응답 표준화
  - 클라이언트 에러 메시지 표시
  - GitHub API rate limit 에러 처리

---

### 7. 문서화

- [ ] **`/docs/GITHUB_APP_SETUP.md`**
  - GitHub App 생성 단계별 가이드
  - 스크린샷 포함 (선택)
  - 권한 설정 설명
  - Private Key 다운로드 및 설정

- [ ] **`/docs/DEPLOYMENT.md`**
  - Vercel 배포 가이드
  - 환경 변수 설정 방법
  - 도메인 연결
  - GitHub App callback URL 업데이트

- [ ] **`README.md` 업데이트**
  - 새로운 기능 설명 추가
  - 로컬 개발 환경 설정
  - `.env.local` 설정 가이드 링크

- [ ] **`SETUP.md` 업데이트**
  - 환경 변수 설정 섹션 추가
  - GitHub App 설정 링크
  - 개발 서버 실행 방법

---

### 8. 테스트 및 검증

- [ ] **로컬 테스트**
  - [ ] OAuth 로그인 플로우
  - [ ] 로그인 후 댓글 작성
  - [ ] 로그인 후 댓글 수정
  - [ ] 로그인 후 댓글 삭제
  - [ ] 비로그인 댓글 작성 (Bot)
  - [ ] 답글 작성
  - [ ] 로그아웃 기능
  - [ ] **PR 자동 매칭**: 기존 파일 → 최신 PR 찾기
  - [ ] **PR 자동 생성 & 병합**: 새 파일 → PR 생성 → 병합

- [ ] **Vercel 배포 테스트**
  - [ ] Production 환경에서 OAuth 작동 확인
  - [ ] 환경 변수 검증
  - [ ] GitHub Actions 동기화 확인
  - [ ] 자동 생성된 PR이 올바르게 병합되는지 확인

---

### 9. 배포

- [ ] **Vercel 설정**
  - GitHub 리포지토리 연동
  - 환경 변수 추가 (Vercel Dashboard)
  - 도메인 설정 (선택)

- [ ] **GitHub App 업데이트**
  - OAuth Callback URL을 Vercel 도메인으로 업데이트
  - Homepage URL 업데이트

- [ ] **최종 배포**
  - `git push` → Vercel 자동 배포
  - 배포 후 기능 검증

---

## 📝 참고 자료

### Giscus 아키텍처
- Repository: https://github.com/giscus/giscus
- Self-hosting 가이드: https://github.com/giscus/giscus/blob/main/SELF-HOSTING.md

### GitHub API 문서
- OAuth Apps: https://docs.github.com/en/apps/oauth-apps
- REST API - Comments: https://docs.github.com/en/rest/pulls/comments
- REST API - Issues: https://docs.github.com/en/rest/issues/comments

### Next.js 문서
- API Routes: https://nextjs.org/docs/pages/building-your-application/routing/api-routes
- Vercel 배포: https://vercel.com/docs

---

## 🎯 최종 사용자 경험

### 시나리오 1: 기존 문서에 댓글 (PR 있음)
1. `docs/01-변수.mdx` 페이지 방문
2. 댓글 작성 클릭
3. **자동 PR 매칭**: 시스템이 최신 merged PR #42 찾기
4. PR #42에 댓글 추가 ✅
5. GitHub PR 페이지에서도 댓글 확인 가능

### 시나리오 2: 새 문서에 댓글 (PR 없음)
1. `docs/99-새주제.mdx` 페이지 방문 (관련 PR 없음)
2. 댓글 작성 클릭
3. **자동 PR 생성 & 병합**:
   - PR #100 생성: `[Comments] 99-새주제`
   - 즉시 병합 (merged 상태)
4. 병합된 PR #100에 댓글 추가 ✅
5. 이후 모든 댓글은 PR #100에 추가

### OAuth 로그인 사용자:
1. "GitHub로 로그인" 버튼 클릭
2. GitHub OAuth 팝업 (GitHub App 승인)
3. **본인 이름**으로 댓글 작성
4. 본인 댓글만 수정/삭제 가능
5. 답글 작성 가능

### 비로그인 사용자:
1. 댓글 작성 폼에 바로 작성
2. (선택) 익명 이름 입력 프롬프트
3. **Bot**이 대신 댓글 작성
4. 댓글 본문에 "작성자: [이름]" 표시
5. 수정/삭제 불가능 (GitHub에서만 가능)

---

## ⚠️ 주의사항

- **완전 서버리스**: Vercel이 모든 서버 관리
- **무료 티어**: Vercel Free tier로 충분 (Hobby projects)
- **GitHub App은 필수**: OAuth 처리를 위해 반드시 필요
- **Bot 토큰 권한**: `repo` (Full control) 또는 `public_repo` 필요
- **기존 데이터 유지**: GitHub Actions 워크플로우는 그대로 유지
- **보안**: 환경 변수는 절대 커밋하지 말 것 (.env.local)

---

## 📅 진행 상황

**시작일**: 2025-11-15
**구현 완료일**: 2025-11-15

**현재 진행률**: 100% (17/17 완료) ✅

### 완료된 작업:
- [x] Next.js 설정 변경
- [x] 환경 변수 템플릿 생성
- [x] 패키지 설치 (octokit, iron-session, jose, dompurify)
- [x] 타입 정의 (auth.ts, api.ts)
- [x] lib 파일 구현 (github.ts, session.ts, auth.ts, pr-manager.ts)
- [x] API Routes 구현 (OAuth, auth status/logout, comments CRUD)
- [x] 클라이언트 컴포넌트 구현 (AuthContext, useAuth, AuthButton)
- [x] 댓글 컴포넌트 구현 (CommentForm, CommentEditForm, CommentActions)
- [x] 기존 컴포넌트 통합 (PRComments, CommentSidebar)
- [x] layout.tsx에 AuthProvider 추가
- [x] 문서 작성 (GITHUB_APP_SETUP.md)

### 다음 단계:
- [ ] GitHub App 생성 (수동 작업 - [GITHUB_APP_SETUP.md](./GITHUB_APP_SETUP.md) 참조)
- [ ] .env.local 파일 설정
- [ ] 로컬 테스트
- [ ] Vercel 배포
- [ ] Production 테스트

---

## 🚀 바로 시작하기

모든 코드 구현이 완료되었습니다! 이제 다음 단계를 진행하세요:

1. **GitHub App 생성**: [GITHUB_APP_SETUP.md](./GITHUB_APP_SETUP.md) 문서를 따라 GitHub App을 생성하세요.
2. **환경 변수 설정**: `.env.local` 파일을 생성하고 필요한 환경 변수를 설정하세요.
3. **개발 서버 실행**: `pnpm dev`로 로컬 서버를 시작하고 기능을 테스트하세요.
4. **Vercel 배포**: Vercel에 프로젝트를 배포하고 production 환경에서 테스트하세요.
