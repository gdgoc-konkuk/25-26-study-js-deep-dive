// GitHub API 클라이언트 생성 및 관리

import { Octokit } from '@octokit/rest';

/**
 * 사용자 OAuth 토큰으로 Octokit 클라이언트 생성
 * @param token - GitHub OAuth access token
 * @returns 인증된 Octokit 인스턴스
 */
export function getAuthenticatedClient(token: string): Octokit {
  return new Octokit({
    auth: token,
  });
}

/**
 * Bot 토큰으로 Octokit 클라이언트 생성 (비로그인 댓글용)
 * @returns Bot 인증된 Octokit 인스턴스
 */
export function getBotClient(): Octokit {
  const botToken = process.env.GITHUB_BOT_TOKEN;

  if (!botToken) {
    throw new Error('GITHUB_BOT_TOKEN 환경 변수가 설정되지 않았습니다.');
  }

  return new Octokit({
    auth: botToken,
  });
}

/**
 * GitHub App으로 인증된 클라이언트 생성 (향후 확장용)
 * 현재는 OAuth와 Bot Token만 사용하지만, 추후 GitHub App Installation Token 지원 가능
 */
export function getAppClient(): Octokit {
  // GitHub App 인증 로직 (향후 구현)
  // 현재는 Bot 클라이언트 반환
  return getBotClient();
}

/**
 * Repository 정보 가져오기
 */
export function getRepositoryInfo() {
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;

  if (!owner || !repo) {
    throw new Error(
      'GITHUB_REPO_OWNER 및 GITHUB_REPO_NAME 환경 변수가 설정되지 않았습니다.'
    );
  }

  return { owner, repo };
}
