# PRwiki

> PR 리뷰를 더 보기 편하게 해주는 PR 기반 위키 시스템 (나무위키 느낌)

PRwiki는 GitHub Pull Request를 기반으로 한 협업형 위키 시스템입니다. 복잡한 PR 리뷰를 나무위키처럼 편하게 읽고, 댓글을 작성하고, 지식을 공유할 수 있습니다.

## ✨ 주요 특징

- **📝 PR 기반 콘텐츠**: GitHub Pull Request를 통해 콘텐츠를 관리하고 토론
- **💬 실시간 댓글 시스템**: PR 댓글을 웹사이트에서 직접 작성/수정/삭제
- **🔍 나무위키 스타일**: 익숙하고 편한 위키 형식으로 PR 리뷰 탐색
- **⚡ 완전 정적 사이트**: GitHub Pages로 호스팅, 서버 불필요
- **🤖 자동화**: GitHub Actions로 PR 데이터 자동 동기화

## 🎯 사용 사례

- **팀 프로젝트 문서화**: PR 기반으로 팀 지식 베이스 구축
- **코드 리뷰 아카이빙**: 중요한 리뷰와 토론을 위키 형식으로 보존
- **학습 커뮤니티**: 스터디 그룹의 PR을 통한 협업 학습
- **오픈소스 문서**: 기여자들의 PR 논의를 체계적으로 정리

## 📦 PR 댓글 시스템

스터디 웹사이트에 GitHub PR 댓글을 자동으로 표시하고 **직접 작성/수정/삭제**할 수 있는 시스템이 구현되어 있습니다!

### 🆕 댓글 작성 및 편집

- **GitHub OAuth 로그인**: 본인 이름으로 댓글 작성
- **익명 댓글**: 로그인 없이도 Bot을 통해 댓글 작성 가능
- **댓글 수정/삭제**: 로그인한 사용자는 본인 댓글만 수정/삭제 가능
- **자동 PR 매칭**: 파일별로 최신 merged PR 자동 탐지
- **자동 PR 생성**: 관련 PR이 없는 파일은 댓글 전용 PR 자동 생성 및 병합
- **실시간 반영**: GitHub PR에 작성된 댓글이 즉시 표시됨

### 📊 PR 관리 기능

#### 1. 상단 PR 배너
- 최근 3개의 PR이 상단에 표시됩니다
- PR 상태 (Open/Merged/Closed)를 한눈에 확인
- 클릭하면 GitHub PR 페이지로 이동

#### 2. PR 목록 페이지 (`/prs`)
- 모든 PR을 한 곳에서 확인
- 상태별 필터링 (Open/Merged/Closed)
- PR 메타데이터, 댓글 수, 변경 파일 목록 표시

#### 3. 챕터별 PR 댓글

**🆕 페이지 내 인라인 PR 리뷰**
- PR 리뷰 댓글이 있는 페이지에 자동으로 알림 표시
- "소스 + 리뷰 보기" 버튼으로 전환
- GitHub처럼 MDX 소스 각 라인과 PR 리뷰를 함께 표시
- 댓글이 있는 라인은 노란색 하이라이트
- 각 라인 아래에 PR 댓글이 바로 표시됨
- "렌더링 보기" 버튼으로 일반 뷰로 전환 가능

**기타 댓글 표시 방식**
- **인라인 코드 댓글**: 코드 블록의 특정 라인 옆에 댓글 직접 표시
- **페이지 하단 댓글 표시**: 각 챕터 페이지 하단에 관련 PR의 모든 댓글 자동 표시
- **사이드바 댓글 패널**: 우측 하단 플로팅 버튼(💬)으로 댓글 사이드바 토글
- 파일 경로 기반으로 관련 PR 자동 탐지
- PR 댓글, 코드 리뷰 댓글 모두 표시
- **스레드형 댓글**: 답글이 있는 댓글은 계층 구조로 표시
- **GitHub 호환 이모티콘 반응**: 👍 👎 😄 🎉 😕 ❤️ 🚀 👀 등 GitHub 반응 지원

### 🚀 완전 정적 사이트

- ✅ **GitHub Pages 최적화**: Next.js `output: 'export'` 모드
- ✅ **서버 불필요**: 모든 데이터는 빌드 타임에 JSON으로 생성
- ✅ **빠른 로딩**: 정적 파일만 서빙

## 🔄 자동화 흐름

### 실시간 PR 이벤트 처리
```
PR 생성/댓글 추가/Merge
    ↓
GitHub Actions 자동 실행
    ↓
merged PR만 src/data/prs/pr-{번호}.json 저장
    ↓
자동 커밋 및 푸시
```

### 빌드 시 데이터 생성
```
pnpm prebuild 실행
    ↓
GitHub API에서 모든 merged PR 동기화
    ↓
로컬에 없는 PR 데이터 저장
    ↓
public/data/*.json 생성
    ↓
웹사이트에서 PR 정보 표시
```

## 💻 로컬 개발

### 읽기 전용 모드 (댓글 표시만)

```bash
# 1. 의존성 설치
pnpm install

# 2. PR 데이터 동기화 및 생성
# GitHub 토큰과 함께 실행하여 모든 merged PR 가져오기
GITHUB_TOKEN=your_token_here pnpm prebuild

# 3. 개발 서버 실행
pnpm dev

# 4. 전체 빌드 (배포용)
pnpm build:search
```

**참고**: `GITHUB_TOKEN` 없이 `pnpm prebuild`를 실행하면 이미 로컬에 저장된 PR 데이터만 사용합니다.

### 댓글 작성 기능 활성화

댓글 작성/수정/삭제 기능을 사용하려면:

1. **GitHub App 생성**: [docs/GITHUB_APP_SETUP.md](./docs/GITHUB_APP_SETUP.md) 문서를 따라 GitHub App을 생성하세요.
2. **환경 변수 설정**: `.env.local` 파일을 생성하고 필요한 환경 변수를 설정하세요. (템플릿: [.env.example](./.env.example))
3. **개발 서버 실행**: `pnpm dev`로 로컬 서버를 시작하세요.

상세한 설정 및 사용 방법은 [SETUP.md](./SETUP.md)를 참고하세요.

## 🛠 기술 스택

- **Framework**: [Next.js](https://nextjs.org/) 15 (Static Export)
- **Documentation**: [Nextra](https://nextra.site/)
- **Styling**: Tailwind CSS
- **GitHub Integration**: Octokit REST API
- **Auth**: GitHub OAuth + iron-session
- **Search**: Pagefind
- **Deployment**: GitHub Pages

## 📚 문서

- [Setup Guide](./SETUP.md) - 상세한 설정 가이드
- [GitHub App Setup](./docs/GITHUB_APP_SETUP.md) - GitHub App 생성 방법
- [TODO](./docs/TODO.md) - 개발 로드맵

## 🤝 기여하기

PRwiki는 오픈소스 프로젝트입니다. 기여는 언제나 환영합니다!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - 자유롭게 사용하세요!

## 💡 영감

- [Nextra](https://nextra.site/) - 문서 프레임워크
- [Namuwiki](https://namu.wiki/) - 위키 UX 참고
- [giscus](https://giscus.app/) / [utterances](https://utteranc.es/) - GitHub 기반 댓글 시스템
