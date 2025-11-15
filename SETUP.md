# PR 댓글 시스템 설정 가이드

이 문서는 GitHub PR 댓글 자동 표시 기능의 설정 가이드입니다.

## ⚡ 핵심 특징

이 프로젝트는 **완전 정적 사이트**로 빌드되어 GitHub Pages에 배포됩니다.
- ✅ Next.js API 라우트 없음
- ✅ 모든 PR 데이터는 빌드 타임에 JSON 파일로 생성
- ✅ 클라이언트에서 정적 JSON 파일만 로드
- ✅ 간단하고 빠름

## 1. GitHub Actions 권한 설정

### 1.1 Workflow 권한 확인

1. Repository **Settings** > **Actions** > **General**로 이동
2. **Workflow permissions** 섹션에서:
   - **Read and write permissions** 선택
   - **Allow GitHub Actions to create and approve pull requests** 체크
3. **Save** 클릭

### 1.2 자동 커밋 설정 (선택사항)

PR 데이터가 자동으로 커밋되지 않는 경우, branch protection rules를 확인하세요:

1. **Settings** > **Branches**
2. `main` 브랜치의 protection rules 확인
3. `github-actions[bot]`이 직접 커밋할 수 있도록 예외 설정 필요 시 추가

## 2. 데이터 디렉토리 생성

처음 실행 시 다음 디렉토리가 자동으로 생성됩니다:

```
src/data/
└── prs/              # PR 데이터 저장
```

수동으로 생성하려면:

```bash
mkdir -p src/data/prs
```

## 3. 로컬 개발 환경 설정

### 3.1 의존성 설치

```bash
pnpm install
```

### 3.2 PR 데이터 생성 (빌드 전 필수)

빌드하기 전에 PR 데이터를 생성해야 합니다:

```bash
# GitHub 토큰과 함께 실행 (권장)
GITHUB_TOKEN=your_token_here pnpm prebuild

# 또는 토큰 없이 실행 (이미 저장된 PR 데이터만 사용)
pnpm prebuild
```

이 명령은 다음 작업을 수행합니다:
1. **GitHub API에서 merged PR 데이터 동기화** (GITHUB_TOKEN이 있는 경우)
   - 모든 merged된 PR을 GitHub에서 가져옵니다
   - 로컬에 없는 PR만 `src/data/prs/` 디렉토리에 저장합니다
2. **정적 JSON 파일 생성**
   - `src/data/prs/*.json` 파일을 읽어서 `public/data/` 디렉토리에 생성:
   - `prs-recent.json` - 모든 PR 목록
   - `prs-by-file.json` - 파일별 PR 매핑

**GitHub Token 설정 방법:**
```bash
# 개인 액세스 토큰 생성: https://github.com/settings/tokens
# 필요 권한: repo (또는 public_repo)
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
# 또는
export GH_TOKEN=ghp_xxxxxxxxxxxxx
```

### 3.3 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 `http://localhost:3000` 접속

**참고**: 개발 모드에서는 `/data/*.json` 파일이 `public/` 디렉토리에 있어야 합니다.

### 3.4 PR 데이터 테스트 (선택사항)

실제 PR 없이 테스트하려면 `src/data/prs/` 디렉토리에 샘플 JSON 파일 생성:

```json
// src/data/prs/pr-1.json
{
  "pr": {
    "number": 1,
    "state": "open",
    "title": "테스트 PR",
    "body": "PR 설명",
    "user": {
      "login": "username",
      "avatar_url": "https://github.com/username.png",
      "html_url": "https://github.com/username"
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "html_url": "https://github.com/gdgoc-konkuk/25-26-study-js-deep-dive/pull/1",
    "merged": false,
    "additions": 100,
    "deletions": 50,
    "changed_files": 3
  },
  "comments": [],
  "reviewComments": [],
  "reviews": [],
  "files": [
    {
      "filename": "src/content/04장 변수/A.mdx",
      "status": "modified",
      "additions": 50,
      "deletions": 10,
      "changes": 60
    }
  ],
  "lastUpdated": "2024-01-01T00:00:00Z"
}
```

## 4. 배포

### 4.1 빌드 프로세스

빌드 시 다음 순서로 진행됩니다:

1. `pnpm prebuild` - PR 데이터 JSON 생성
2. `next build` - Next.js 정적 사이트 빌드
3. `pagefind` - 검색 인덱스 생성

전체 빌드:
```bash
pnpm build:search
```

### 4.2 자동 배포

`main` 브랜치에 푸시하면 자동으로 배포됩니다:

