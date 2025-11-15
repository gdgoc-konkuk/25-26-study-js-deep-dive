// GitHub API 클라이언트 생성 및 관리

import { Octokit } from '@octokit/rest';
import { App } from '@octokit/app';

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
 * GitHub App으로 인증된 Octokit 인스턴스 생성 (비로그인 댓글용)
 * @returns GitHub App으로 인증된 Octokit 인스턴스
 */
export async function getBotClient(): Promise<Octokit> {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY;
  const { owner, repo } = getRepositoryInfo();

  if (!appId || !privateKey) {
    throw new Error('GITHUB_APP_ID 및 GITHUB_PRIVATE_KEY 환경 변수가 설정되지 않았습니다.');
  }

  console.log('🔐 GitHub App 인증 중...');
  console.log(`   Repository: ${owner}/${repo}`);

  try {
    // GitHub App 인스턴스 생성
    const app = new App({
      appId,
      privateKey,
    });

    // 리포지토리의 Installation ID 가져오기
    const { data: installation } = await app.octokit.request(
      'GET /repos/{owner}/{repo}/installation',
      {
        owner,
        repo,
      }
    );

    console.log(`   ✓ Installation ID: ${installation.id}`);

    // Installation Token 생성
    const { token } = await app.octokit.auth({
      type: 'installation',
      installationId: installation.id,
    }) as { token: string };

    console.log('   ✓ Installation Token 생성 완료');

    // @octokit/rest의 Octokit 인스턴스 생성
    const octokit = new Octokit({
      auth: token,
    });

    console.log('   ✓ GitHub App 인증 성공');

    return octokit;
  } catch (error) {
    console.error('❌ GitHub App 인증 실패:', error);
    throw error;
  }
}

/**
 * Bot 클라이언트 가져오기 (하위 호환성)
 */
export async function getAppClient(): Promise<Octokit> {
  return await getBotClient();
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
