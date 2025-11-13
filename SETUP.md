# PR 댓글 및 인라인 댓글 시스템 설정 가이드

이 문서는 새로 추가된 PR 정보 표시 및 인라인 댓글 기능을 활성화하기 위한 설정 가이드입니다.

## ⚡ 중요: GitHub Pages 전용 정적 빌드

이 프로젝트는 **완전 정적 사이트**로 빌드되어 GitHub Pages에 배포됩니다.
- ✅ Next.js API 라우트 없음
- ✅ 모든 PR 데이터는 빌드 타임에 JSON 파일로 생성
- ✅ 클라이언트에서 정적 JSON 파일만 로드

## 1. GitHub Discussions 활성화

인라인 댓글 기능을 사용하려면 GitHub Discussions를 활성화해야 합니다.

1. Repository 페이지로 이동
2. **Settings** 탭 클릭
3. **Features** 섹션에서 **Discussions** 체크박스 활성화
4. **Set up discussions** 클릭

## 2. Discussions 카테고리 생성

1. Repository의 **Discussions** 탭으로 이동
2. 오른쪽 **Categories** 섹션에서 **Edit** 클릭
3. **New category** 버튼 클릭
4. 다음 정보 입력:
   - **Name**: `Inline Comments`
   - **Description**: `인라인 댓글을 위한 카테고리`
   - **Format**: `Announcement` (또는 `General`)
5. **Create** 클릭

## 3. giscus 설정

### 3.1 Repository ID와 Category ID 확인