```bash
git add .
git commit -m "feat: update content"
git push origin main
```

GitHub Actions가 자동으로:
1. PR 데이터 생성
2. 사이트 빌드
3. GitHub Pages에 배포

### 4.3 수동 배포 (gh-pages)

```bash
pnpm deploy
```

## 5. 기능 확인

### 5.1 PR 댓글 표시 확인

1. PR을 생성하거나 기존 PR에 댓글 추가
2. 몇 분 후 GitHub Actions workflow 완료 확인
3. 배포된 사이트 확인:
   - 상단 배너에 최근 PR 표시
   - `/prs` 페이지에서 PR 목록 확인
   - 챕터 페이지 하단에 관련 PR 댓글 표시

## 6. 트러블슈팅

### PR 데이터가 업데이트되지 않음

- GitHub Actions 탭에서 workflow 실행 로그 확인
- Workflow permissions이 올바르게 설정되었는지 확인
- branch protection rules 확인
- `src/data/prs/` 디렉토리에 PR JSON 파일이 있는지 확인
- 로컬에서 `GITHUB_TOKEN=your_token pnpm prebuild` 실행해서 수동 동기화

### 로컬에서 PR 데이터가 안 보임

- `pnpm prebuild` 실행했는지 확인
- `public/data/prs-recent.json` 파일이 생성되었는지 확인
- 개발 서버 재시작

### 빌드 에러

- TypeScript 에러 확인: `pnpm run lint`
- 의존성 재설치: `pnpm install`
- `.next` 캐시 삭제 후 재빌드
- PR 데이터 스크립트 실행 확인: `pnpm prebuild`

### JSON 파일 404 에러 (배포 후)

- `public/data/` 디렉토리가 빌드에 포함되었는지 확인
- GitHub Pages 배포 시 basePath가 올바른지 확인
- `out/data/` 디렉토리에 JSON 파일이 있는지 확인

## 7. 커스터마이징

### 배너에 표시되는 PR 개수 변경

`src/app/layout.tsx`:

```typescript
<PRBanner maxPRs={5} /> // 5개로 변경
```

### PR 댓글 시스템 컴포넌트

#### 댓글 표시 방식 (4가지)

1. **🆕 MDX 소스 뷰어 (PR 리뷰 모드)** (`src/components/SourceViewWithComments.tsx`)
   - GitHub처럼 MDX 소스 파일과 PR 리뷰를 함께 표시
   - 좌측 하단 "📄 소스 보기" 버튼으로 우측 사이드 패널 토글
   - 화면 우측 절반에 소스 뷰어 표시
   - 기존 렌더링된 페이지와 소스를 동시에 확인 가능
   - 각 라인 번호와 소스 코드 표시
   - 댓글이 있는 라인은 노란색 하이라이트
   - 라인 hover 시 💬 버튼으로 인라인 댓글 확장/축소
   - GitHub raw URL에서 실제 MDX 파일 로드

2. **인라인 코드 댓글** (`src/components/CodeBlockWithComments.tsx`)
   - 코드 블록의 특정 라인 옆에 댓글 직접 표시
   - 댓글이 있는 라인 하이라이트 및 💬 버튼 표시
   - 클릭으로 인라인 댓글 확장/축소
   - `mdx-components.js`를 통해 모든 코드 블록에 자동 적용

3. **페이지 하단 댓글** (`src/components/PRComments.tsx`)
   - 챕터별 모든 관련 댓글 표시
   - 스레드형 계층 구조 지원
   - `PageWrapper.tsx`를 통해 자동 추가

4. **사이드바 댓글 패널** (`src/components/CommentSidebar.tsx`)
   - 우측 플로팅 버튼으로 토글
   - 라인 번호별 정렬

#### 기타 컴포넌트

- `src/components/PRBanner.tsx` - 상단 배너 스타일
- `src/components/PRList.tsx` - PR 목록 페이지 스타일
- `src/components/CommentReactions.tsx` - GitHub 호환 이모티콘 반응 표시
- `src/components/PageWrapper.tsx` - 모든 페이지에 자동으로 PRComments 추가

## 8. 추가 리소스

- [Nextra 문서](https://nextra.site)
- [GitHub Actions 문서](https://docs.github.com/actions)
- [Next.js 문서](https://nextjs.org/docs)

## 9. 기여하기

새로운 기능이나 개선 사항이 있다면:

1. 이슈 생성
2. 기능 구현
3. PR 생성
4. 리뷰 요청

문의사항은 GitHub Issues에 남겨주세요!
