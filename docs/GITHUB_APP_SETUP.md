# GitHub App 설정 가이드

PR 기반 댓글 시스템을 사용하기 위해 GitHub App을 생성해야 합니다.

## 📋 1. GitHub App 생성

### 1-1. GitHub Settings 접속
1. GitHub 로그인
2. Settings → Developer settings → GitHub Apps
3. **"New GitHub App"** 버튼 클릭

URL: https://github.com/settings/apps/new

---

### 1-2. 기본 정보 입력

| 항목 | 값 | 설명 |
|------|-----|------|
| **GitHub App name** | `pr-comments-dev` | 원하는 이름 (고유해야 함) |
| **Homepage URL** | `http://localhost:3000` | 로컬 개발용 (나중에 Vercel URL로 변경) |
| **Callback URL** | `http://localhost:3000/api/oauth/authorized` | OAuth 콜백 URL |
| **Webhook** | ❌ **체크 해제** ("Active" 해제) | 웹훅 사용 안 함 |

---

### 1-3. 권한 설정 (Permissions)

**Repository permissions:**

| 권한 | 접근 수준 |
|------|----------|
| **Pull requests** | `Read & write` ✅ |
| **Issues** | `Read & write` ✅ |
| **Contents** | `Read & write` ✅ |

**User permissions:**
- (필요 없음)

---

### 1-4. 설치 위치 설정

**Where can this GitHub App be installed?**
- ✅ **"Only on this account"** 선택

---

### 1-5. App 생성 완료

**"Create GitHub App"** 버튼 클릭

---

## 🔑 2. 인증 정보 수집

App 생성 후 설정 페이지에서 다음 정보를 수집합니다.

### 2-1. App ID
- 페이지 상단에 표시됨
- 예: `123456`

### 2-2. Client ID
- "Client ID" 섹션에 표시됨
- 예: `Iv1.xxxxxxxxxxxx`

### 2-3. Client Secret
1. "Client secrets" 섹션에서 **"Generate a new client secret"** 클릭
2. 생성된 Secret 복사 (한 번만 표시됨!)
3. 안전한 곳에 저장

### 2-4. Private Key
1. 페이지 하단 "Private keys" 섹션으로 스크롤
2. **"Generate a private key"** 클릭
3. `.pem` 파일 다운로드
4. 파일 내용을 `.env.local`에 복사할 예정

---

## 📦 3. App 설치

### 3-1. Install App
1. 상단 탭에서 **"Install App"** 클릭
2. 본인 계정(또는 조직) 선택
3. **"Install"** 버튼 클릭

### 3-2. Repository 선택
- ✅ **"Only select repositories"** 선택
- `prwiki` 리포지토리 선택
- **"Install"** 클릭

---

## 🔐 4. 환경 변수 설정

### 4-1. `.env.local` 파일 생성

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 입력합니다:

```env
# GitHub App 정보
GITHUB_APP_ID=123456
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxx
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
여기에_private_key_파일_내용_붙여넣기
-----END RSA PRIVATE KEY-----"

# GitHub Bot Token (비로그인 댓글용)
# https://github.com/settings/tokens에서 생성
GITHUB_BOT_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Repository 정보
GITHUB_REPO_OWNER=gdgoc-konkuk
GITHUB_REPO_NAME=prwiki

# Auth 암호화 키 (아래 명령어로 생성)
AUTH_SECRET=생성한_64자_랜덤_문자열

# 사이트 URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 클라이언트에서 필요 (Public)
NEXT_PUBLIC_GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxx

# 토큰 유효 기간 (일 단위, 기본 7일)
TOKEN_VALIDITY_DAYS=7
```

---

### 4-2. Private Key 변환 (Windows)

Windows에서 `.pem` 파일을 한 줄로 변환:

**방법 1: PowerShell 사용**
```powershell
(Get-Content your-app.pem -Raw) -replace "`r`n", "\n"
```

**방법 2: 수동 변환**
1. `.pem` 파일을 텍스트 에디터로 열기
2. 전체 내용 복사
3. `.env.local`의 `GITHUB_PRIVATE_KEY` 값에 붙여넣기
4. 각 줄 끝에 `\n` 추가 (실제 줄바꿈은 제거)