1. [giscus.app](https://giscus.app) 방문
2. **Configuration** 섹션에서:
   - **Repository**: `gdgoc-konkuk/25-26-study-js-deep-dive` 입력
   - repository가 public이고 discussions가 활성화되었는지 확인
3. **Discussion Category** 섹션에서:
   - `Inline Comments` 카테고리 선택
4. 페이지 하단 **Enable giscus** 섹션에서 생성된 스크립트 확인:
   ```html
   <script src="https://giscus.app/client.js"
           data-repo="gdgoc-konkuk/25-26-study-js-deep-dive"
           data-repo-id="여기에_REPO_ID가_표시됨"
           data-category="Inline Comments"
           data-category-id="여기에_CATEGORY_ID가_표시됨"
           ...>
   </script>
   ```
5. `data-repo-id`와 `data-category-id` 값을 복사

### 3.2 프로젝트에 ID 입력

`src/config/giscus.ts` 파일을 열고 다음 값을 업데이트:

```typescript
export const giscusConfig = {
  repo: 'gdgoc-konkuk/25-26-study-js-deep-dive',
  repoId: 'YOUR_REPO_ID',       // 여기에 복사한 repo-id 입력
  category: 'Inline Comments',
  categoryId: 'YOUR_CATEGORY_ID', // 여기에 복사한 category-id 입력
  mapping: 'pathname',
  // ...
} as const;
```

## 4. GitHub Actions 권한 설정

### 4.1 Workflow 권한 확인

1. Repository **Settings** > **Actions** > **General**로 이동
2. **Workflow permissions** 섹션에서:
   - **Read and write permissions** 선택
   - **Allow GitHub Actions to create and approve pull requests** 체크
3. **Save** 클릭

### 4.2 자동 커밋 설정 (선택사항)

PR 데이터가 자동으로 커밋되지 않는 경우, branch protection rules를 확인하세요:

1. **Settings** > **Branches**
2. `main` 브랜치의 protection rules 확인
3. `github-actions[bot]`이 직접 커밋할 수 있도록 예외 설정 필요 시 추가

## 5. 데이터 디렉토리 생성

처음 실행 시 다음 디렉토리가 자동으로 생성됩니다:

```
src/data/
├── prs/              # PR 데이터 저장
└── inline-comments/  # 인라인 댓글 데이터 저장
```

수동으로 생성하려면:

```bash
mkdir -p src/data/prs src/data/inline-comments
```

## 6. 로컬 개발 환경 설정

### 6.1 의존성 설치

```bash
pnpm install
```

### 6.2 PR 데이터 생성 (빌드 전 필수)

빌드하기 전에 PR 데이터를 생성해야 합니다:

```bash
pnpm prebuild
```

이 명령은 `src/data/prs/*.json` 파일을 읽어서 `public/data/` 디렉토리에 다음 파일들을 생성합니다:
- `prs-recent.json` - 모든 PR 목록
- `prs-by-file.json` - 파일별 PR 매핑

### 6.3 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 `http://localhost:3000` 접속

**참고**: 개발 모드에서는 `/data/*.json` 파일이 `public/` 디렉토리에 있어야 합니다.

### 6.4 PR 데이터 테스트 (선택사항)

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

## 7. 배포

### 7.1 빌드 프로세스

빌드 시 다음 순서로 진행됩니다:

1. `pnpm prebuild` - PR 데이터 JSON 생성
2. `next build` - Next.js 정적 사이트 빌드
3. `pagefind` - 검색 인덱스 생성

전체 빌드:
```bash
pnpm build:search
```

### 7.2 자동 배포

`main` 브랜치에 푸시하면 자동으로 배포됩니다:

```bash
git add .
git commit -m "feat: add PR comment system"
git push origin main
```

GitHub Actions가 자동으로:
1. PR 데이터 생성
2. 사이트 빌드
3. GitHub Pages에 배포

### 7.3 수동 배포 (gh-pages)

```bash
pnpm deploy
```

## 8. 기능 확인

### 8.1 PR 정보 표시 확인

1. PR을 생성하거나 기존 PR에 댓글 추가
2. 몇 분 후 GitHub Actions workflow 완료 확인
3. 배포된 사이트에서 상단 배너에 PR 표시 확인
4. `/prs` 페이지에서 PR 목록 확인

### 8.2 인라인 댓글 확인

1. 배포된 사이트에서 텍스트 선택
2. "댓글 달기" 버튼 표시 확인
3. 클릭하여 댓글 모달 오픈 확인
4. GitHub 계정으로 로그인하여 댓글 작성

## 9. 트러블슈팅

### PR 데이터가 업데이트되지 않음

- GitHub Actions 탭에서 workflow 실행 로그 확인
- Workflow permissions이 올바르게 설정되었는지 확인
- branch protection rules 확인
- `src/data/prs/` 디렉토리에 PR JSON 파일이 있는지 확인

### 로컬에서 PR 데이터가 안 보임

- `pnpm prebuild` 실행했는지 확인
- `public/data/prs-recent.json` 파일이 생성되었는지 확인
- 개발 서버 재시작

### 인라인 댓글이 작동하지 않음

- `src/config/giscus.ts`의 ID가 올바른지 확인
- Discussions가 활성화되었는지 확인
- 브라우저 콘솔에서 에러 메시지 확인

### 빌드 에러

- TypeScript 에러 확인: `pnpm run lint`
- 의존성 재설치: `pnpm install`
- `.next` 캐시 삭제 후 재빌드
- PR 데이터 스크립트 실행 확인: `pnpm prebuild`

### JSON 파일 404 에러 (배포 후)

- `public/data/` 디렉토리가 빌드에 포함되었는지 확인
- GitHub Pages 배포 시 basePath가 올바른지 확인
- `out/data/` 디렉토리에 JSON 파일이 있는지 확인

## 10. 추가 커스터마이징

### 배너에 표시되는 PR 개수 변경

`src/app/layout.tsx`:

```typescript
<PRBanner maxPRs={5} /> // 5개로 변경
```

### 댓글 모달 스타일 변경

`src/components/CommentModal.tsx` 파일에서 Tailwind 클래스 수정

### PR 필터링 로직 변경

`src/utils/prData.ts`의 `findRelatedPRs` 함수 수정

## 11. 추가 리소스

- [Nextra 문서](https://nextra.site)
- [giscus 문서](https://giscus.app)
- [GitHub Actions 문서](https://docs.github.com/actions)
- [Next.js 문서](https://nextjs.org/docs)

## 12. 기여하기

새로운 기능이나 개선 사항이 있다면:

1. 이슈 생성
2. 기능 구현
3. PR 생성
4. 리뷰 요청

문의사항은 GitHub Issues에 남겨주세요!