---

### 4-3. Bot Token 생성

비로그인 사용자의 댓글 작성을 위한 Personal Access Token:

1. https://github.com/settings/tokens 접속
2. **"Tokens (classic)"** → **"Generate new token (classic)"** 클릭
3. Note: `PR Comments Bot`
4. Expiration: `No expiration` (또는 원하는 기간)
5. **Scopes 선택:**
   - ✅ `public_repo` (public repository에 액세스)
   - 또는 ✅ `repo` (private repository 포함)
6. **"Generate token"** 클릭
7. 생성된 토큰 복사 → `.env.local`의 `GITHUB_BOT_TOKEN`에 붙여넣기

---

### 4-4. AUTH_SECRET 생성

터미널에서 다음 명령어 실행:

```bash
openssl rand -base64 64
```

출력된 문자열을 `.env.local`의 `AUTH_SECRET`에 붙여넣기

---

## ✅ 5. 설정 확인

### 5-1. 환경 변수 확인

`.env.local` 파일이 다음과 같이 완성되었는지 확인:

- ✅ GITHUB_APP_ID (숫자)
- ✅ GITHUB_CLIENT_ID (Iv1.로 시작)
- ✅ GITHUB_CLIENT_SECRET (문자열)
- ✅ GITHUB_PRIVATE_KEY ("-----BEGIN RSA..." 전체 포함)
- ✅ GITHUB_BOT_TOKEN (ghp_로 시작)
- ✅ GITHUB_REPO_OWNER (리포지토리 소유자)
- ✅ GITHUB_REPO_NAME (리포지토리 이름)
- ✅ AUTH_SECRET (64자 랜덤 문자열)
- ✅ NEXT_PUBLIC_SITE_URL (로컬: http://localhost:3000)
- ✅ NEXT_PUBLIC_GITHUB_CLIENT_ID (클라이언트 ID 중복)

---

### 5-2. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 http://localhost:3000 접속

---

### 5-3. 로그인 테스트

1. 우측 상단 **"GitHub로 로그인"** 버튼 클릭
2. GitHub OAuth 승인 화면 확인
3. 승인 후 로그인 성공 확인

---

## 🚀 6. Vercel 배포 시

### 6-1. GitHub App 설정 업데이트

1. GitHub App 설정 페이지 접속
2. **Homepage URL** 변경: `https://your-domain.vercel.app`
3. **Callback URL** 변경: `https://your-domain.vercel.app/api/oauth/authorized`
4. **"Save changes"** 클릭

---

### 6-2. Vercel 환경 변수 설정

Vercel Dashboard → Project → Settings → Environment Variables

`.env.local`의 모든 환경 변수를 추가 (단, 값은 Production용으로 변경):

- `NEXT_PUBLIC_SITE_URL` → Vercel 도메인
- 나머지는 동일

---

## ⚠️ 주의사항

1. **`.env.local`은 절대 Git에 커밋하지 마세요!**
   - `.gitignore`에 포함되어 있음
   - `.env.example`만 커밋

2. **Private Key는 안전하게 보관하세요**
   - 유출 시 즉시 폐기하고 재생성

3. **Bot Token 권한 최소화**
   - Public repo만 사용 시: `public_repo`
   - Private repo 필요 시: `repo`

4. **Client Secret 재생성**
   - 유출 시 GitHub App 설정에서 재생성 가능

---

## 🎉 완료!

이제 PR 기반 댓글 시스템을 사용할 수 있습니다!

- ✅ GitHub 로그인 → 본인 이름으로 댓글 작성
- ✅ 비로그인 → Bot으로 익명 댓글 작성
- ✅ 댓글 수정/삭제 (본인만)
- ✅ 자동 PR 매칭 및 생성

---

## 📚 추가 정보

- [GitHub Apps 문서](https://docs.github.com/en/apps)
- [OAuth Apps vs GitHub Apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps)
- [Vercel 환경 변수](https://vercel.com/docs/projects/environment-variables)
